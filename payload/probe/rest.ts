// Criterion-4 probe — the **REST** surface, over HTTP, authenticated the way an
// external agent would be (a `users` API key, no session cookie).
//
//   PROBE_BASE=http://localhost:5733 PROBE_API_KEY=... npx tsx payload/probe/rest.ts
//
// Runs the same three editorial tasks as `local-api.ts` so the two are
// comparable. Nothing here imports Payload — that is the point: this is the
// surface available to something running outside the app.
//
// Resumable on the upload, like the migration: if the probe artwork already
// exists it is asserted rather than re-uploaded, so re-running the probe does
// not accumulate records in an archive where deletion is forbidden.

import { readFileSync } from 'fs'

import { RETAG_SERIES_IDS, readOrderBaseline, restorePlan, reversedOrderPlan, verifyRestored } from './shared'

const BASE = process.env.PROBE_BASE ?? 'http://localhost:5733'
const API_KEY = process.env.PROBE_API_KEY ?? ''
const FIXTURE = '/tmp/mcpprobe/fixtures/c4-probe-2.png'
const PROBE_SLUG = 'c4-probe-2'

const auth = { Authorization: `users API-Key ${API_KEY}` }
const results: string[] = []

function record(step: string, ok: boolean, detail: string) {
    results.push(`${ok ? 'PASS' : 'FAIL'}  ${step} — ${detail}`)
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${step} — ${detail}`)
}

async function main() {
    if (!API_KEY) {
        throw new Error('PROBE_API_KEY is required — this probe deliberately does not fall back to a session cookie')
    }

    // ---- T1: upload + catalogue -------------------------------------------
    const catalogue = {
        title: 'C4 probe — REST upload',
        year: 2026,
        material: 'gouache on paper',
        medium: 'drawing',
        materials: [10],
        series: [RETAG_SERIES_IDS[0]!],
        order: 9999,
        favorite: true,
        showOnSite: false,
        _status: 'draft',
    }

    let doc = await findBySlug(PROBE_SLUG)
    if (!doc) {
        const form = new FormData()
        form.set('file', new Blob([new Uint8Array(readFileSync(FIXTURE))], { type: 'image/png' }), 'c4-probe-2.png')
        // The catalogue data goes in a `_payload` part, not as sibling form
        // fields. Sending it as sibling fields returns 201 and drops every one
        // of them — see the write-up; this line is the whole finding.
        form.set('_payload', JSON.stringify(catalogue))

        const response = await fetch(`${BASE}/api/artworks`, { method: 'POST', headers: auth, body: form })
        const body = await response.json() as { doc?: Record<string, unknown>, errors?: unknown }
        if (!response.ok) {
            throw new Error(`upload failed ${response.status}: ${JSON.stringify(body.errors)}`)
        }
        doc = await findBySlug(PROBE_SLUG)
    }

    if (!doc) {
        throw new Error('upload appeared to succeed but the record cannot be read back')
    }

    const variants = Object.entries((doc.sizes ?? {}) as Record<string, { url?: string }>)
        .filter(([, size]) => typeof size?.url === 'string')
    const fieldsLanded = doc.title === catalogue.title
        && doc.year === catalogue.year
        && doc.medium === catalogue.medium
        && doc.material === catalogue.material
        && doc.showOnSite === false
    record(
        'T1 upload+catalogue',
        fieldsLanded && variants.length === 8 && doc._status === 'draft',
        `id=${doc.id} slug=${doc.slug} fields=${fieldsLanded ? 'all landed' : 'MISSING'} variants=${variants.length}/8 status=${doc._status}`,
    )

    // The URLs must point at the bucket, not at Payload's own file route —
    // `disablePayloadAccessControl` removes that route, so a proxied URL would
    // be a dead link the moment anything rendered it.
    const bucketHosted = variants.every(([, size]) => size.url!.includes('.s3.'))
    const oneVariant = variants[0]?.[1].url
    const headStatus = oneVariant ? (await fetch(oneVariant, { method: 'HEAD' })).status : 0
    record(
        'T1d variant URLs resolve',
        bucketHosted && headStatus === 200,
        `all ${variants.length} point at the bucket: ${bucketHosted}; HEAD ${oneVariant?.split('/').pop()} -> ${headStatus}`,
    )

    // ---- T2: retag ---------------------------------------------------------
    const retagResponse = await fetch(`${BASE}/api/artworks/${doc.id}`, {
        method: 'PATCH',
        headers: { ...auth, 'Content-Type': 'application/json' },
        body: JSON.stringify({ series: RETAG_SERIES_IDS, materials: [10, 1], favorite: false }),
    })
    if (!retagResponse.ok) {
        throw new Error(`retag failed ${retagResponse.status}`)
    }
    const retagged = await findBySlug(PROBE_SLUG)
    const seriesIds = ((retagged?.series ?? []) as Array<number | { id: number }>).map(v => typeof v === 'object' ? v.id : v)
    const materialIds = ((retagged?.materials ?? []) as Array<number | { id: number }>).map(v => typeof v === 'object' ? v.id : v)
    record(
        'T2 retag',
        seriesIds.length === RETAG_SERIES_IDS.length && RETAG_SERIES_IDS.every(id => seriesIds.includes(id)) && materialIds.length === 2,
        `series=[${seriesIds}] materials=[${materialIds}] favorite=${retagged?.favorite}`,
    )

    // ---- T3: reorder a gallery --------------------------------------------
    const baseline = readOrderBaseline()
    const plan = reversedOrderPlan(baseline)

    // No bulk-reorder primitive: REST's collection-level PATCH applies ONE
    // patch body to every matched document, so "give each of these five a
    // different order" is N requests, one per document.
    for (const step of plan) {
        const response = await fetch(`${BASE}/api/artworks/${step.id}`, {
            method: 'PATCH',
            headers: { ...auth, 'Content-Type': 'application/json' },
            body: JSON.stringify({ order: step.to }),
        })
        if (!response.ok) {
            throw new Error(`reorder of ${step.slug} failed ${response.status}: ${await response.text()}`)
        }
    }

    const query = new URLSearchParams({ limit: '0', depth: '0', sort: 'order' })
    baseline.forEach((row, index) => query.append(`where[id][in][${index}]`, String(row.id)))
    const listed = await (await fetch(`${BASE}/api/artworks?${query}`, { headers: auth })).json() as { docs: Array<{ id: number, order: number | null }> }

    const gotSequence = listed.docs.map(item => item.id)
    const wantSequence = [...baseline].reverse().map(row => row.id)
    record(
        'T3 reorder gallery',
        JSON.stringify(gotSequence) === JSON.stringify(wantSequence),
        `${plan.length} requests; sequence by order: [${gotSequence}] (wanted [${wantSequence}])`,
    )

    // The multiset of the gallery's own order values, not a read of the wider
    // archive — see the same note in local-api.ts.
    const orderValues = listed.docs.map(item => item.order).sort((a, b) => (a ?? 0) - (b ?? 0))
    const baselineValues = baseline.map(row => row.order).sort((a, b) => (a ?? 0) - (b ?? 0))
    record(
        'T3b order values conserved',
        JSON.stringify(orderValues) === JSON.stringify(baselineValues),
        `still [${baselineValues}]`,
    )

    // ---- Put the gallery back, over REST ------------------------------------
    for (const step of restorePlan(baseline)) {
        const response = await fetch(`${BASE}/api/artworks/${step.id}`, {
            method: 'PATCH',
            headers: { ...auth, 'Content-Type': 'application/json' },
            body: JSON.stringify({ order: step.to }),
        })
        if (!response.ok) {
            throw new Error(`restore of ${step.slug} failed ${response.status}`)
        }
    }
    const reread = await (await fetch(`${BASE}/api/artworks?${query}`, { headers: auth })).json() as { docs: Array<{ id: number, order: number | null }> }
    const verdict = verifyRestored(baseline, reread.docs)
    record('T4 gallery restored', verdict.ok, verdict.detail)
}

async function findBySlug(slug: string) {
    const query = new URLSearchParams({ 'where[slug][equals]': slug, depth: '0', limit: '1', draft: 'true' })
    const response = await fetch(`${BASE}/api/artworks?${query}`, { headers: auth })
    const body = await response.json() as { docs?: Array<Record<string, any>> }
    return body.docs?.[0]
}

main()
    .then(() => {
        console.log('\n--- summary ---')
        results.forEach(line => console.log(line))
        if (results.some(line => line.startsWith('FAIL'))) {
            process.exit(1)
        }
    })
    .catch(error => {
        console.error(error)
        console.error('\nThe probe threw, so the gallery may be left permuted — run `npm run probe:restore`.')
        process.exit(1)
    })
