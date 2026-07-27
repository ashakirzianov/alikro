// Writes Crow's flat tags back onto every migrated artwork.
//
//   npm run migrate:tags -- --dry
//   npm run migrate:tags
//
// The reversion (2026-07-27) dropped the `series` relation and the `favorite`
// checkbox and restored a flat `tags` list. The values come from
// `crow-export.json`, joined on `slug` — the same join key the archive pass
// used — because the modelled shape no longer holds them.
//
// Idempotent: it compares before writing and skips records already correct, so
// re-running is free and a killed run resumes by being started again.

import { readFileSync } from 'fs'
import path from 'path'

import { getPayload } from 'payload'

import config from '../../payload.config'
import type { CrowExport } from './mapping'

const EXPORT_PATH = path.resolve(process.cwd(), 'payload/migration/crow-export.json')
const MAX_EXPORT_AGE_MS = 24 * 60 * 60 * 1000

async function main() {
    const dry = process.argv.includes('--dry')
    const crowExport = JSON.parse(readFileSync(EXPORT_PATH, 'utf8')) as CrowExport

    // Same guard as the archive pass, and for the same reason: a stale export
    // was once trusted as the archive. Re-export rather than overriding it.
    const age = Date.now() - Date.parse(crowExport.exportedAt)
    if (age > MAX_EXPORT_AGE_MS) {
        console.error(
            `Export is ${(age / 3_600_000).toFixed(1)}h old (${crowExport.exportedAt}). `
            + 'Run `npm run migrate:export` — do not override this.',
        )
        process.exit(1)
    }

    const tagsBySlug = new Map(crowExport.assets.map(a => [a.id, a.tags ?? []]))
    const payload = await getPayload({ config })

    const found = await payload.find({
        collection: 'artworks',
        limit: 0,
        pagination: false,
        depth: 0,
        overrideAccess: true,
        draft: true,
    })

    let written = 0
    let alreadyCorrect = 0
    const notInExport: string[] = []

    for (const doc of found.docs) {
        const slug = doc.slug ?? undefined
        if (!slug) continue

        const wanted = tagsBySlug.get(slug)
        if (wanted === undefined) {
            // Created after the migration — the playtest drafts and the
            // criterion-4 probes. Normal, not an error: this is a rule about
            // provenance, not a list of known slugs, so records added later are
            // absorbed without editing this script.
            notInExport.push(slug)
            continue
        }

        const current = (doc.tags ?? []) as string[]
        if (sameTags(current, wanted)) {
            alreadyCorrect++
            continue
        }

        if (!dry) {
            await payload.update({
                collection: 'artworks',
                id: doc.id,
                data: { tags: wanted },
                overrideAccess: true,
                // Every record reaching this branch is published — the drafts all
                // land in `notInExport` above and are skipped untouched. Saying
                // so explicitly anyway: publishing a draft here would put it on
                // the public site, which is the failure this branch already had
                // once.
                draft: false,
            })
        }
        written++
    }

    console.log(`\n${dry ? 'DRY RUN — ' : ''}tags backfill`)
    console.log(`  ${written} record(s) ${dry ? 'would be' : ''} updated`)
    console.log(`  ${alreadyCorrect} already correct`)
    console.log(`  ${notInExport.length} not in the export — skipped: ${notInExport.join(', ') || '(none)'}`)

    // Assert the positive signal rather than reporting a bare success: the
    // number of tagged records must match the export, or the join lost rows.
    const expectedTagged = crowExport.assets.filter(a => (a.tags ?? []).length > 0).length
    if (!dry) {
        const after = await payload.find({
            collection: 'artworks', limit: 0, pagination: false, depth: 0,
            overrideAccess: true, draft: true,
        })
        const tagged = after.docs.filter(d => ((d.tags ?? []) as string[]).length > 0).length
        const favorites = after.docs.filter(d => ((d.tags ?? []) as string[]).includes('Favorite')).length
        const expectedFavorites = crowExport.assets.filter(a => (a.tags ?? []).includes('Favorite')).length
        console.log(`\n  tagged records: ${tagged} (export has ${expectedTagged})`)
        console.log(`  "Favorite":     ${favorites} (export has ${expectedFavorites})`)
        // The two tiffs never migrated, so they cannot carry their tags.
        const missing = crowExport.assets.filter(a =>
            (a.tags ?? []).length > 0 && !after.docs.some(d => d.slug === a.id)).map(a => a.id)
        if (missing.length > 0) {
            console.log(`  tagged in Crow but absent from Payload: ${missing.join(', ')}`)
        }
        if (tagged + missing.length !== expectedTagged) {
            console.error('\nMISMATCH: tagged count does not reconcile with the export.')
            process.exit(1)
        }
        console.log('\nReconciles.')
    }
    process.exit(0)
}

function sameTags(a: string[], b: string[]) {
    if (a.length !== b.length) return false
    const left = [...a].sort()
    const right = [...b].sort()
    return left.every((value, i) => value === right[i])
}

if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) {
    main().catch(error => {
        console.error(error)
        process.exit(1)
    })
}
