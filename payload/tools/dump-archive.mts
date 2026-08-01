// Dumps the trial's artwork records to a committed JSON file.
//
// Why this exists, and it is the whole point of the closure: the trial's data
// lived ONLY in a free-tier Neon Postgres. Free projects suspend on inactivity
// and are removed after long enough, and the failure is silent — the app builds
// fine and `/admin` fails on first request. "Saved somewhere so I can come back
// to it" cannot rest on that. This turns the archive into a file in git.
//
// Plain JSON on purpose, not pg_dump: a reader six months out should be able to
// open it and see what the trial actually held, whether or not they ever restore
// it. It is a *record* dump, not a byte-for-byte database restore — see
// CLOSURE-payload-trial.md for exactly what it does and does not cover.
//
// Deliberately excluded: the `users` collection. It carries password hashes and
// salts, and this file is committed to a public remote. Recreating a login is a
// documented step in the closure doc, not something to leak here.
//
//     npx tsx payload/tools/dump-archive.mts
import { writeFileSync } from 'fs'

import { getPayload } from 'payload'

import config from '../../payload.config'

const OUT = 'payload/archive/artworks.json'

const payload = await getPayload({ config })

// `draft: true` returns each record's newest state including the nine drafts.
// Without it the drafts would come back as their last published version, or not
// at all — and the drafts are fixtures the closure explicitly preserves.
const result = await payload.find({
    collection: 'artworks',
    limit: 0,
    draft: true,
    overrideAccess: true,
    depth: 0,
    sort: 'id',
})

const dump = {
    _about: 'Payload trial archive — record dump. See CLOSURE-payload-trial.md. Metadata only: the image bytes live in S3 and are NOT in this file.',
    _dumpedAt: new Date().toISOString(),
    _payloadVersion: '3.86.0',
    _counts: {
        total: result.totalDocs,
        published: result.docs.filter(d => d._status === 'published').length,
        drafts: result.docs.filter(d => d._status === 'draft').length,
    },
    artworks: result.docs,
}

writeFileSync(OUT, JSON.stringify(dump, null, 2) + '\n')

// Assert rather than announce. A dump that silently wrote zero records would
// look exactly like a dump that worked.
if (result.totalDocs === 0 || result.docs.length !== result.totalDocs) {
    console.error(`FAILED: ${result.docs.length} of ${result.totalDocs} record(s) written`)
    process.exit(1)
}
console.log(`OK — wrote ${result.docs.length} record(s) to ${OUT}`)
console.log(`   ${dump._counts.published} published, ${dump._counts.drafts} draft(s)`)
process.exit(0)
