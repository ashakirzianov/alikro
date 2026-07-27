# Probe: criterion 4 — how well can agents drive Payload?

**2026-07-27.** The last untested evaluation criterion of the Crow → Payload
trial, and the only one that needed nothing from Anton.

Deliberately an **absolute** test, not a comparative one: Crow has no agent
surface today, only ideas for one, so there is nothing to benchmark against. The
question is just *how well can agents drive Payload*, across the three scripted
editorial tasks — **upload + catalogue a piece, retag, reorder a gallery**.

Everything below was run against the live trial instance.

**What is and is not re-runnable.** The three surface probes in `payload/probe/`
are scripted, assert their results, exit non-zero on failure, and put the gallery
back through their own surface before finishing. A handful of findings — the
naive-multipart drop, the REST unknown-field drop, `enableAPIKey` with no key,
and the discoverability table — are **one-shot manual observations**, recorded
with their exact commands but not guarded by a script, because reproducing them
means creating records in an archive where nothing can be deleted. They are
labelled where they appear.

---

## The headline finding is that the criterion's premise expired

The landscape research rated Payload the **weakest** major headless CMS on agent
surface: *"no official MCP, community servers only, positioning is 'you're inside
Next.js, wire agents yourself.'"*

That was accurate when it was written and is no longer true. Payload ships a
**first-party MCP server**:

| | |
|---|---|
| package | `@payloadcms/plugin-mcp` |
| scope | `@payloadcms` — same npm org and maintainers as `payload` itself |
| first published | **2025-10-23** |
| version installed | `3.86.0` — the same release line as the core |
| peer dependency | `payload: 3.86.0`, pinned **exact**, not a range |
| transport | streamable HTTP at `/api/mcp` |

No community server was evaluated, because none was needed. The exact-pinned
peer dependency is worth noticing in both directions: it is strong evidence the
plugin is maintained in lockstep rather than bolted on, and it is one more thing
that must move on every core upgrade — which belongs to criterion 5.

**All three editorial tasks completed on all three surfaces.** Against a
criterion written expecting failure, that is the result.

---

## Which surface carried the work — the fork-relevant answer

This was the question asked explicitly, because the Local API is only reachable
from something running *inside* the app. If the Local API were what made agent
operation work, that would argue for the embedded topology and would not survive
a separate-app deployment.

**It is not.** Every task completed over **REST**, from outside the process, with
nothing but a `users` API key.

| task | REST (external) | Local API (in-process) | MCP (`/api/mcp`) |
|---|---|---|---|
| upload + catalogue | ✅ one multipart request | ✅ `filePath` | ✅ but only via an **undocumented** route — see below |
| retag (series + materials) | ✅ | ✅ | ✅ |
| reorder a gallery | ✅ 5 requests | ✅ | ✅ 5 tool calls |

The Local API offered **no capability an agent needs that REST lacks**. It was
pleasanter to write scripts against, and it is the right choice for something
already living in the app (the migration script, the site's own reads) — but on
this criterion it earns the embedded topology nothing. Criterion 4 does not
argue for embedding.

### The MCP upload route is real, and it is not where the schema says

I first concluded that MCP uploads were **host-local** and that a remote agent
would have to fall back to REST. That was wrong, and a blind-driver run (below)
is what exposed it. Both halves are worth recording, because the *reason* it was
wrong is the finding.

`createArtworks` advertises no file parameter. `updateArtworks` advertises
`filePath` — which really is a path on the machine running Payload, so the
obvious two-step (create the record, then attach the bytes) does need
co-location. That much held.

But `url` — presented in the schema as a storage **output**, the generated public
URL — doubles as an **ingest source** on create. Paired with `filename`, Payload
fetches those bytes over the network and runs the entire pipeline:

```
createArtworks {"title":"…", "url":"https://…/c4-probe-mcp.png", "filename":"c4-probe-remote.png"}
→ Resource created successfully … 8/8 webp variants, written to S3, published
```

`url` **alone** answers `No files were uploaded`; `url` + `filename` is the
minimal working pair. So a fully remote agent *can* upload over MCP — the
capability exists, is simply not documented, and reads like a field you should
never write to. Asserted in the probe as `T1f`, not left as a one-off.

Two traps sit on that same path:

- A **relative** `url` produces
  `Failed to parse URL from http:://localhost:5733/tmp/…` — note the **doubled
  colon**. Payload is concatenating a protocol that already carries its `:`.
  A genuine bug, and the error message is the only place it surfaces.
- Passing a plausible-but-nonexistent argument such as `{"file":"/tmp/…"}` is
  **silently ignored** — despite the tool schema declaring
  `additionalProperties: false` — and you get the generic `No files were
  uploaded`. So an argument that was never read is indistinguishable from one
  that was read and rejected on its merits.

---

## The failure shape that matters: value errors are loud, shape errors are silent

This is the thing to carry out of the probe, and it is one bug class, not four.

**The worst case, and it is the obvious thing to try.** Uploading over REST with
the catalogue data as ordinary sibling form fields — `-F "title=…" -F "year=2026"`
— returns:

```
201 Created
{"doc":{"id":633,"title":null,"year":null,"medium":null,
        "sizes":{...eight webp variants, all generated...}}}
```

The file uploads. All eight variants generate. Every catalogue field is silently
discarded. The response is success-shaped and 200-class. The correct form puts
the data in a single `_payload` part:

```
-F "file=@artwork.png" -F '_payload={"title":"…","year":2026,"medium":"drawing"}'
```

Nothing anywhere says so at the point of failure. An unattended agent doing the
natural thing produces a bucket full of correctly-processed images attached to
empty records, and every response says it worked.

Three siblings of the same bug:

- **Unknown field name** in a JSON `PATCH` (`{"tittle":"typo"}`) → **200**, field
  dropped, no warning. Same on the Local API.
- **`enableAPIKey: true` with no `apiKey`** when provisioning a credential → 201,
  and re-reading the user shows `apiKey: null`. No key is generated for you and
  nothing says so; you have to supply the string yourself. An agent bootstrapping
  its own credential gets a user that is API-key-enabled and unusable.
- **MCP `createArtworks` with no file, as a draft** → accepted, and you get an
  artwork record that can never render. The same call **as a publish is refused**
  loudly (`No files were uploaded`). So this is not a missing check — it is
  Payload skipping upload validation for drafts, which on an *upload* collection
  means the draft path can mint imageless records. Both halves are asserted in
  the probe (`T1` and `T1e`), because either one alone tells the wrong story.
- **…and the draft can then simply be published.** `PATCH {"_status":"published"}`
  on that imageless record **succeeds**: the file requirement is enforced on
  create and never re-checked on the draft→publish transition. So "publishing
  requires a file" is not actually an invariant — it is a create-time check with
  a two-step way around it. Found while probing the edge of an unrelated fix; it
  is the most substantive defect in this document.

By contrast, an **invalid value** is caught precisely, everywhere:

```
400  {"errors":[{"name":"ValidationError","data":{"errors":[
       {"label":"Medium","message":"This field has an invalid selection.","path":"medium"}]}}]}
```

**MCP is *not* immune to this, and an earlier draft of this document said it
was.** The claim was that typed tool schemas mean a typo is rejected before a
request is sent. Half of that is true and the important half is not:

```
updateArtworks {"id":"636","tittle":"typo-must-not-land","yeear":1999}
→ Document updated successfully in collection "artworks"!    (record unchanged)
```

The plugin builds its input schema as a plain `z.object` and never calls
`.strict()`, so an undeclared key is **stripped, not refused** — exactly REST's
behaviour. What the typed schema does buy is real but narrower: a *client* that
validates against the advertised `inputSchema` before sending will catch the
typo, and bad **enum** values are genuinely rejected. So the protection is
client-side and advisory, not a property of the endpoint. Asserted now as `T1g`
rather than asserted in prose.

---

## Discoverability — what an agent can learn without being told

| | |
|---|---|
| OpenAPI / JSON-schema for REST | **none** — `/api/openapi`, `/api/docs`, `/api/swagger` all 404 |
| GraphQL introspection | **works, anonymously** — full type set, and enums (`Artwork_medium` → the seven mediums) |
| `/api/access` | which operations the caller may perform, per collection — and it **answers anonymously**, so it doubles as a public capability map |
| MCP `tools/list` | 9 typed tools with inline enums and per-field descriptions |

GraphQL introspection is the practical answer for REST-side agents, and it is
how an agent would find the `medium` vocabulary that the silent-drop bug above
makes so easy to get wrong. Worth noting it is **unauthenticated** — the schema,
not the content, but still more than the bearer-gated Crow endpoint exposes.

The nicest structural result of the probe is in the MCP tool schema:

```json
"medium": {
  "type": "string",
  "enum": ["painting","drawing","ceramic","illustration","poster","collage","tattoo"],
  "description": "Adding a new medium currently requires a code change — flagged as a trial finding."
}
```

That description is the `admin.description` written in `Artworks.ts` for
**Alina**. The field help text a human editor reads in the admin is verbatim
what the agent reads as its instruction — one place to document a field serves
both, and no field documentation had to be written for the agent.

**Operation-level documentation is a different story, and had to be hand-written.**
A tool's description comes from the *plugin config's* `collections[slug].description`
(falling back to a generic per-operation string) — the collection's own
`admin.description` is never consulted. So the three sentences in
`agentSurface()` were authored specifically for this surface. And because the
description is per *collection*, `createArtworks`, `findArtworks` and
`updateArtworks` all carry the same sentence; what each tool actually does is
conveyed only by its name.

Net: field-level docs come free from the schema, operation-level docs cost three
lines of config and still cannot distinguish read from write.

---

## Access control that was actually designed for agents

The MCP plugin does not reuse `users.apiKey`. It ships its own collection,
`payload-mcp-api-keys`, where each key carries per-collection, per-operation
checkboxes that **default to off**, editable live in the admin.

Verified from both ends, because a key that merely "didn't write anything" proves
nothing (`payload/probe/mcp-capability-gate.ts`):

```
full key      (9 tools): createArtworks, updateArtworks, findArtworks, createSeries, …
read-only key (3 tools): findArtworks, findSeries, findMaterials

PASS  control: full key exposes 6 write tools
PASS  read-only key exposes 0 write tools — removed from the registry, not merely refused
PASS  calling updateArtworks with the read-only key anyway
      — refused: MCP error -32602: Tool updateArtworks not found
```

Record 636's title was re-read afterwards and is unchanged, so the refusal held.

This branch's standing rule is that nothing gets deleted. Setting
`enabled.delete: false` in `agentSurface()` meant **no delete tool was ever
generated** — and the probe now proves it rather than noting the absence, since
an absence check would also pass on an empty tool list:

```
T0b  absent from the registry AND refused when called anyway
     — MCP error -32602: Tool deleteArtworks not found
```

Better than a prompt, and a genuinely good property of the plugin: the checkbox
does not exist on the key, so it cannot be ticked.

**Scope it honestly, though: this holds inside MCP only.** `DELETE
/api/artworks/:id` is fully available over REST, and `payload.delete` over the
Local API, to the same probe user — whose `users` API key is unrestricted. The
capability model is a property of the MCP surface, not of the deployment.

---

## The blind-driver run — a model, given only the endpoint

Everything above measures the *surface*. It does not answer whether an agent
that has never seen this repo can actually get anywhere. So a second model was
given the MCP endpoint, a key, and the three tasks in plain language — and
explicitly forbidden from reading any source, docs, or repo on the machine.

Its key was deliberately **create + find only**, with `update` withheld. That was
a safety bound, not a Payload limitation: an agent I could not supervise was not
getting a credential that could edit 630 real artworks. The consequence is that
tasks 2 and 3 were **structurally impossible for it**, and the honest reading of
its "0 of 3" is *"0 of 3 with two thirds of the capability removed"* — not a
verdict on Payload.

What it did establish is the part that matters:

- **It never claimed success it did not have.** It reported each task blocked,
  named the exact missing capability, and stopped. It also caught a decoy — an
  unrelated pre-existing record, `id 570 "Greek Man"`, matching the requested
  title, year and medium — and refused it after reading the full record and
  finding every other attribute wrong. A weaker run would have found that title
  match and declared victory.
- **The data model was almost entirely discoverable from the schema.** It worked
  out unaided that membership is written on the artwork rather than the series
  (from the `findSeries` description), that `order` is archive-wide, that
  `showOnSite: false` rather than `_status: draft` is the lever for "not shown
  publicly", and it resolved `sketches from museums` → 5, `gouache` → 12,
  `paper` → 18 with the materials/support split correct.
- **Its reorder plan was better than mine.** Rather than permuting five values it
  proposed a single write — `order: 10.75` on one record, slotting between the
  existing `10.5` and `11` — having first verified empirically that fractional
  orders are already in production (ids 61, 62, 66, 70 sit at 2.5, 3.5, 6.5,
  10.5) rather than trusting the schema's bare `number`. One write instead of
  five, same result.
- **It found the `url` ingest path, the `http:://` bug, and the silently-ignored
  argument** — the three things in the section above. All three are in this
  document because it hit them and I then reproduced them.
- **It caught my own litter.** Probe records were sitting inside the `plates`
  series carrying sentinel orders (9998, 9999, `null`), which silently changed
  what "last in the gallery" meant and forced it to ask which record was really
  last. Fixed: the probes now retag into a different series, and `plates` is back
  to exactly its five real members.

On readability it was precise: reads were clear and `where`/`select` behaved,
but every write failure came back as "a single unstructured sentence with no
error code, no field name, and no indication of which argument was at fault."
That matches what the scripted probes found from the other direction.

---

## Rough edges, named

**MCP results are prose with embedded JSON, and the shape is inconsistent.**
A list answer is a header line followed by **one fenced ` ```json ` block per
document** — no array, no `docs` wrapper, no pagination object. Fetching by id
answers `Resource from collection "artworks":` followed by **bare JSON with no
fence**, and — re-verified, because it sounds like a mistake — **that default
projection carries no `id`**, so the one response you cannot feed back into an
id-keyed call is the one you got by asking for a single record. Passing an
explicit `select` including `id` does return it. `structuredContent` is never set
on any of them.

Fine for a model reading it. Hostile to a script. My own harness reported four
spurious `FAIL`s on its first run purely from parsing this, while the writes had
in fact all landed — which is the exact failure this branch keeps rediscovering,
so it is recorded rather than quietly fixed: **the check was wrong, not the
thing it checked.** The parsing helpers in `payload/probe/mcp.ts` exist only
because of this and are commented accordingly.

**No bulk-reorder primitive on any surface.** A collection-level `PATCH` does
exist and works — `PATCH /api/artworks?where[id][in]=633&where[id][in]=634` with
`{"favorite":true}` answers `Updated 2 Artworks successfully.` — but it applies
**one body to every match**, which is the wrong shape for reordering. "Give each
of these five a different `order`" is therefore N requests: five here, and the
same shape at 630. Payload's `orderable` fractional index was already rejected
for this model (see `Series.ts`), so reordering is inherently per-document for an
agent.

**Turning MCP on costs a schema change** — the key collection's tables. The
plugin keeps them when `disabled: true`, which is why `agentSurface()` registers
it unconditionally and gates only the endpoint: toggling the plugin in and out of
the config array instead would let dev-mode `push` drop that table on a later boot.

**It also costs real dependency weight, which belongs to criterion 5.** Enabling
MCP adds roughly **70 new top-level packages** — `@modelcontextprotocol/sdk`,
`mcp-handler`, `zod-to-json-schema`, and a transitive tree that drags in an
**Express 5** stack (`body-parser`, `router`, `cors`, `qs`), **`hono`**, and a
**`redis`** client, none of which were in this project before. Payload's own
versions were untouched. "Add one first-party plugin" is not a free line in
`package.json`, and every one of those is another thing moving under a
near-weekly release train.

*Separately, and NOT caused by the plugin:* the diff also carries
`@aws-sdk/client-s3` **3.993.0 → 3.1096.0** — the client the storage adapter and
the migration use, and the one criterion 3's media parity was validated against.
It is worth flagging, but it is not attributable here: with `package.json` and
`package-lock.json` both reverted to `HEAD`, a bare `npm install` reproduces the
same bump, because the committed lockfile had drifted far behind what
`"^3.782.0"` already permits. Any dependency work on this branch would have
surfaced it. Whether to re-pin is Anton's call.

**Out-of-process Local API startup is unpredictable** — 6 seconds warm, but ~4
minutes twice on a cold Drizzle "Pulling schema from database". Irrelevant to a
co-located agent using the in-process API; painful for a scripted iteration loop.
Note also that *any* out-of-process script booting Payload boots it with dev
`push` enabled, so even a read-only check like `probe:restore -- --check` can
alter the live schema on the way in.

**The MCP key collection has no `access` config**, so Payload's default applies:
any authenticated admin — Alina included — can list existing MCP keys and mint
new ones with any enabled capability. Anonymous reads are correctly refused, so
nothing leaks; but the plan of record made a point of not silently widening
access during the trial, and this collection arrives outside that decision. It
is also registered unconditionally (that is what keeps the schema stable), so an
**"MCP" group appears in the admin sidebar even with `PAYLOAD_MCP` unset** — a
visible cost of the flag design worth knowing before Alina sees it.

---

## The single-ordering model held up

Reordering a gallery without disturbing the archive's global sequence means
**permuting the members' existing `order` values among themselves** — a
consequence of the decision to keep one ordering system rather than per-series
indices. All three surfaces did it, and each probe asserts not just that the
sequence reversed but that the *set* of order values was unchanged:

```
T3  reorder gallery       sequence by order: [153,116,101,79,71] (wanted [153,116,101,79,71])
T3b global order undisturbed   order values still [11,19,40,55,91] — permuted among members, none invented
```

It is a slightly unobvious move, but it is expressible, checkable, and it did not
need a special primitive.

---

## Verdict on criterion 4

**Competent, and clearly better than the criterion was written to expect.** The
landscape research's premise no longer holds; there is a maintained first-party
MCP server with a per-capability access model that appears to have been designed
for exactly this, and all three editorial tasks complete on all three surfaces.

Two reservations keep it from being unqualified:

1. The **silent-shape-error** class is real, lands hardest on the task that
   matters most for this archive — uploading an image — and **is not fixed by
   MCP**. An unattended agent on REST can produce many perfectly-processed
   images attached to empty records and never see an error; over MCP the same
   typo is stripped just as quietly. The only mitigation found is client-side:
   validate against the advertised `inputSchema` before sending, which a good
   MCP client does for free and a `curl` loop never will. That is still a reason
   to prefer MCP for unattended work — but a weaker one than "MCP won't let you".
2. **The MCP upload story is undocumented.** It works remotely — but only through
   a field the schema presents as an output, with a doubled-colon URL bug on the
   near-miss path and a draft mode that will mint imageless records. Everything
   an agent needs is *there*; almost none of it is *advertised*. That is a
   different complaint from "it can't", and a much cheaper one to fix.

And the answer to the question this was asked to settle: **the Local API is not
load-bearing for agent operability.** REST carried all three tasks from outside
the process, and MCP — once the `url` route is known — carries them remotely too.
Criterion 4 supplies no argument for the embedded topology, so whatever decides
that question, it is not this one.

*Method note, since this branch keeps collecting them.* Four claims in the first
draft of this document were wrong, and they failed in two distinct ways worth
telling apart.

**Three were over-generalisations from a narrow pass.** `createArtworks` with no
file was accepted — but only because every call I made was a draft. `filePath`
was host-local, so I concluded MCP uploads were, without checking whether another
field did the job. "MCP is immune to the silent class" was a mechanism I reasoned
about and never ran. None of these was a check that passed vacuously; each was a
check that passed **narrowly** and got read broadly. All three were caught from
outside — two by handing the same tasks to a model with no access to my
assumptions, one by a reviewer reading the plugin's source instead of my prose.

**The fourth was worse, because it was a claim about state rather than
behaviour.** This document said the `plates` gallery was restored; a reviewer
read the database and found it reversed. The probes had printed a reminder to
restore, and I had believed the reminder. **A cleanup step that lives in a log
line is not a cleanup step** — it is now a `T4` assertion inside each probe. The
generalisable version: *the claims most worth distrusting are the ones about the
world, not about the code, because nothing recompiles when they go stale.*

---

## What was touched

Per the charge: create-only wherever possible, edits confined to records created
here, and the one task needing real records made reversible first. **Nothing was
deleted.**

**Created (7 artworks, all `_status: draft`, all `showOnSite: false` — none is
visible to the site):**

| id | slug | what it is |
|---|---|---|
| 633 | `c4-probe-1` | the naive-multipart finding, kept as its evidence |
| 634 | `c4-probe-2` | REST probe record |
| 635 | `c4-probe-3` | Local API probe record |
| 636 | `c4-probe-mcp` | MCP probe record (created empty as a draft, bytes attached second) |
| 637 | `c4-probe-draft-no-file` | **imageless on purpose** — the draft-validation gap, kept as its evidence |
| 638 | `c4-probe-remote` | the undocumented `url` ingest route |
| 639 | `c4-verify-minimal` | same route with the minimal argument pair (`url` + `filename`) |

All the ones carrying pixels are the same real archive original
(`greek_man.png`, 1600×1200) under fresh filenames — real pixels, so the variant
pipeline was exercised for real, but no slug or S3 key collision with the
artwork it came from.

**One of these was briefly wrong and is worth recording rather than quietly
fixing.** Record 639 was created `_status: published` with `showOnSite: true`,
because the probe call that made it was testing the minimal argument set and
inherited neither flag. For a few minutes a probe artefact was in what the site
renders — the same class of leak the spike found during the playtest, made by me
this time. Caught on the next read-back of probe state, corrected to draft +
`showOnSite: false`, and the guard confirms the site is back to 575. The lesson
is narrow and repeatable: **an exploratory write inherits none of a probe
script's safety defaults**, and the ad-hoc calls are exactly the ones nobody
reviews.

**Also created:** user 3 `agent-probe@alikro.art` (with an API key), and three
`payload-mcp-api-keys` records — id 1 full, id 2 find-only (the pair the
capability gate needs), id 3 create+find-only (the blind driver's bound).

**Edited:** only the seven records above, plus — reversibly — `order` on the five
`plates` artworks (71, 79, 101, 116, 153). Their values were dumped to
`payload/probe/order-baseline-plates.json` **before the first write**, permuted
once per surface, and restored afterwards.

**This is the part a review caught me on, and it is worth stating plainly.** The
first version of these probes printed *"gallery left permuted — run
restore-order.ts to put it back"* and relied on me to do it. This document then
asserted, in the present tense, that the gallery was restored. A reviewer read
the live database and found all five records still reversed. Nothing was lost —
the baseline file is corroborated independently by `crow-export.json`, which
carries the same five values — but the claim was ahead of the fact.

Fixed at the root rather than by re-running: each probe now restores through its
own surface and re-reads to verify, as a final assertion (`T4`), and the
restore-only script remains for the case where a probe throws. So the last line
of every probe run is now:

```
PASS  T4 gallery restored — gallery re-read and matches the pre-probe baseline [11, 19, 40, 55, 91]
```

`npm run probe:restore -- --check` reports `OK — all 5 plates records match the
pre-probe baseline`. Two residual caveats: the restore loop is **not
transactional**, so a process killed mid-loop leaves duplicated `order` values
and a nondeterministic sort until it is re-run; and verifying restoration over
REST needs **per-id reads**, because a `/api/artworks` list response can be
served from Next's route cache and will show a stale sequence.

**Not touched:** records 631 and 632, the load-bearing draft-leak fixtures.

**Draft-leak guard after all of this:**

```
Draft-leak guard: 6 draft(s) in the archive, 1 of them with showOnSite=true.
  OK — the site layer returned 575 asset(s) and none of the 6 draft(s) is among them.
```

575 is the pre-probe baseline. The guard is exercised, not vacuous: one draft
still carries `showOnSite: true` (record 632, which exists for that purpose).
`npm run migrate:spotcheck` finishes **`Spot-check clean.`**

*Two red marks were raised and fixed*, on the principle that a permanently red
check is one nobody reads:

1. The spot-check requires that any record with a free-text `material` also
   carries `materials` relations. The probe records had the prose without the
   relations. They now carry `gouache` / `paper`, matching their own string.
2. Record 637 is imageless **on purpose**, and the spot-check called that "no
   renditions at all". Rather than delete the evidence or blanket-skip the
   check, the exemption is scoped to exactly the condition Payload can produce:
   a record with **no filename**, in **draft**, that **never came from the
   migration**. A migrated record or a published one with no renditions still
   fails, and the skip is printed rather than silent.

   **The narrowing was tested by making it fire**, per this branch's habit:
   with 637 flipped to `published`, the spot-check reports
   `c4-probe-draft-no-file: no renditions at all` and exits 1; with it back to
   draft, `Spot-check clean`. That flip is also what turned up the
   draft→publish defect above — the guard's negative test found a real bug.

## Running the probes

```bash
set -a && . ./.env.local && set +a
PAYLOAD_MCP=1 npm run dev -- -p 5733    # MCP is off unless PAYLOAD_MCP is set

PROBE_API_KEY=…                     npm run probe:rest
                                    npm run probe:local
PROBE_MCP_KEY=…                     npm run probe:mcp
PROBE_MCP_KEY=… PROBE_MCP_KEY_RO=…  npm run probe:mcp-gate

npm run probe:restore               # only needed if a probe threw
npm run probe:restore -- --check    # assert the gallery is at its baseline
```

**All three probes are resumable and self-restoring.** They reuse their probe
record if it already exists rather than adding another — deletion is forbidden
on this branch, so an accumulating probe is a one-way cost — and each puts the
`plates` gallery back through its own surface, re-reads it, and asserts the match
as `T4` before exiting. All three exit **non-zero** if any step fails.

Keys live in `/tmp/mcpprobe/` (`apikey.txt`, `mcpkey.txt`, `mcpkey-readonly.txt`,
`mcpkey-blind.txt`); they are trial-only and can be re-minted from
**Users → API Key** and **MCP → API Keys** in the admin. Fixtures live in
`/tmp/mcpprobe/fixtures/` — recreate them by copying any staged original under
those names.
