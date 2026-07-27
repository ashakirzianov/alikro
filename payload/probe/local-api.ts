// Criterion-4 probe — the **Local API** surface.
//
//   npx tsx payload/probe/local-api.ts
//
// Runs the three scripted editorial tasks (upload + catalogue, retag, reorder a
// gallery) as in-process Payload calls, so the result is comparable against the
// same three tasks driven over REST and over the MCP plugin.
//
// Safety, per the charge: creates are unrestricted, edits are confined to the
// record this script creates itself, and the one task that needs real records
// (reorder) permutes `order` across the five `plates` members and then restores
// them from `order-baseline-plates.json`. Nothing is ever deleted.
//
// Every step asserts the positive — it re-reads and compares rather than
// trusting that a call returned without throwing.

import { getPayload } from 'payload'

import config from '../../payload.config'
import { PLATES_SERIES_ID, RETAG_SERIES_IDS, readOrderBaseline, restorePlan, reversedOrderPlan, verifyRestored } from './shared'

const FIXTURE = '/tmp/mcpprobe/fixtures/c4-probe-3.png'
const PROBE_SLUG = 'c4-probe-3'

const results: string[] = []

function record(step: string, ok: boolean, detail: string) {
    results.push(`${ok ? 'PASS' : 'FAIL'}  ${step} — ${detail}`)
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${step} — ${detail}`)
}

async function main() {
    const started = Date.now()
    const payload = await getPayload({ config })
    console.log(`\n(bootstrap took ${Math.round((Date.now() - started) / 1000)}s)\n`)

    // ---- T1: upload + catalogue -------------------------------------------
    // Resumable, like `rest.ts` and `mcp.ts`. Without this, a re-run silently
    // accumulates: the slug is derived from the filename and Payload renames on
    // collision, so run two would land `c4-probe-3-1` rather than failing — a
    // new artwork plus nine S3 objects each time, in an archive where nothing
    // can be deleted.
    const priorRuns = await payload.find({
        collection: 'artworks',
        where: { slug: { equals: PROBE_SLUG } },
        limit: 1,
        depth: 0,
        overrideAccess: true,
        draft: true,
    })
    const created = priorRuns.docs[0] ?? await payload.create({
        collection: 'artworks',
        filePath: FIXTURE,
        data: {
            title: 'C4 probe — Local API upload',
            year: 2026,
            material: 'gouache on paper',
            medium: 'drawing',
            materials: [10],
            series: [RETAG_SERIES_IDS[0]!],
            order: 9998,
            favorite: true,
            // Kept out of the public galleries and left as a draft: this is a
            // probe artefact, not content.
            showOnSite: false,
            _status: 'draft',
        },
        overrideAccess: true,
    })

    const readBack = await payload.findByID({
        collection: 'artworks',
        id: created.id,
        depth: 0,
        overrideAccess: true,
        draft: true,
    })

    const variants = Object.keys(readBack.sizes ?? {}).filter(
        name => (readBack.sizes as Record<string, { url?: string | null }>)[name]?.url,
    )
    const fieldsLanded = readBack.title === 'C4 probe — Local API upload'
        && readBack.year === 2026
        && readBack.medium === 'drawing'
        && readBack.material === 'gouache on paper'
        && readBack.showOnSite === false
    record(
        'T1 upload+catalogue',
        fieldsLanded && variants.length === 8 && readBack._status === 'draft',
        `id=${readBack.id} slug=${readBack.slug} fields=${fieldsLanded ? 'all landed' : 'MISSING'} variants=${variants.length}/8 status=${readBack._status}`,
    )

    // Does the Local API reject a field name that does not exist? (REST does
    // not — it 200s and drops it.)
    let unknownFieldOutcome = 'accepted silently'
    try {
        await payload.update({
            collection: 'artworks',
            id: created.id,
            // @ts-expect-error deliberately probing an unknown field name
            data: { tittle: 'typo', yeear: 1999 },
            overrideAccess: true,
        })
        const after = await payload.findByID({ collection: 'artworks', id: created.id, depth: 0, overrideAccess: true, draft: true })
        unknownFieldOutcome = after.title === 'C4 probe — Local API upload'
            ? 'accepted silently, field dropped'
            : 'accepted and something changed'
    } catch (error) {
        unknownFieldOutcome = `rejected: ${(error as Error).message}`
    }
    record('T1b unknown field name', unknownFieldOutcome !== 'accepted and something changed', unknownFieldOutcome)

    // Does it reject an out-of-vocabulary select value?
    let invalidSelectOutcome = 'accepted silently'
    try {
        await payload.update({
            collection: 'artworks',
            id: created.id,
            // @ts-expect-error deliberately probing an invalid select value
            data: { medium: 'watercolour' },
            overrideAccess: true,
        })
    } catch (error) {
        invalidSelectOutcome = `rejected: ${(error as Error).message}`
    }
    record('T1c invalid select value', invalidSelectOutcome.startsWith('rejected'), invalidSelectOutcome)

    // ---- T2: retag ---------------------------------------------------------
    // Confined to the record this script created. "Retag" in this model is
    // relationship membership: series and materials.
    const seriesTargets = RETAG_SERIES_IDS
    await payload.update({
        collection: 'artworks',
        id: created.id,
        data: { series: seriesTargets, materials: [10, 1], favorite: false },
        overrideAccess: true,
    })
    const retagged = await payload.findByID({
        collection: 'artworks',
        id: created.id,
        depth: 0,
        overrideAccess: true,
        draft: true,
    })
    const seriesIds = (retagged.series ?? []).map(value => typeof value === 'object' ? value.id : value)
    const materialIds = (retagged.materials ?? []).map(value => typeof value === 'object' ? value.id : value)
    record(
        'T2 retag',
        seriesIds.length === RETAG_SERIES_IDS.length && RETAG_SERIES_IDS.every(id => seriesIds.includes(id))
        && materialIds.length === 2 && retagged.favorite === false,
        `series=[${seriesIds}] materials=[${materialIds}] favorite=${retagged.favorite}`,
    )

    // Does the reverse `join` view on the series see the new member? That is
    // the read side an agent would use to check its own work.
    const seriesDoc = await payload.findByID({
        collection: 'series',
        id: RETAG_SERIES_IDS[0]!,
        depth: 0,
        overrideAccess: true,
        draft: true,
    })
    const joinDocs = (seriesDoc.artworks?.docs ?? []).map(value => typeof value === 'object' ? (value as { id: number }).id : value)
    record(
        'T2b join view reflects it',
        joinDocs.includes(created.id),
        `series ${RETAG_SERIES_IDS[0]} join now lists ${joinDocs.length} artwork(s); contains ${created.id}: ${joinDocs.includes(created.id)}`,
    )

    // ---- T3: reorder a gallery --------------------------------------------
    // Real records. Baseline was dumped before any write; the permutation only
    // shuffles the five existing `order` values among the five members, so the
    // global sequence outside this gallery is untouched.
    const baseline = readOrderBaseline()
    const plan = reversedOrderPlan(baseline)

    for (const step of plan) {
        await payload.update({
            collection: 'artworks',
            id: step.id,
            data: { order: step.to },
            overrideAccess: true,
        })
    }

    const afterReorder = await payload.find({
        collection: 'artworks',
        where: { and: [{ series: { in: [PLATES_SERIES_ID] } }, { id: { in: baseline.map(row => row.id) } }] },
        sort: 'order',
        depth: 0,
        limit: 0,
        pagination: false,
        overrideAccess: true,
        draft: true,
    })
    const gotSequence = afterReorder.docs.map(doc => doc.id)
    const wantSequence = [...baseline].reverse().map(row => row.id)
    record(
        'T3 reorder gallery',
        JSON.stringify(gotSequence) === JSON.stringify(wantSequence),
        `sequence by order: [${gotSequence}] (wanted [${wantSequence}])`,
    )

    // Narrower than it used to read: this says the gallery's five `order` values
    // are the same multiset as before, so the permutation invented no new value
    // and consumed no slot belonging to anything else. It does NOT read a record
    // outside the gallery — the guarantee that nothing else moved comes from
    // only these five ids ever being written, which is visible in the loop above.
    const orderValues = afterReorder.docs.map(doc => doc.order).sort((a, b) => (a ?? 0) - (b ?? 0))
    const baselineValues = baseline.map(row => row.order).sort((a, b) => (a ?? 0) - (b ?? 0))
    record(
        'T3b order values conserved',
        JSON.stringify(orderValues) === JSON.stringify(baselineValues),
        `still [${baselineValues}] — permuted among members, none invented`,
    )

    // ---- Put the gallery back, through this same surface -------------------
    for (const step of restorePlan(baseline)) {
        await payload.update({
            collection: 'artworks',
            id: step.id,
            data: { order: step.to ?? undefined },
            overrideAccess: true,
        })
    }
    const restored = await payload.find({
        collection: 'artworks',
        where: { id: { in: baseline.map(row => row.id) } },
        depth: 0,
        limit: 0,
        pagination: false,
        overrideAccess: true,
        draft: true,
    })
    const verdict = verifyRestored(baseline, restored.docs.map(doc => ({ id: doc.id, order: doc.order ?? null })))
    record('T4 gallery restored', verdict.ok, verdict.detail)

    console.log(`\nProbe record: id ${created.id} (draft, showOnSite=false).`)
}

main()
    .then(() => {
        console.log('\n--- summary ---')
        results.forEach(line => console.log(line))
        // The branch rule is "assert the positive signal, never a bare exit-0".
        // Printing FAIL and exiting 0 is exactly the bare exit-0 it forbids.
        if (results.some(line => line.startsWith('FAIL'))) {
            process.exit(1)
        }
    })
    .catch(error => {
        console.error(error)
        console.error('\nThe probe threw, so the gallery may be left permuted — run `npm run probe:restore`.')
        process.exit(1)
    })
