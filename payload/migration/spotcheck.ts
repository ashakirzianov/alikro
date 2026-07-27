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
            // A record with no *file* is a different condition from a record
            // whose renditions failed to generate, and only the second is a
            // media defect. Payload skips upload validation for drafts, so a
            // draft create with no file mints an imageless artwork — the
            // criterion-4 probe keeps one deliberately (`c4-probe-draft-no-file`)
            // as the evidence for that gap.
            //
            // Scoped as tightly as the condition allows: a *published* record,
            // or any record that came from the migration, is still a failure
            // even with no file. Only an unmigrated draft that never had bytes
            // is excused, and it is announced rather than passed over quietly.
            const fromMigration = crowExport.assets.some(
                asset => asset.id === doc.slug || asset.fileName === doc.filename,
            )
            if (!doc.filename && doc._status === 'draft' && !fromMigration) {
                console.log(`  ${slug}: draft with no file at all — not from the migration, so not a rendition failure`)
                continue
            }
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
        //
        // Records created *after* the migration — anything uploaded through the
        // admin — have no Crow counterpart and are not parity failures. They are
        // told apart by the export's own join key, `fileName`: a migrated record
        // whose slug drifted still matches on filename, so genuine drift is
        // still caught, while a native upload matches on neither and is skipped.
        // Without this the two playtest drafts fail forever, and a permanently
        // red check is one nobody reads.
        const crow = crowExport.assets.find(asset => asset.id === doc.slug)
        const crowByFile = crow
            ?? crowExport.assets.find(asset => asset.fileName === doc.filename)
        if (!crow && !crowByFile) {
            console.log(`  ${slug}: not from the migration — Crow parity checks skipped`)
        } else if (!crow) {
            failures.push({ slug, problem: `slug was not carried: Crow has "${crowByFile!.id}" for ${doc.filename}` })
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

        // The "material produced no relations" assertion lived here. It went
        // with the taxonomy on 2026-07-27 — there are no relations to check any
        // more, and the raw string is now checked verbatim against Crow above,
        // which is the whole of what the flat shape promises.

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

    failures.push(...await checkNoDraftReachesTheSite(payload))

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

// Drafts must never reach the site. `access.read` on the collection already
// scopes anonymous reads to published — but the site reads through the Local
// API, which bypasses access control entirely, so that predicate never runs for
// it. The `_status` filter therefore has to live in the query itself, and this
// is the guard that it still does.
//
// It calls the real `fetchAllAssetMetadataFromPayload()` rather than
// reconstructing its query. Reconstructing it would let the guard and the thing
// it guards drift apart, which is precisely how the bug survived: every
// component along that path was individually correct.
//
// Written after the bug shipped. All 630 migrated records are published, so the
// archive alone **cannot express this failure** — the guard is only meaningful
// while at least one draft with `showOnSite: true` exists. It therefore reports
// loudly when it had nothing to test against, rather than passing silently.
async function checkNoDraftReachesTheSite(
    payload: Awaited<ReturnType<typeof getPayload>>,
): Promise<Failure[]> {
    const { fetchAllAssetMetadataFromPayload } = await import('../../shared/payloadContent')

    const drafts = await payload.find({
        collection: 'artworks',
        limit: 0,
        pagination: false,
        overrideAccess: true,
        draft: true,
        where: { _status: { equals: 'draft' } },
    })
    const fixtures = drafts.docs.filter(doc => doc.showOnSite === true)

    console.log(
        `\nDraft-leak guard: ${drafts.totalDocs} draft(s) in the archive, `
        + `${fixtures.length} of them with showOnSite=true.`,
    )

    if (fixtures.length === 0) {
        console.log(
            '  NOT EXERCISED — no draft carries showOnSite=true, so nothing here '
            + 'can express the failure. Treat this check as unproven, not as passing.',
        )
    }

    const published = await fetchAllAssetMetadataFromPayload()
    const visible = new Set(published.map(asset => asset.id))
    const leaked = drafts.docs.filter(doc => doc.slug && visible.has(doc.slug))

    if (leaked.length === 0 && fixtures.length > 0) {
        console.log(
            `  OK — the site layer returned ${published.length} asset(s) and none `
            + `of the ${drafts.totalDocs} draft(s) is among them.`,
        )
    }

    return leaked.map(doc => ({
        slug: doc.slug ?? `(id ${doc.id})`,
        problem: 'DRAFT IS PUBLICLY VISIBLE — it is in what the site renders',
    }))
}

if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) {
    main().catch(error => {
        console.error(error)
        process.exit(1)
    })
}
