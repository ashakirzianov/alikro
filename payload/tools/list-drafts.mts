// Prints the draft records with the titles a person actually sees in the admin.
//
// Why this exists: some of the drafts are load-bearing fixtures, not litter, and
// the one that matters most (`showOnSite: true`) looks exactly like a stray
// screenshot someone would tidy away. `migrate:spotcheck` counts drafts but
// prints slugs; the admin shows titles. Naming them the way they appear on
// screen is what lets a brief say "do not delete this one" unambiguously.
//
// Must run from inside the repo — `payload` will not resolve from /tmp.
import { getPayload } from 'payload'

import config from '../../payload.config'

const payload = await getPayload({ config })
const drafts = await payload.find({
    collection: 'artworks',
    where: { _status: { equals: 'draft' } },
    limit: 100,
    draft: true,
    overrideAccess: true,
    depth: 0,
})

console.log(`${drafts.totalDocs} draft(s):`)
for (const doc of drafts.docs) {
    const guard = doc.showOnSite ? '  <-- showOnSite=true — the draft-leak guard needs this one' : ''
    console.log(`  ${doc.id}  ${JSON.stringify(doc.title)}  showOnSite=${doc.showOnSite}${guard}`)
}
process.exit(0)
