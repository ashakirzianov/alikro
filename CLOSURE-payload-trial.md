# The Payload trial — closed, and preserved

**Verdict, 2026-08-01: alikro is not adopting Payload. Crow stays.**

Anton and Alina spent time with the running admin and decided against it. This
document exists so that decision survives being forgotten, and so the trial
itself does not have to be re-run by anyone curious about it later.

> *"It was fun to play with mainstream and popular CMS though, and I learned a
> few things about how they work this days. I'd like this experiment to be saved
> somewhere, so I can come back to it if I reconsider, or want to learn more
> about Payload."* — Anton

**This is not a teardown.** Nothing was deleted, reverted or unwound. The
`payload-trial` branch, the migrated data, the trial bucket, the tooling and the
Crow-style re-skin are all intact and are meant to stay that way. §4 is the
instructions for bringing it back up.

**And "saved" means saved.** The trial's data originally lived only in a
free-tier hosted database that suspends on inactivity and fails silently, which
would have made this document a description of something perishable. All 639
records are therefore committed to this branch as readable JSON —
`payload/archive/artworks.json`. §4 says exactly what that covers and what it
does not.

**Read this before re-opening the question.** A rejected option that is not
written down gets restored later as though its absence were an oversight. Payload
was not overlooked here — it was installed, loaded with the real 630-work
archive, driven by agents, re-skinned to look like the incumbent, and put in
front of both of its actual users. It lost on the merits.

---

## 1. Where this lands against the trial's own language

`../axis/docs/crow-payload-trial.md` sketched three outcomes in advance: **MIGRATE**,
**FREEZE** (*"better-but-not-enough to repay migration plus ongoing upgrade
churn"*), and **CROW-WINS** (*"only if Payload concretely fails on image workflow
or agent surface"*).

The result is the **middle one**. Payload did not concretely fail. Media parity
held, agents drove it on three surfaces, and the admin was made genuinely
image-native. It was **better-but-not-enough**, which is the harder and more
useful finding, because it is the one that a demo cannot produce.

*Two things that mapping does not say.* The label is a mapping onto the sketch's
vocabulary, not a phrase Anton used. And FREEZE in the sketch had a second clause
about stopping generic feature work on Crow — **that is a decision about Crow and
it is not settled by this document.** Only the Payload half is decided here.

---

## 2. The criteria, answered

The criteria were written before the trial as *"a compass, not a contract"*. All
six were reached. Criteria 1, 2 and 4 were run by other agents and are recorded
in the linked documents; I am relaying those, not restating them as my own
observation. Criteria 3, 5 and 6 draw on work in this repo including my own.

### 1. Alina's admin UX on image-heavy workflows — *the one that decided it*

Her verdict weighed heaviest by design, and it is what closed the trial. The
first playtest judged the stock admin a downgrade: *"boring", "not image-native"*,
630 artworks presented as rows of titles.

That judgement was of Payload's **defaults**, which no real deployment would
ship — so it was deliberately not accepted as the answer. Two further passes
built the fair version: an image-native list (`SPIKE-image-native-admin.md`) and
then a full re-skin toward Crow (`RESKIN-crow-admin.md`), which Anton reviewed
and ruled *"fair enough"* before Alina saw it. **The verdict recorded here is
against the fair version, not the strawman.** That distinction is the single most
important thing about this criterion, and it is why the trial took as long as it did.

> **Evidence limitation, raised and ruled on.** The admin audit trail for
> Alina's account is not usable — an agent worked under her login for hours
> (Anton's password changed mid-playtest, so hers was the working one), and both
> stored preference rows are the agent's sessions. Anton closed it: *"Alina did
> not make any changes worth preserving. Treat it all as discardable."* The
> contamination is real and did not turn out to be harmless; it is closed because
> the question it endangered was settled **at the source**, by the person who was
> there, rather than at the evidence. Kept on the record because a limitation
> that was raised and ruled on is more useful than one that quietly disappears.
>
> The general lesson is worth more than the incident: **do not authenticate as
> the human you are evaluating.** It destroys the audit trail you may later need,
> and you find out afterwards.

### 2. Effort to model alikro's content — *seen and declined*

This is the trial's most interesting result, and the one most likely to be
mis-summarised.

`series` and a derived `materials` taxonomy were built and migrated over the
full archive — 30 series, 30 materials, 630 artworks. This is Payload's headline
advantage over Crow: real relational modelling with an admin UI for free. Anton
and Alina then asked to revert to Crow's flat shape: one free-text `material`
string and flat `tags`.

A diff of every live `series` and `materials` document against its seed found
**0 divergences across all 60**. Not one description edited, no hierarchy
confirmed, no cover chosen, nothing featured, no ordering set. Every field the
layer added *for a human to fill in* was still at its seed value.

**Say "opened and declined", never "unused".** That was checked rather than
assumed — asked directly, Anton answered *"I have opened both, but didn't edit
it. I confirm requested schema change, yes."* It is the weaker-sounding headline
and by far the stronger evidence: an unopened feature can fail on
discoverability, but this one was opened by the people it was built for and left
untouched by choice. Corroborated independently when the revert was authorised:
*"Alina did not make any changes worth preserving."* Two lines of evidence, one
measured and one from the person who was there, agreeing.

*Recorded rather than glossed:* the reversion has a cost. Folding `favorite`
back into the magic string `Favorite` gives up the one place the split genuinely
improved on Crow. And **two blocking guards died with the taxonomy** — that is
lost error-detection capability, not a lost nicety, and it will bite months from
now with no obvious cause (`design-payload-field-mapping.md` §4a).

The reversion cost minutes and moved zero bytes, because the raw `material`
string had been preserved verbatim on every record at the blessing gate for
exactly that reversibility. **Keeping the source string through a derivation is
what made a rejected model a script rather than a re-migration.**

### 3. Media handling — *parity held, with three undocumented traps*

BYOK storage genuinely works: a fresh bucket, 5,131 objects, URLs pointing
straight at S3 rather than through Payload's serving route, which is what Crow
parity requires. Variant parity holds — the same eight webp widths at Crow's
exact quality settings, copied verbatim so the comparison is byte-level rather
than "webp, roughly".

Three traps, none documented on Payload's side:

- **`image-size` vs sharp disagree on EXIF-rotated images.** Payload measures the
  main file with a library that ignores EXIF orientation while generating
  variants with one that applies it. A portrait photo lays out landscape. Fixed
  with a `beforeChange` hook.
- **Eight configured sizes can yield fewer than eight files**, silently.
- **`adminThumbnail` breaks under `disablePayloadAccessControl`** — and the
  setting that breaks it is the one Crow parity requires. Every admin thumbnail
  500s and renders as a grey file icon. **This is the sharpest of the three
  because its failure mode is silent and the two settings look unrelated.**

**Two of 632 originals could not be ingested at all** — the archive's two tiffs,
both ceramics. Not "Payload is weak at tiff": its *resize* path reads both files
without complaint, but it probes dimensions with a stricter library first, so the
weaker library gates the more capable one. A ~15-line hook would fix it. **It was
deliberately not built**, because patching the gap with our own code would delete
the datapoint the trial existed to collect.

The on-demand variant fallback was dropped as a trial shortcut, with the open
question of whether its absence would ever bite. **It never did** — the eager set
covered every request the site made.

### 4. Agent-operability — *capable, not discoverable*

Revised before the trial to an absolute test: how well can agents drive Payload
through upload, retag and reorder?

**All three tasks completed on all three surfaces** (REST, Local API, MCP).

The criterion had been written expecting failure, on landscape research asserting
Payload had no official MCP server. That was false: `@payloadcms/plugin-mcp`
shipped 2025-10-23, nine months before the research claiming its absence.
**Correcting the premise mattered more than the result** — a criterion written to
expect failure will read a pass as surprising rather than as normal.

The qualifier is the real finding: **retag and reorder are agent-operable
unaided; upload is not.** The capability exists on every surface, but an agent
does not discover the upload path without being told — the MCP route is real and
is not where the schema says it is. **Capability was demonstrated; discoverability
was not.** Those are different properties and only one of them was being tested.
Detail in `PROBE-agent-operability.md`.

### 5. Maintenance weight vs Crow's ~zero — *the criterion that carried the verdict*

Two independent measurements, and they agree.

**Version coupling.** Embedding pins alikro's Next floor to whatever Payload
requires. Installing 3.86.0 forced Next 16.1.6 → 16.2.12, React 19.2.4 → 19.2.8
and a full ESM conversion. Payload v3 ships near-weekly, so this recurs on every
upgrade. The MCP plugin's peer dependency is pinned to an **exact** core version,
so the agent surface must move in lockstep too.

**The cost of looking like Crow.** The re-skin was measured in four tiers,
because they fail differently and a single total hides that:

| tier | what | lines | how it breaks |
|---|---|---|---|
| A | theme variables (`:root`) | 12 | it doesn't — no Payload identifier named |
| B | first-party config | 24 | typechecked; a rename is a **build error** |
| C | components we wrote + their CSS | 247 | Payload can't break it, or maintain it |
| D | **Payload-internal CSS selectors** | 17 / **3 selectors** | **silently** |

**The decisive number is not 300. It is 1 → 3.** The tier-D selector count went
from one (after the image-native spike) to three (after the re-skin) in a single
afternoon of ordinary requests. A snapshot says *"300 lines, cheap."* The series
says *the fragile surface grows whenever anyone actually styles this* — and those
are different answers to this criterion.

Why tier D exists at all: **Payload's admin is monochrome by design and exposes
no brand-accent variable.** Its primary button is painted with
`--theme-elevation-800` — the same variable as body text, input text, field
labels and icon fills, 61 declarations in the shipped stylesheet — so overriding
it to red turns every form input's text red. "Give this admin a brand colour" is
not expressible in the supported variable set. Wanting the artwork *bigger in its
own editor*, about as core a request as an art CMS gets, was not expressible
either, and became the third coupled selector.

Each of the three fails with **no error and no deprecation**. The worst is
`.collection-list--artworks .table`: when it goes stale the symptom is a
redundant 630-row table quietly reappearing underneath the gallery.

**So the honest statement of the trade is not "Payload plus 300 lines."** It is:
Payload, plus a bespoke image-native admin written in React, living against
someone else's weekly release train, with three silent tripwires in it — which is
approximately a description of Crow, with a database and a draft system attached.
Against Crow's ~zero maintenance weight, that is what did not repay the
migration.

### 6. Substrate for a future vision-native fork — *no longer clear-cut, and left open*

The pre-trial framing had Payload bringing a maintained admin and an AI-plugin
ecosystem, but inheriting a weak agent surface and someone else's roadmap. The
"weak agent surface" half was struck — it rested on the same false premise as
criterion 4 — and that cuts **both ways**: first-party and maintained in lockstep
is a point in Payload's favour as a substrate, *and* one more thing that must
move on every upgrade.

One structural finding is fork-relevant regardless of verdict: **the Local API is
only available to something running inside the app.** If that is the surface
carrying agent work, it argues for the embedded topology and does not survive a
separate-app deployment.

**This criterion is not closed by this document.** It was about a fork that does
not exist yet, and the trial informs it without deciding it.

---

## 3. What the trial taught about mainstream CMSes

This is the part Anton asked to keep, and it is separable from the decision. If
the verdict is ever reversed, this section is still true.

**The admin is generated from the schema, and that is the whole trade.** You
describe collections and fields in config; the entire editing interface — list
views, forms, validation, relationship pickers, draft/publish, versioning,
access control — is derived. What you get for free is enormous and arrives
instantly: a working multi-user CMS over a 630-record archive existed within a
day. What you cannot easily get is anything the generator did not anticipate,
because there is no seam between "your data model" and "your interface." Crow
inverts this: nothing is free, and everything is reachable.

**They are optimised for text-shaped content, and images are a field type.** The
default list view is a table of rows because most collections are articles,
products, pages. For an art archive the *picture is the record*, and every
image-native thing — thumbnails at a useful size, natural aspect ratios, the work
large in its own editor — is something you add back. This is not a Payload
defect; it is what "general-purpose CMS" means. **It is also the single best
predictor of whether one of these systems will suit a given project.** Ask what
shape the content is, and whether the product's defaults assume that shape.

**Escape hatches are ranked, and the ranking is the thing to learn.** Every
mainstream CMS offers several ways to customise, and they differ enormously in
durability even though they look equally official in the docs:

1. **Config** — typechecked. A rename is a build error. Safest by a wide margin.
2. **Documented CSS variables** — safe, but only reach what the vendor chose to
   expose, which is a *much* smaller surface than it appears. Payload exposes ~30
   theme variables and not one of them is a brand accent.
3. **Component slots** (`beforeListTable` and friends) — supported, but they
   *add*; they rarely *replace*. You can put a gallery above the table. You
   cannot remove the table.
4. **Reaching into the vendor's own class names** — works immediately, looks
   identical in a diff, and fails silently on any upgrade.

Real customisation pushes you down this list, and **the number of level-4 hooks
is a better health metric than the line count.** That is the generalisable form
of the 1 → 3 finding.

**Draft/publish is a genuine primitive worth wanting.** Crow scores near zero
here, and Payload's version is real: draft state, version history, scheduled
publish. It was the one feature the playtest rated a win. **And it was broken in
the consumer** — drafts were publicly visible on the site, because the site reads
through the Local API, which bypasses access control entirely, so the one
component holding the rule was never on the path. Every component was
individually correct. **An end-to-end path can be broken while every component
along it looks correct** — which is why it took a real person doing a real thing
to expose it, on a system that had been "verified working" for days.

**Agent-operability has arrived and the landscape data rots fast.** A first-party
MCP server existed nine months before the research asserting it did not. Anything
written about which CMS is agent-friendly is stale on a scale of months. And the
distinction that actually matters is **capability versus discoverability** —
Payload could do all three tasks, and an agent could not find the upload path
alone.

**Embedding couples your version floor to theirs.** A CMS installed *into* the
app is not a dependency you upgrade on your schedule. Weekly-release projects
make this a standing tax rather than an occasional one. Worth knowing before you
choose embedded over standalone; it does not show up in any feature comparison.

**Where Crow's design agrees, and where it does not.** Crow independently arrived
at the same answers on the things that matter for this archive: images at natural
proportions in a dense wall, one accent colour, near-zero chrome, a flat
vocabulary the artist types freely. The re-skin's job was largely to make Payload
*stop* doing things Crow never did. Where Payload is genuinely ahead is
unglamorous and real — drafts and versioning, multi-user access control, a
relational model with an editing UI for free, and a migration system. **The trial's
actual finding is that alikro does not need those enough to pay for them, not
that they are worthless.**

---

## 4. Bringing it back up

For a reader six months out who wants Payload running to poke at it.

**Everything lives on the `payload-trial` branch of `alikro-art`.** Never merged
to `main`; production alikro.art has always run on Crow and was never touched.

```
git checkout payload-trial
cp .env.example .env.local     # then fill in — see below
npm install
npm run dev                    # /admin is the Payload admin
CONTENT_SOURCE=payload npm run dev   # the SITE reading Payload — this is the A/B
```

Pass `-p 5733` explicitly if a specific port matters: `next dev` silently moves
to another port even when the requested one is free, and every documented URL is
then wrong.

### What will silently not work — read this first

**The two external dependencies are the ones most likely to be gone, and neither
fails loudly.**

- **The Neon Postgres database.** Free-tier projects suspend on inactivity and can
  be removed entirely after long enough. If it is gone, the app still builds and
  `/admin` fails on first request. **The records are committed to this branch**
  (see below), so the archive survives it — but the live database does not.
  Standing it up again means a new Postgres and `payload migrate` to build the
  schema from the committed migrations.
- **The S3 bucket `alikro-payload-trial`** (us-east-2, 5,131 objects). It costs
  money to keep, so it may have been cleaned up. If it is gone the admin loads
  normally and **every image is broken** — the records still carry URLs pointing
  at a bucket that no longer answers.

**If both are gone, the branch is still a complete working example** of the
config, schema, migration tooling and re-skin, *plus* the full catalogue as text.

### What is actually saved, and what is not

`payload/archive/artworks.json` — **all 639 records, committed.** Regenerate with
`npx tsx payload/tools/dump-archive.mts`. Plain pretty-printed JSON on purpose,
not a `pg_dump`: the point is that someone can open it and read what the trial
held whether or not they ever restore it.

**It covers:** every artwork's `slug`, `title`, `year`, `material`, `medium`,
`tags`, `order`, `showOnSite`, `_status`, timestamps, dimensions, filename, and
all eight variant URLs — 630 published works plus the nine drafts, with the 31
distinct tags intact. That is the catalogue: everything the artist typed and
everything the migration derived.

**It does not cover:**

- **The image bytes.** This is metadata only. See below for why that is the right
  call rather than an omission.
- **The `users` collection**, deliberately — it holds password hashes and salts
  and this branch is on a public remote. A revived instance has **no login**;
  create one with `npx payload create-first-user`, or point `.env.local` at a
  database and use the admin's own first-run screen.
- **Version history.** Each record's *current* state is dumped, including drafts.
  The `_artworks_v` version rows behind Payload's drafts feature are not.
- **The one empty folder** left from testing Payload's folder view.
- It is a **record dump, not a database restore.** Re-creating records from it
  means a create loop, not a SQL import.

**One non-obvious thing that makes the fixtures survivable.** Record 632 is
load-bearing because of its *state* — a draft with `showOnSite: true` — not
because of its pixels, which are a screenshot. And Payload skips upload
validation for drafts (the same behaviour that let the criterion-4 probe create
record 637 with no file at all). So the draft-leak guard's fixture **can be
rebuilt from this dump without its image**, even if the bucket is long gone.

### Why the media is deliberately not committed

**None of it is the only copy, and that was checked rather than assumed.**

- The **630 migrated originals** were staged from Crow's own `alikro/originals/`
  (`CROW_STAGING_DIR` in the migration). They live in Crow's production bucket,
  which is the live system. The trial bucket was always a second copy.
- The only files that exist **solely** in the trial bucket are the eight draft
  uploads: one playtest check JPEG, one screenshot of the admin, and six
  synthetic probe PNGs. **Not one is an artwork.** Losing them costs nothing that
  the records themselves do not already document.

So committing ~5 GB of media would preserve nothing that is not already
preserved, at real cost to the repo. If that ever changes — if some trial upload
becomes the only copy of something that matters — that is a different decision
and worth revisiting.

Other things that will bite:

- **`.env.local` is gitignored.** `.env.example` documents every variable and why.
  Leaving `S3_BUCKET` empty falls back to local disk, which is how the branch runs
  before any credentials exist — a good way to see the admin without infra.
- **Agent shells inherit `NODE_ENV=development`, which breaks `next build`.** See
  the ⚠️ section in `CLAUDE.md`. This cost multiple sessions across two tracks.
  Check the environment before investigating any red build a human cannot reproduce.
- **Leave `push: false` in `payload.config.ts`.** It defaults on in dev and stops
  every Payload-booting script on an interactive `DATA LOSS WARNING` prompt —
  which, piped, is invisible and hangs forever, and unattended takes the default
  and **exits 0**, reading as success. Both were hit.
- **The committed `crow-export.json` is refused as stale after 24h.** That is the
  guard working. Re-export; do not set `ALLOW_STALE_EXPORT`.
- **`npx eslint .` crashes on its config.** Genuinely pre-existing, unrelated to
  the trial, and not the `NODE_ENV` issue.
- **Node/Next floor:** Payload 3.86.0 requires Next >= 16.2.6. Downgrading Next
  below that breaks the admin.

### Where things are

| | |
|---|---|
| `payload.config.ts`, `payload/collections/` | schema, storage, MCP plugin |
| `payload/components/` | the re-skin's React — `ArtworkGrid`, `CrowDashboard` |
| `app/(payload)/custom.scss` | the theme, **split into marked tiers** — read the tier banners before editing |
| `payload/archive/artworks.json` | **the committed record dump — all 639 records** |
| `payload/migration/` | export, validate, migrate, spotcheck, tag backfill |
| `payload/probe/` | the criterion-4 agent-operability probes |
| `payload/tools/` + its `README.md` | CDP screenshots, `expect` wrappers for Payload's prompting CLI, draft lister |
| `migrations/` | committed Postgres migrations |

**Read `payload/tools/README.md` before writing any automation.** Payload's
migration CLI prompts in three places and **every prompt fails in two directions
that both look like success** — piped it hangs forever, unattended it takes the
default and exits 0. Those wrappers exist because they were rebuilt from scratch
more than once after living in `/tmp`.

### The trial data is fixtures, not litter

**Do not tidy the drafts.** 639 records = 630 migrated + 9 drafts, and the drafts
are evidence:

- **Record 632** is the only record in the entire archive that can express the
  draft-leak failure, because all 630 migrated works are published. Delete it and
  `migrate:spotcheck`'s draft guard stops testing anything — it prints
  `NOT EXERCISED` rather than lying, but the protection is gone.
- **633–639** are the criterion-4 probe records.
- **631** ("PLAYTEST upload check (delete me)") is the only genuinely disposable one.

`npx tsx payload/tools/list-drafts.mts` prints all nine with the titles the admin
shows, flagging the load-bearing one.

> **A near-miss worth generalising.** Record 632 had **no title at all** until
> 2026-07-28. In the admin it read as an untitled stray screenshot — sitting
> directly beside record 631, which is literally titled *"(delete me)"*, in a
> playtest brief that told the artist deleting the junk draft was a fine first
> task. The re-skin had just made drafts considerably more visible. Three
> independent things lined up to destroy a fixture that two agents had built and
> proved, and the guard would then have degraded to a **vacuous pass** rather
> than failing loudly.
>
> It is now titled *"KEEP — draft-leak guard fixture (do not delete)"*. The
> general shape is the lesson: **a fixture whose importance is invisible from its
> name is one tidy-up away from gone.** Put the warning in the artifact, not in a
> document about the artifact — the person about to delete it is looking at the
> name, not at your note. And when the fix is an edit to the fixture itself, verify
> the guard still fires afterwards; retitling 632 through a plain update would
> have **published** it and destroyed exactly what it protects.

### Checking it still works

```
npm run migrate:spotcheck        # parity + the draft-leak guard
npm run probe:rest / :local / :mcp
NODE_ENV=production npm run build
```

**`migrate:spotcheck` is the one to trust**, because it was built to fail before
it was trusted: it calls the site's real query function rather than
reconstructing it, and prints `NOT EXERCISED` rather than passing quietly when it
has no fixture. Every guard on this branch was made to fire before it was
believed — the export-staleness check, the unclassified-tag block, the draft-leak
guard. **A guard nobody has watched fail is a guard nobody should believe.**

---

## 5. The documents, and what each is for

| document | what it holds |
|---|---|
| **this file** | the verdict, the criteria answers, the CMS lessons, the revival path |
| `HANDOFF-payload-trial.md` | operational state and the traps, for someone working *on* the branch |
| `design-payload-field-mapping.md` | the field-by-field model; **§4a is the reversion** — built, judged, rejected |
| `SPIKE-image-native-admin.md` | the image-native list view, and the draft leak it uncovered |
| `RESKIN-crow-admin.md` | the Crow re-skin, the tiered cost, the tier-D series |
| `PROBE-agent-operability.md` | criterion 4 in full |
| `PLAYTEST-payload.md` | the brief the humans were given |
| `../axis/docs/crow-payload-trial.md` | the pre-trial plan and the criteria as originally written |

Two documents contain **struck-through** claims that later proved wrong — the
"pre-existing build failure" in the handoff, and the "no official MCP server"
landscape research in the axis doc. They are struck rather than deleted on
purpose. **A correction that erases what it corrects teaches nobody why the
mistake was reachable**, and both of those mistakes were reachable in ways worth
remembering: one was an environment difference that made every agent agree with
every other agent and disagree with the human, and the other was research that
had simply aged.

Note also that `design-payload-field-mapping.md` §5 ("Still open") is **stale by
design** — it predates the reversion and asks about series that no longer exist.
It is preserved as the record of what was open at the time.

---

## 6. If the question ever comes back

Re-opening this is legitimate. Things change: Payload's admin may become
image-native, the maintenance surface may stabilise, or alikro's needs may grow
toward multi-user editing and versioning in a way that changes the arithmetic.

**But re-open it on new information, not on absence of memory.** The specific
questions that would need different answers:

1. Does Payload now expose a brand accent, or a supported way to replace a list
   view? That is what tier D was buying around, and it is the criterion-5 crux.
2. Has the release cadence slowed enough that the version-floor coupling stops
   being a standing tax?
3. Does alikro now need drafts, versioning or multi-user access enough to pay for
   them? The trial found it did not — it did not find them worthless.
4. Has the content shape changed such that a table-first admin is no longer wrong
   for it?

If the answer to all four is still no, this document is the answer, and the work
does not need repeating.
