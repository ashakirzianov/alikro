// Shared fixtures for the criterion-4 probes, so the REST, Local API and MCP
// runs execute the *same* three editorial tasks rather than three similar ones.

import { readFileSync } from 'fs'
import path from 'path'

// `plates` — five members, a real gallery on the site, small enough that a
// permutation is legible in a log. This is the **reorder** target.
export const PLATES_SERIES_ID = 13

// Where the retag task files its probe record — deliberately NOT `plates`.
// An earlier run put the probe records in the same gallery it was reordering,
// which silently changed what "last in the gallery" meant: the probe records
// carried sentinel orders (9998, 9999, null) and sorted after every real plate.
// A blind driver reading the archive cold hit exactly that and had to ask which
// record was really last. Two ids, because the point of the task is `hasMany`.
export const RETAG_SERIES_IDS = [16, 5]

export type OrderBaselineRow = { id: number, slug: string, title: string | null, order: number | null, series: number[] }

export function readOrderBaseline(): OrderBaselineRow[] {
    const file = path.resolve(process.cwd(), 'payload/probe/order-baseline-plates.json')
    const rows = JSON.parse(readFileSync(file, 'utf8')) as OrderBaselineRow[]
    if (rows.length === 0) {
        throw new Error(`${file} is empty`)
    }
    return rows
}

// The reorder under test: reverse the gallery. Only the existing `order` values
// are reused, reassigned among the same members — so the archive's global
// sequence outside this gallery cannot move, and the restore is exact.
export function reversedOrderPlan(baseline: OrderBaselineRow[]) {
    const values = baseline.map(row => row.order)
    return baseline.map((row, index) => ({
        id: row.id,
        slug: row.slug,
        from: row.order,
        to: values[values.length - 1 - index]!,
    }))
}

// Putting the gallery back is the probe's own job, not the operator's.
//
// The first version of these probes ended with "run restore-order.ts to put it
// back" printed on stdout, and the write-up then asserted in the present tense
// that the gallery *was* back. A reviewer read the live database and found it
// still reversed. A restore that depends on someone reading a log line is not a
// restore, so each probe now runs this in a `finally`, through its own surface —
// and `verifyRestored` re-reads rather than trusting the writes.
export function restorePlan(baseline: OrderBaselineRow[]) {
    return baseline.map(row => ({ id: row.id, slug: row.slug, to: row.order }))
}

export function verifyRestored(
    baseline: OrderBaselineRow[],
    observed: Array<{ id: number, order: number | null }>,
) {
    const wrong = baseline
        .map(row => ({ row, doc: observed.find(item => item.id === row.id) }))
        .filter(({ row, doc }) => !doc || doc.order !== row.order)
    if (wrong.length > 0) {
        const detail = wrong.map(({ row, doc }) => `${row.slug}: want ${row.order}, have ${doc ? doc.order : 'MISSING'}`).join('; ')
        return { ok: false as const, detail: `GALLERY NOT RESTORED — ${detail}. Run \`npm run probe:restore\`.` }
    }
    return { ok: true as const, detail: `gallery re-read and matches the pre-probe baseline [${baseline.map(row => row.order).join(', ')}]` }
}
