// Resumable Crow -> Payload archive migration, over the Local API.
//
// Overnight-class: every original's pixels pass through this machine once down
// and once up, plus eight webp resizes each. It is built to be killed and
// re-run.
//
//   npm run migrate:series     # series documents only, safe to repeat
//   npm run migrate            # series + artworks
//   npm run migrate -- --limit 5
//
// Requires DATABASE_URL, PAYLOAD_SECRET, and CROW_STAGING_DIR (the staging copy
// of alikro/originals/, kept separate from the bucket Payload manages so
// "migrated vs staged" stays diffable).

import { access, appendFile, readFile } from 'fs/promises'
import path from 'path'

import { getPayload } from 'payload'

import config from '../../payload.config'
import { createDataFor, mapExport, type CrowExport, type MappedArtwork } from './mapping'
import { SERIES_SEEDS } from './series'

const EXPORT_PATH = path.resolve(process.cwd(), 'payload/migration/crow-export.json')
const LOG_PATH = path.resolve(process.cwd(), 'payload/migration/.migration-log.jsonl')

// An export older than this is refused: Crow keeps taking uploads, and a stale
// snapshot silently migrates an archive that no longer exists.
const MAX_EXPORT_AGE_HOURS = 24

// Sequential by default. Not for correctness — the ordering index that once
// needed it was removed with the orderable join — but because each document
// means a download, eight sharp resizes and nine uploads, and a serial run
// keeps the log readable and the failure point obvious. Raise it if the archive
// pass proves I/O-bound.
const CONCURRENCY = Number(process.env.MIGRATION_CONCURRENCY ?? 1)

type LogEntry = {
    at: string,
    slug: string,
    outcome: 'created' | 'skipped-existing' | 'skipped-missing-file' | 'failed',
    detail?: string,
}

export async function migrate({ limit, seriesOnly }: { limit?: number, seriesOnly?: boolean } = {}) {
    const stagingDir = process.env.CROW_STAGING_DIR
    if (!seriesOnly && !stagingDir) {
        throw new Error('CROW_STAGING_DIR must point at the staging copy of alikro/originals/')
    }

    const crowExport = await loadExport()
    const { artworks, issues } = mapExport(crowExport.assets)
    if (issues.length > 0) {
        console.warn(`${issues.length} mapping issue(s) — run \`npm run migrate:validate\` for the detail`)
    }

    const payload = await getPayload({ config })

    const seriesIds = await ensureSeries(payload)
    console.log(`Series ready: ${seriesIds.size}`)
    if (seriesOnly) {
        return
    }

    const existing = await loadExistingSlugs(payload)
    console.log(`Already migrated: ${existing.size} of ${artworks.length}`)

    const pending = artworks.filter(artwork => !existing.has(artwork.slug))
    const work = limit ? pending.slice(0, limit) : pending
    console.log(`Migrating ${work.length} artwork(s) with concurrency ${CONCURRENCY}`)

    const counts = { created: 0, missing: 0, failed: 0 }
    await forEachWithConcurrency(work, CONCURRENCY, async artwork => {
        const outcome = await migrateArtwork({ payload, artwork, seriesIds, stagingDir: stagingDir! })
        if (outcome.outcome === 'created') counts.created++
        if (outcome.outcome === 'skipped-missing-file') counts.missing++
        if (outcome.outcome === 'failed') counts.failed++
        await log(outcome)
    })

    console.log(`Done. created=${counts.created} missing=${counts.missing} failed=${counts.failed}`)
    if (counts.failed > 0 || counts.missing > 0) {
        console.log(`Re-run to retry; already-created documents are skipped. Log: ${path.relative(process.cwd(), LOG_PATH)}`)
    }
}

// Idempotent by slug: the series table is the source of truth, and re-running
// updates titles/descriptions rather than duplicating documents.
export async function ensureSeries(payload: Awaited<ReturnType<typeof getPayload>>) {
    const ids = new Map<string, number>()
    for (const seed of SERIES_SEEDS) {
        const found = await payload.find({
            collection: 'series',
            where: { slug: { equals: seed.slug } },
            limit: 1,
            depth: 0,
        })
        const existing = found.docs[0]
        if (existing) {
            ids.set(seed.slug, existing.id)
            continue
        }
        const created = await payload.create({
            collection: 'series',
            data: {
                slug: seed.slug,
                title: seed.title,
                description: seed.description,
            },
        })
        ids.set(seed.slug, created.id)
    }
    return ids
}

async function migrateArtwork({ payload, artwork, seriesIds, stagingDir }: {
    payload: Awaited<ReturnType<typeof getPayload>>,
    artwork: MappedArtwork,
    seriesIds: Map<string, number>,
    stagingDir: string,
}): Promise<LogEntry> {
    const at = new Date().toISOString()
    const filePath = path.join(stagingDir, artwork.fileName)
    try {
        await access(filePath)
    } catch {
        return { at, slug: artwork.slug, outcome: 'skipped-missing-file', detail: filePath }
    }

    const series = artwork.seriesSlugs
        .map(slug => seriesIds.get(slug))
        .filter((id): id is number => id !== undefined)

    try {
        // Passing filePath rather than a buffer lets Payload handle the formats
        // that need a file on disk — the two .tiff originals cannot be measured
        // from a buffer at all.
        await payload.create({
            collection: 'artworks',
            filePath,
            data: {
                ...createDataFor(artwork),
                series,
            },
            // The archive is the source of truth here; access control and the
            // draft/publish workflow are for humans in the admin.
            overrideAccess: true,
            draft: false,
        })
        return { at, slug: artwork.slug, outcome: 'created' }
    } catch (error) {
        // A single unreadable original must not end the run. Crow tolerates
        // these (`failOnError: false`); Payload raises FileUploadError and there
        // is no way to reach the variant pipeline's sharp constructor.
        return {
            at,
            slug: artwork.slug,
            outcome: 'failed',
            detail: error instanceof Error ? error.message : String(error),
        }
    }
}

async function loadExport(): Promise<CrowExport> {
    const raw = await readFile(EXPORT_PATH, 'utf8').catch(() => {
        throw new Error(`No export at ${EXPORT_PATH} — run \`npm run migrate:export\` first`)
    })
    const parsed = JSON.parse(raw) as CrowExport
    const ageHours = (Date.now() - Date.parse(parsed.exportedAt)) / 3_600_000
    if (!Number.isFinite(ageHours)) {
        throw new Error('Export has no usable exportedAt timestamp')
    }
    if (ageHours > MAX_EXPORT_AGE_HOURS && process.env.ALLOW_STALE_EXPORT !== 'true') {
        throw new Error(
            `Export is ${Math.round(ageHours)}h old (limit ${MAX_EXPORT_AGE_HOURS}h). `
            + 'Re-run `npm run migrate:export`, or set ALLOW_STALE_EXPORT=true if you mean it.'
        )
    }
    return parsed
}

// The database is the resume state, not the log — the log is a diagnostic. A
// document that exists is done, however the previous run ended.
async function loadExistingSlugs(payload: Awaited<ReturnType<typeof getPayload>>) {
    const slugs = new Set<string>()
    const found = await payload.find({
        collection: 'artworks',
        depth: 0,
        limit: 0,
        pagination: false,
        select: { slug: true },
        overrideAccess: true,
        draft: true,
    })
    for (const doc of found.docs) {
        if (doc.slug) {
            slugs.add(doc.slug)
        }
    }
    return slugs
}

async function forEachWithConcurrency<T>(items: T[], concurrency: number, run: (item: T) => Promise<void>) {
    if (concurrency <= 1) {
        for (const item of items) {
            await run(item)
        }
        return
    }
    let cursor = 0
    const workers = Array.from({ length: concurrency }, async () => {
        while (cursor < items.length) {
            const item = items[cursor++]
            await run(item)
        }
    })
    await Promise.all(workers)
}

async function log(entry: LogEntry) {
    if (entry.outcome !== 'created') {
        console.warn(`${entry.outcome}: ${entry.slug}${entry.detail ? ` — ${entry.detail}` : ''}`)
    }
    await appendFile(LOG_PATH, `${JSON.stringify(entry)}\n`, 'utf8')
}

async function main() {
    const args = process.argv.slice(2)
    const limitArg = args.indexOf('--limit')
    await migrate({
        limit: limitArg === -1 ? undefined : Number(args[limitArg + 1]),
        seriesOnly: args.includes('--series-only'),
    })
    process.exit(0)
}

if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) {
    main().catch(error => {
        console.error(error)
        process.exit(1)
    })
}
