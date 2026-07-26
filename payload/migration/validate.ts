// Dry run. Everything that can be checked before Neon and S3 exist:
// the whole-archive field transform, and the media assumptions the parity
// argument rests on.
//
//   npm run migrate:validate
//
// Needs no database, no bucket and no staged files. Set CROW_STAGING_DIR to
// additionally check that every record has its original on disk.

import { access, readFile } from 'fs/promises'
import path from 'path'

import sharp from 'sharp'

import { mapExport, type CrowExport } from './mapping'
import { SERIES_SEEDS } from './series'

const EXPORT_PATH = path.resolve(process.cwd(), 'payload/migration/crow-export.json')

// Crow's settings, mirrored in the Artworks collection.
const VARIANT_WIDTHS = [320, 480, 640, 768, 960, 1200, 1600, 1920]
const WEBP_OPTIONS = { quality: 80, effort: 5, smartSubsample: true }

// Payload decides whether to generate imageSizes from this list
// (payload/dist/uploads/canResizeImage.js). It is not exported, so it is
// mirrored here — if an upgrade changes it, this probe stops matching reality
// and the parity claim needs re-checking.
const PAYLOAD_RESIZABLE_MIME_TYPES = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/tiff', 'image/avif',
]

async function main() {
    const raw = await readFile(EXPORT_PATH, 'utf8')
    const crowExport = JSON.parse(raw) as CrowExport
    const ageHours = (Date.now() - Date.parse(crowExport.exportedAt)) / 3_600_000

    console.log(`Export: ${crowExport.count} assets, ${ageHours.toFixed(1)}h old, from ${crowExport.source}`)

    const { artworks, issues } = mapExport(crowExport.assets)

    // --- field transform -----------------------------------------------------
    const byMedium = tally(artworks.map(a => a.medium ?? '(none)'))
    const byStatus = tally(artworks.map(a => a.status))
    const seriesLinks = tally(artworks.flatMap(a => a.seriesSlugs))
    const flatTags = tally(artworks.flatMap(a => a.tags))

    console.log(`\nmedium: ${format(byMedium)}`)
    console.log(`status: ${format(byStatus)}`)
    console.log(`showOnSite=false: ${artworks.filter(a => !a.showOnSite).length}`)
    console.log(`flat tags: ${format(flatTags)}`)
    console.log(`\nseries (${seriesLinks.size} of ${SERIES_SEEDS.length} seeded receive members):`)
    console.log(`  ${format(seriesLinks)}`)
    const empty = SERIES_SEEDS.filter(seed => !seriesLinks.has(seed.slug)).map(seed => seed.slug)
    if (empty.length > 0) {
        console.log(`  empty: ${empty.join(', ')}`)
    }

    // --- invariants ----------------------------------------------------------
    const failures: string[] = []
    check(failures, artworks.every(a => a.slug.length > 0), 'every artwork has a slug')
    check(failures, new Set(artworks.map(a => a.slug)).size === artworks.length, 'slugs are unique')
    check(failures, artworks.every(a => !Number.isNaN(Date.parse(a.uploadedAt))), 'every uploadedAt parses as a date')
    check(failures, artworks.every(a => a.fileName.length > 0), 'every artwork has a fileName to join on')
    check(failures, new Set(artworks.map(a => a.fileName)).size === artworks.length, 'fileNames are unique (clean join)')
    check(failures, artworks.every(a => a.seriesSlugs.every(slug => SERIES_SEEDS.some(seed => seed.slug === slug))), 'every series link resolves to a seed')
    check(failures, artworks.filter(a => a.status === 'draft').every(a => a.medium === undefined), 'drafts are the records with no medium')

    // The whole point of carrying rather than deriving slugs.
    const derived = artworks.filter(a => a.slug !== deriveSlug(a.fileName))
    console.log(`\nslugs that would break if recomputed from the filename: ${derived.length}`)

    if (issues.length > 0) {
        console.log(`\n${issues.length} mapping issue(s):`)
        for (const issue of issues.slice(0, 40)) {
            console.log(`  [${issue.field}] ${issue.slug}: ${issue.message}`)
        }
        if (issues.length > 40) {
            console.log(`  … ${issues.length - 40} more`)
        }
    }

    // --- media ---------------------------------------------------------------
    console.log('\nmedia:')
    const extensions = tally(crowExport.assets.map(a => a.fileName.split('.').pop()?.toLowerCase() ?? '?'))
    console.log(`  formats in the archive: ${format(extensions)}`)
    const archiveMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/tiff']
    for (const mimeType of archiveMimeTypes) {
        const resizable = PAYLOAD_RESIZABLE_MIME_TYPES.includes(mimeType)
        console.log(`  ${resizable ? 'ok  ' : 'FAIL'} Payload generates imageSizes for ${mimeType}`)
        if (!resizable) {
            failures.push(`Payload cannot resize ${mimeType}`)
        }
    }

    await probeVariants('png', await sharp({ create: { width: 2400, height: 1600, channels: 3, background: '#888' } }).png().toBuffer())
    await probeVariants('tiff', await sharp({ create: { width: 900, height: 1400, channels: 3, background: '#888' } }).tiff().toBuffer())

    // --- staged files --------------------------------------------------------
    const stagingDir = process.env.CROW_STAGING_DIR
    if (stagingDir) {
        const missing: string[] = []
        for (const artwork of artworks) {
            try {
                await access(path.join(stagingDir, artwork.fileName))
            } catch {
                missing.push(artwork.fileName)
            }
        }
        console.log(`\nstaged originals missing: ${missing.length}`)
        missing.slice(0, 10).forEach(name => console.log(`  ${name}`))
    } else {
        console.log('\nstaged originals: not checked (set CROW_STAGING_DIR)')
    }

    console.log(failures.length === 0 ? '\nAll invariants hold.' : `\n${failures.length} INVARIANT FAILURE(S)`)
    process.exit(failures.length === 0 ? 0 : 1)
}

// Reproduces what Payload's pipeline will do to one original, so the collapse
// behaviour is a measured number rather than a prediction.
async function probeVariants(label: string, input: Buffer) {
    const meta = await sharp(input).metadata()
    const outputs = new Map<string, number[]>()
    for (const width of VARIANT_WIDTHS) {
        const { info } = await sharp(input)
            .rotate()
            .resize({ width, withoutEnlargement: true })
            .webp(WEBP_OPTIONS)
            .toBuffer({ resolveWithObject: true })
        const key = `${info.width}x${info.height}`
        outputs.set(key, [...(outputs.get(key) ?? []), width])
    }
    const collapsed = [...outputs.values()].filter(widths => widths.length > 1)
    console.log(`  ${label} ${meta.width}x${meta.height}: 8 sizes -> ${outputs.size} distinct file(s)`
        + (collapsed.length > 0 ? `; collapsed: ${collapsed.map(w => w.join('/')).join(', ')}` : ''))
}

function deriveSlug(fileName: string) {
    const lastDot = fileName.lastIndexOf('.')
    const base = lastDot === -1 ? fileName : fileName.slice(0, lastDot)
    return base.toLowerCase().replace(/[^a-zA-Z0-9]/g, '-')
}

function tally(values: string[]) {
    const counts = new Map<string, number>()
    for (const value of values) {
        counts.set(value, (counts.get(value) ?? 0) + 1)
    }
    return counts
}

function format(counts: Map<string, number>) {
    return [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([key, count]) => `${key}=${count}`)
        .join(' ')
}

function check(failures: string[], condition: boolean, description: string) {
    console.log(`  ${condition ? 'ok  ' : 'FAIL'} ${description}`)
    if (!condition) {
        failures.push(description)
    }
}

main().catch(error => {
    console.error(error)
    process.exit(1)
})
