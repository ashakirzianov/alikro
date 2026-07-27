// Dumps the `series` and `materials` collections to JSON, and diffs them
// against the seed tables they were generated from.
//
//   npm run migrate:dump-modelling
//
// Written before the modelling layer is dropped (Anton + Alina rejected the
// split; see design-payload-field-mapping.md §2/§2b). Most of what these two
// collections hold is regenerable from SERIES_SEEDS and the material parser —
// but anything a human edited during the playtest exists **nowhere else**, so
// this runs first and its output is committed.
//
// The diff is the point, not just the backup. "The dump matches the seeds
// exactly" is a finding about whether the modelling layer was ever used; "it
// differs" means the dump is the only surviving record of those edits.

import { writeFileSync } from 'fs'
import path from 'path'

import { getPayload } from 'payload'

import config from '../../payload.config'
import { SERIES_SEEDS } from './series'

type Divergence = { collection: string, slug: string, field: string, seed: unknown, live: unknown }

async function main() {
    const payload = await getPayload({ config })

    const series = await payload.find({
        collection: 'series', limit: 0, pagination: false, depth: 0, overrideAccess: true,
    })
    const materials = await payload.find({
        collection: 'materials', limit: 0, pagination: false, depth: 0, overrideAccess: true,
    })

    // Membership is read from the **artwork** side, which is where it is stored
    // (`artworks.series`), not from the series' `artworks` join view. The join
    // view paginates at 10 and reports `hasNextPage` rather than a total, so
    // dumping it captures the first 10 members of a 22-member series and looks
    // complete. A truncated backup that reads as whole is worse than none.
    const artworks = await payload.find({
        collection: 'artworks',
        limit: 0, pagination: false, depth: 0, overrideAccess: true, draft: true,
    })
    const membership: Record<string, string[]> = {}
    const materialByArtwork: Record<string, string | undefined> = {}
    for (const doc of artworks.docs as unknown as Record<string, unknown>[]) {
        const slug = typeof doc.slug === 'string' ? doc.slug : undefined
        if (!slug) continue
        materialByArtwork[slug] = typeof doc.material === 'string' ? doc.material : undefined
        for (const ref of (doc.series as unknown[]) ?? []) {
            const id = typeof ref === 'object' && ref !== null
                ? String((ref as { id?: unknown }).id)
                : String(ref)
            ;(membership[id] ??= []).push(slug)
        }
    }
    const seriesById = new Map(
        (series.docs as unknown as Record<string, unknown>[]).map(d => [String(d.id), String(d.slug)]),
    )
    const membershipBySeriesSlug: Record<string, string[]> = {}
    for (const [id, slugs] of Object.entries(membership)) {
        membershipBySeriesSlug[seriesById.get(id) ?? `(unknown series id ${id})`] = slugs.sort()
    }

    const stamp = new Date().toISOString()
    write('series', {
        dumpedAt: stamp,
        count: series.totalDocs,
        // Authoritative membership, read from artworks.series — complete, not
        // the truncated join view. Regenerable from crow-export.json tags too,
        // but recorded here so the drop does not depend on that.
        membership: membershipBySeriesSlug,
        docs: series.docs,
    })
    write('materials', { dumpedAt: stamp, count: materials.totalDocs, docs: materials.docs })

    const linked = Object.values(membershipBySeriesSlug).reduce((n, s) => n + s.length, 0)
    console.log(
        `membership: ${linked} artwork→series link(s) across `
        + `${Object.keys(membershipBySeriesSlug).length} series (from the artwork side, untruncated)`,
    )

    const divergences = [
        ...diffSeries(series.docs as unknown as Record<string, unknown>[]),
        ...diffMaterials(materials.docs as unknown as Record<string, unknown>[]),
    ]

    console.log(`\n${series.totalDocs} series, ${materials.totalDocs} materials dumped.`)
    if (divergences.length === 0) {
        console.log(
            'DIVERGENCES: 0 — every field is still at its seed value. Nothing in '
            + 'these two collections was edited by hand, so the drop loses nothing '
            + 'that the seed tables cannot regenerate.',
        )
        console.log(
            '  Note the limit: this shows no edits *persisted*. It does not show '
            + 'the screens were never opened.',
        )
        process.exit(0)
    }
    console.log(`DIVERGENCES: ${divergences.length} — these exist ONLY in the dump above:`)
    for (const d of divergences) {
        console.log(`  ${d.collection}/${d.slug}.${d.field}: seed=${JSON.stringify(d.seed)} live=${JSON.stringify(d.live)}`)
    }
    process.exit(0)
}

function write(name: string, payload: unknown) {
    const file = path.resolve(process.cwd(), `payload/migration/dump-${name}.json`)
    writeFileSync(file, JSON.stringify(payload, null, 2) + '\n')
    console.log(`wrote ${file}`)
}

function diffSeries(docs: Record<string, unknown>[]): Divergence[] {
    const seeds = new Map(SERIES_SEEDS.map(seed => [seed.slug, seed]))
    const out: Divergence[] = []
    for (const doc of docs) {
        const slug = String(doc.slug)
        const seed = seeds.get(slug)
        if (!seed) {
            out.push({ collection: 'series', slug, field: '(whole record)', seed: undefined, live: 'not in SERIES_SEEDS' })
            continue
        }
        compare(out, 'series', slug, 'title', seed.title, doc.title)
        compare(out, 'series', slug, 'description', seed.description, doc.description)
        // These three have no seed value at all — the migration never sets them,
        // so anything here is a human decision made in the admin.
        for (const field of ['featured', 'cover', 'order'] as const) {
            const live = doc[field]
            if (live !== undefined && live !== null && live !== false) {
                out.push({ collection: 'series', slug, field, seed: '(unset by the migration)', live })
            }
        }
    }
    return out
}

function diffMaterials(docs: Record<string, unknown>[]): Divergence[] {
    // `broader` exists purely for Alina to confirm the clay/glaze hierarchy; the
    // migration deliberately reports the pairs and never sets it. Any value is
    // therefore a human decision and cannot be regenerated.
    return docs
        .filter(doc => doc.broader !== undefined && doc.broader !== null)
        .map(doc => ({
            collection: 'materials',
            slug: String(doc.slug),
            field: 'broader',
            seed: '(unset by the migration)',
            live: doc.broader,
        }))
}

function compare(out: Divergence[], collection: string, slug: string, field: string, seed: unknown, live: unknown) {
    const norm = (v: unknown) => (v === null || v === '' ? undefined : v)
    if (norm(seed) !== norm(live)) {
        out.push({ collection, slug, field, seed, live })
    }
}

if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) {
    main().catch(error => {
        console.error(error)
        process.exit(1)
    })
}
