# Payload trial — handoff

For the agent picking this up **rooted in `alikro-art/`** rather than in `axis`.
The design record is `design-payload-field-mapping.md` — read it first; this file
only covers what that document does not.

## Where things stand — updated 2026-07-27, after the playtest

**The playtest happened and the modelling layer was reverted.** Phases 1–3 are
done. What is left is one authorised-but-unstarted unit (below).

Write-ups, each self-contained:
- `design-payload-field-mapping.md` — **§4a is the headline**: the modelling
  layer was built, judged and rejected. §2/§2b are marked REVERSED and kept as
  the record of what was built.
- `SPIKE-image-native-admin.md` — the image-native admin grid (~140 lines) and
  the draft leak it uncovered.
- `PROBE-agent-operability.md` — criterion 4, closed. Payload ships a
  **first-party** MCP server, which the landscape research predates.

- Branch `payload-trial`, ~20 commits, **local only — never pushed, never merged.**
- `main` is untouched. Production alikro.art still reads from Crow.
- `../crow-cms` is **read-only** and was never modified.
- Live: Neon Postgres with **639 artworks** (630 migrated + 9 drafts), flat
  `tags`, no `series`/`materials` collections; S3 bucket `alikro-payload-trial`
  (us-east-2), 5,131 objects; admin at `/admin`.

### The re-skin — authorised and DONE (2026-07-27)

**`RESKIN-crow-admin.md` is the write-up.** Screenshots, the tiered cost, and
the open questions for Anton and Alina are all there.

Headline, because it must not be summarised into a total: **300 owned lines —
12 theme variables, 24 config, 247 components, and 17 across three
Payload-internal CSS selectors that a release can rename with no error.**
The tier-D list went from **1 selector to 3** in one afternoon of ordinary
requests, which is the fact worth carrying.

**Anton ruled on it 2026-07-28: *"Fair enough — stop, hand to Alina."*** Styling
is closed; the tier-D selector series is closed at 3. The three judgement calls
offered to him (header size, no tags in the filter row, Payload's chrome staying)
were all accepted as they stand — see §5 of the re-skin doc, and do not re-open
them as if still live. `PLAYTEST-payload.md` was revised for Alina's session:
it had been telling her to edit the `series` collection, which no longer exists,
and to react to the missing pictures, which are no longer missing.

**The scouted route was only half right.** `admin.dashboard.widgets` and
field-level `position: 'sidebar'` worked exactly as advertised, and `admin.theme`
was a bonus. But **~30 `--theme-*` variables did not cover colour**: Payload
exposes no brand-accent variable, and its primary button is painted with
`--theme-elevation-800`, the same variable as body text and every input's text.
Only 12 variable lines were usable. Everything recognisably Crow came from
components and coupled selectors.

### Two records that are load-bearing — do not tidy them away

Nine drafts exist, all invisible to the site. **Record 632** (`showOnSite:
true`) is the only record in the archive that can express the draft-leak
failure, because all 630 migrated records are published. Delete it and
`migrate:spotcheck`'s draft guard degrades to a vacuous pass — it prints
`NOT EXERCISED` rather than lying, but it stops testing anything.

**It now carries its own warning label.** Until 2026-07-28 record 632 had **no
title**, so in the admin it read as an untitled stray screenshot — sitting beside
631, which is literally titled "(delete me)", in a brief that told the artist
deleting the junk draft was a fine first task. It is now titled *"KEEP —
draft-leak guard fixture (do not delete)"*. The retitle went through the Local
API with `draft: true` (a plain update would have **published** it and destroyed
the fixture), and the guard was re-verified afterwards both ways — still
`9 draft(s), 1 of them with showOnSite=true`, still fires on a broken filter.
`npx tsx payload/tools/list-drafts.mts` prints all nine with admin titles.

## Rules that still apply

- ⛔ **Delete nothing.** No force-push, no history rewriting, no destructive
  resets. This branch is the only copy of the trial.
- **Do not push or merge** without Anton saying so explicitly.
- Agent commits are pre-authorised **on this branch only** — that overrides
  alikro's usual user-commits convention, and only here.
- Two orphans in Crow's bucket (`eye.png`, `love.png`) have no metadata record.
  Leave them; the migration iterates the export and never reads them.

## What changed on 2026-07-27, in one place

- **`push` is now OFF** (`payload.config.ts`). It defaults to on in dev and was
  right while the model moved; with committed migrations it is actively harmful.
  See the bite-list below — it cost three hung runs before the cause was visible.
- **Flat `tags` replaced `series` + `favorite`;** `materials`/`support` are gone.
  `material` is untouched free text, and keeping it verbatim is *why* the
  reversal cost minutes and moved zero bytes.
- **`npm run migrate:tags`** backfills tags from `crow-export.json`, joined on
  slug, idempotent. Records with no export match are **skipped, not errored** —
  that is a provenance rule, not a list of slugs, which is why 7 new probe
  records were absorbed without editing anything.
- **The edit button follows the active CMS** (`shared/href.ts`, `hrefForEdit`)
  via `cmsEditPath` carried on the record — deliberately not a `NEXT_PUBLIC_`
  copy of `CONTENT_SOURCE`, which would give the A/B two switches that can
  disagree.

## Running things

Everything needs `.env.local` (gitignored, already populated on Anton's machine):
`DATABASE_URL`, `PAYLOAD_SECRET`, `S3_*`, `CROW_STAGING_DIR`. `.env.example`
documents them. Load with `set -a && . ./.env.local && set +a`.

| command | what it does |
|---|---|
| `npm run dev` → `/admin` | the Payload admin |
| `CONTENT_SOURCE=payload npm run dev` | the **site** reading Payload instead of Crow — this is the A/B |
| `npm run migrate:export` | refresh the Crow export |
| `npm run migrate:validate` | dry run, no DB needed |
| `npm run migrate` | resumable archive pass (already complete) |
| `npm run migrate:spotcheck -- --all` | parity check across all 630 |
| `PAYLOAD_MCP=1 npm run dev` | same, plus Payload's MCP server at `/api/mcp` |
| `npm run probe:rest` / `:local` / `:mcp` / `:mcp-gate` | the criterion-4 agent-operability probes |
| `npm run probe:restore -- --check` | assert the `plates` gallery is at its pre-probe order |

## Things that will bite you

- **`npx tsc` is not the typechecker if your cwd has drifted.** Outside a project
  with TypeScript installed, `npx tsc` fetches an npm *squatter* that prints a
  banner instead of typechecking. Use `./node_modules/.bin/tsc` and pin the
  directory (`git -C`, `npm --prefix`).
- **The committed `crow-export.json` will be refused as stale** after 24h. That
  is the guard working. Re-export; do not set `ALLOW_STALE_EXPORT`.
- **`npm run build` fails prerendering `/_global-error`**, and `eslint` crashes on
  its config. Both **reproduce on pristine `main`** — pre-existing, not yours.
  Use `next build --debug-prerender`, which is green.
- Long runs are **block-buffered** through a pipe, so progress appears in batches.
  The S3 object count is a better live progress signal.
- **The preview tool's screenshot path is broken on this machine.**
  `preview_snapshot` and `preview_resize` fail on every call (snapshot returns a
  bare failure, resize times out); `preview_navigate` and `preview_evaluate` work
  fine, so the browser itself is healthy — you just cannot get an image out of
  it. When a screenshot is the deliverable, drive **headless Chrome over CDP**
  (`--headless=new --remote-debugging-port=9222`, then `Network.setCookie` +
  `Page.captureScreenshot`). Do that rather than any screen-capture route:
  headless is **page-scoped by construction**, so it cannot catch Anton's own
  windows. That constraint is standing, not situational.
- **`next dev` does not always take port 5733**, even when it is free — it
  silently moves to 5734 and every documented URL is then wrong. Pass `-p 5733`
  explicitly.
- **⚠️ The worst trap on this branch: interactive prompts inside automated runs.**
  Payload's CLI prompts in three places, and **every one of them fails in two
  directions that both look like success**:
  - `payload migrate` with `push` on stops at `DATA LOSS WARNING — accept and
    push? (y/N)`. **Piped, the prompt never reaches your terminal and the process
    hangs forever**; unattended it takes the default and **exits 0**. Three runs
    hung here before the cause was visible. Fixed by `push: false`, but any
    future schema work can resurrect it.
  - `payload migrate:create` asks *is this table created or renamed?* per
    ambiguous table. A headless run EOFs out and **produces no migration at all**,
    silently. Drive it with `expect` (`/tmp/migcreate.exp` pattern: answer the
    default, which is always "create"). **Then verify zero `RENAME` statements in
    the output** — a rename looks near-identical and carries data instead of
    dropping it. That check is what distinguishes a correct migration from a
    quietly wrong one.
  - Long runs are block-buffered **through a pipe**. `cmd | grep` shows nothing
    for minutes and looks hung. Redirect to a file (`> /tmp/x.log 2>&1`) and read
    the file instead.
- **`migrate:create` diffs code against the last migration *snapshot*, not the
  live database.** Anything `push` applied without a migration (folders, MCP)
  reappears as catch-up DDL that aborts the batch on "already exists". Write
  migrations idempotently: `IF NOT EXISTS` / `IF EXISTS`, drop-then-add for
  foreign keys, and a `DO $$ … EXCEPTION WHEN duplicate_object` block for
  `CREATE TYPE`, which Postgres has no `IF NOT EXISTS` for.
- **`screenshot.mjs` now always warns "images did not all finish loading".** It
  is a **false alarm** since the re-skin: the grid sets `loading="lazy"`, so
  off-screen images legitimately never complete. Do not read it as a broken
  capture — and do fix it, because a warning that always fires trains people to
  ignore the one time it means something.
- **The scripts for all of the above are in `payload/tools/`** — screenshot
  capture over CDP, and `expect` wrappers for both migration commands. They were
  rebuilt from scratch more than once because they lived in `/tmp`. Read
  `payload/tools/README.md` before writing your own.
- The migration is **resumable** — resume state is the database, not the log. It
  was killed mid-run once and recovered by simply restarting.

## Do not "fix" these

- ~~**The legacy tag vocabulary is reconstructed, not stored.**~~ **Struck
  2026-07-27 — this warning is dead, and leaving it standing would be worse than
  deleting it.** There is no reconstruction any more: `tags` is a real column
  again, because Anton and Alina judged the modelled shape (`series` relation +
  `favorite` boolean) and preferred Crow's flat one. The warning was correct
  while two data models coexisted; the reversion removed the second model, so
  there is nothing left to keep apart. See §2/§2b of
  `design-payload-field-mapping.md`.
- **The two tiffs are a finding, not a bug to fix.** Payload cannot ingest them
  because it probes dimensions with `image-size` while resizing with sharp, and
  the stricter library gates the more capable one. A `beforeOperation` hook would
  fix it in ~15 lines — deliberately **not built**, because patching the gap with
  our own code would delete the datapoint the trial exists to collect, and both
  remedies cost the artist's original bytes.

## Open, and whose call

| item | owner |
|---|---|
| The 35 poster works on social topics, 2019–21 — twelve series or one campaign? | **Anton** |
| Material hierarchy (six clays, two glazes) — confirm via `Materials.broader` | **Alina** |
| `marker ~ markers` — same term or two? | **Alina** |
| `medium` as a code-defined select vs an editable collection | revisit **after** the playtest |
| Whether the missing on-demand variant fallback ever bites | record during the playtest |

## Before Alina looks

**Tell her two ceramics are absent** ("a cup", "broken vessel") and that it is a
known finding, not a mistake. If she meets it cold she will read it as a bug and
it will colour her feedback on everything else.

## Who to talk to

- **Lead agent** `1e7d36db-8e00-4dfc-b5e8-ebfac641f025` — charges work, holds the
  cross-track picture.
- **Design advisor** `ff958af4-9039-40d8-acff-5e3122ef99ec` — holds the CMS
  landscape research; owns `../axis/docs/crow-payload-trial.md`, which is the
  decided-shape doc. Live findings and open questions belong in the branch doc,
  not there.

## What I would tell my successor, in one line each

- **The reversion is the trial's most interesting result** (§4a). Payload's
  headline advantage, built properly, exercised, and declined by the users. Say
  *opened and declined*, never *unused* — Anton confirmed he opened both screens,
  and that is the weaker headline but the far stronger evidence.
- **Two blocking guards died with the taxonomy.** That is lost *error-detection
  capability*, not a lost nicety, and it will bite months from now with no
  obvious cause. Written up in §4a; don't let anyone summarise it away.
- **Assert the positive signal.** Every check on this branch was made to fail
  before it was trusted — the export-staleness guard, the unclassified-tag block,
  the draft-leak guard. A guard nobody has watched fail is a guard nobody should
  believe. `migrate:spotcheck` prints `NOT EXERCISED` rather than OK when it has
  no fixture, for exactly that reason.
- **Verify against real data, never a stand-in.** The one thing checked with a
  synthetic file — tiff support — is the one thing that failed in production.

## One habit worth keeping

Every guard in this branch was tested by making it fire: the export-staleness
check, the unclassified-tag block, the public-read URL. The one thing verified
against a *stand-in* rather than the real input — tiff support, checked with a
synthetic file while the two real ones sat unopened on disk — is the one thing
that failed in production. When a check exists to answer "will the real data
work?", the real data is the only valid input.
