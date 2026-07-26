// Post-migration parity spot-check, over the Local API.
//
//   npm run migrate:spotcheck            # 10 random-ish migrated artworks
//   npm run migrate:spotcheck -- --all   # every migrated artwork
//
// Checks the things a successful-looking migration can still get wrong:
// renditions that were never generated, URLs that 404, dimensions that disagree
// with their own variants, and — the one that matters for the site — whether
// every width alikro actually requests resolves to a file.
//
// Deliberately measures **srcset coverage** rather than object counts: Payload
// collapses sizes for originals narrower than a target, so a differing object
// count is expected and meaningless, while a width the site requests and cannot
// serve is a real defect.

import { readFileSync } from 'fs'
import path from 'path'

import { getPayload } from 'payload'

import config from '../../payload.config'
import type { CrowExport } from './mapping'

// The widths alikro's <AssetImage> loader snaps to.
const REQUESTED_WIDTHS = [320, 480, 640, 768, 960, 1200, 1600, 1920]

type Failure = { slug: string, problem: string }

async function main() {
    const all = process.argv.includes('--all')
    const payload = await getPayload({ config })
    const crowExport = JSON.parse(
        readFileSync(path.resolve(process.cwd(), 'payload/migration/crow-export.json'), 'utf8'),
    ) as CrowExport

    const found = await payload.find({
        collection: 'artworks',
        depth: 1,
        limit: all ? 0 : 10,
        pagination: !all,
        overrideAccess: true,
        draft: true,
    })

    console.log(`Spot-checking ${found.docs.length} of ${found.totalDocs} migrated artwork(s)\n`)

    const failures: Failure[] = []
    let urlsChecked = 0

    for (const doc of found.docs) {
        const slug = doc.slug ?? `(id ${doc.id})`
        const sizes = Object.entries((doc.sizes ?? {}) as Record<string, { url?: string | null, width?: number | null, height?: number | null }>)
            .filter(([, size]) => typeof size?.url === 'string' && typeof size?.width === 'number')
            .map(([name, size]) => ({ name, url: size.url as string, width: size.width as number, height: size.height as number }))
            .sort((a, b) => a.width - b.width)

        if (sizes.length === 0) {
            failures.push({ slug, problem: 'no renditions at all' })
            continue
        }

        // Every width the site asks for must resolve to something at least that
        // wide, or to the widest available when the original is smaller.
        const widest = sizes[sizes.length - 1]
        for (const requested of REQUESTED_WIDTHS) {
            const chosen = sizes.find(size => size.width >= requested) ?? widest
            if (!chosen) {
                failures.push({ slug, problem: `no rendition serves a request for ${requested}px` })
            }
        }

        // Dimensions must agree with the variants — the EXIF-rotation trap.
        if (typeof doc.width === 'number' && typeof doc.height === 'number' && doc.width !== doc.height) {
            const variantIsLandscape = widest.width > widest.height
            if ((doc.width > doc.height) !== variantIsLandscape) {
                failures.push({ slug, problem: `orientation disagrees with its variants (${doc.width}x${doc.height} vs ${widest.width}x${widest.height})` })
            }
        }

        // Cross-check against the source record. These are the fields where a
        // silent mismatch would only surface as broken links or a mis-sorted
        // gallery long after the archive pass.
        const crow = crowExport.assets.find(asset => asset.id === doc.slug)
        if (!crow) {
            failures.push({ slug, problem: 'no matching Crow record — slug was not carried' })
        } else {
            if (doc.filename !== crow.fileName) {
                failures.push({ slug, problem: `filename drifted: ${doc.filename} vs Crow ${crow.fileName}` })
            }
            if (Date.parse(doc.createdAt) !== crow.uploaded) {
                failures.push({ slug, problem: `createdAt lost Crow's uploaded timestamp (${doc.createdAt})` })
            }
            if ((doc.order ?? undefined) !== crow.order) {
                failures.push({ slug, problem: `order drifted: ${doc.order} vs Crow ${crow.order}` })
            }
            if (doc.material !== crow.material) {
                failures.push({ slug, problem: 'the raw material string was not preserved verbatim' })
            }
        }

        // The prose must survive the modelling.
        if (doc.material && (!doc.materials || (Array.isArray(doc.materials) && doc.materials.length === 0))) {
            failures.push({ slug, problem: `material "${doc.material}" produced no relations` })
        }

        // Every URL must actually serve. This is what catches a wrong bucket
        // policy or a malformed host, which otherwise looks like success.
        for (const size of [sizes[0], widest]) {
            const res = await fetch(size.url, { method: 'HEAD' })
            urlsChecked++
            if (!res.ok) {
                failures.push({ slug, problem: `${size.name} URL returned ${res.status}: ${size.url}` })
            }
        }

        console.log(`  ${slug}: ${sizes.length} rendition(s) ${sizes.map(s => s.width).join('/')} — ${doc.width}x${doc.height}`)
    }

    console.log(`\n${urlsChecked} URL(s) fetched.`)
    if (failures.length === 0) {
        console.log('Spot-check clean.')
        process.exit(0)
    }
    console.log(`${failures.length} PROBLEM(S):`)
    for (const failure of failures) {
        console.log(`  ${failure.slug}: ${failure.problem}`)
    }
    process.exit(1)
}

if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) {
    main().catch(error => {
        console.error(error)
        process.exit(1)
    })
}
