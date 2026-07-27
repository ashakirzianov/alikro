// Undo for the criterion-4 "reorder a gallery" probe.
//
//   npx tsx payload/probe/restore-order.ts          # restore + assert
//   npx tsx payload/probe/restore-order.ts --check  # assert only, write nothing
//
// The probe permutes `artworks.order` across the five members of the `plates`
// series. `npm run migrate` is resume-only — it skips slugs that already exist —
// so there is no reset-to-migrated-state and an edit is permanent unless
// something like this exists. `order-baseline-plates.json` was dumped from the
// live database before the first write; this puts those exact values back and
// then re-reads them to prove it.
//
// Asserts the positive: it fails loudly if a record is missing, if a write did
// not take, or if the baseline file itself is empty. A restore that silently
// touches nothing is the failure mode worth guarding against.

import { readFileSync } from 'fs'
import path from 'path'

import { getPayload } from 'payload'

import config from '../../payload.config'

type Baseline = { id: number, slug: string, title: string | null, order: number | null, series: number[] }

async function main() {
    const checkOnly = process.argv.includes('--check')
    const baselinePath = path.resolve(process.cwd(), 'payload/probe/order-baseline-plates.json')
    const baseline = JSON.parse(readFileSync(baselinePath, 'utf8')) as Baseline[]

    if (baseline.length === 0) {
        throw new Error(`${baselinePath} is empty — refusing to "restore" nothing`)
    }

    const payload = await getPayload({ config })
    const drift: string[] = []

    for (const row of baseline) {
        const before = await payload.findByID({
            collection: 'artworks',
            id: row.id,
            depth: 0,
            overrideAccess: true,
            draft: true,
        }).catch(() => undefined)

        if (!before) {
            throw new Error(`artwork ${row.id} (${row.slug}) is gone — this probe must never delete; investigate before doing anything else`)
        }
        if (before.slug !== row.slug) {
            throw new Error(`artwork ${row.id} is now "${before.slug}", baseline says "${row.slug}" — wrong record, refusing to write`)
        }

        if (before.order === row.order) {
            continue
        }

        drift.push(`${row.slug}: ${before.order} -> ${row.order}`)
        if (checkOnly) {
            continue
        }

        await payload.update({
            collection: 'artworks',
            id: row.id,
            data: { order: row.order ?? undefined },
            overrideAccess: true,
            draft: false,
        })
    }

    // Re-read rather than trusting the update's return value: the assertion is
    // "the database now matches the baseline", not "the calls returned 200".
    const after = await payload.find({
        collection: 'artworks',
        where: { id: { in: baseline.map(row => row.id) } },
        depth: 0,
        limit: 0,
        pagination: false,
        overrideAccess: true,
        draft: true,
    })

    if (after.docs.length !== baseline.length) {
        throw new Error(`re-read found ${after.docs.length} of ${baseline.length} baseline record(s)`)
    }

    const stillWrong = baseline
        .map(row => ({ row, doc: after.docs.find(doc => doc.id === row.id)! }))
        .filter(({ row, doc }) => doc.order !== row.order)

    if (checkOnly) {
        if (drift.length === 0) {
            console.log(`OK — all ${baseline.length} plates records match the pre-probe baseline.`)
            return
        }
        console.log(`${drift.length} record(s) differ from baseline (probe in progress or restore not run):`)
        drift.forEach(line => console.log(`  ${line}`))
        process.exitCode = 1
        return
    }

    if (stillWrong.length > 0) {
        console.error(`RESTORE FAILED — ${stillWrong.length} record(s) did not take:`)
        stillWrong.forEach(({ row, doc }) => console.error(`  ${row.slug}: want ${row.order}, have ${doc.order}`))
        process.exit(1)
    }

    if (drift.length === 0) {
        console.log(`Nothing to restore — all ${baseline.length} plates records already match the baseline.`)
    } else {
        console.log(`Restored ${drift.length} record(s), re-read and verified against the baseline:`)
        drift.forEach(line => console.log(`  ${line}`))
    }
    console.log(baseline.map(row => `  ${String(row.order).padStart(4)}  ${row.slug}`).join('\n'))
}

main().catch(error => {
    console.error(error)
    process.exit(1)
})
