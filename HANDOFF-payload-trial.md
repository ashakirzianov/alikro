# Payload trial — handoff

For the agent picking this up **rooted in `alikro-art/`** rather than in `axis`.
The design record is `design-payload-field-mapping.md` — read it first; this file
only covers what that document does not.

## Where things stand

Phases 1 and 2 are done. The next phase is the **playtest**, which is human work:
Anton and Alina using the admin and judging it. Your job is to support that, not
to keep building.

Two things happened after the playtest and have their own write-ups:
`SPIKE-image-native-admin.md` (making the admin image-native, and the draft leak
it uncovered) and `PROBE-agent-operability.md` (criterion 4 — closed; Payload
turns out to ship a **first-party** MCP server, which the landscape research
predates).

- Branch `payload-trial`, ~14 commits, **local only — never pushed, never merged.**
- `main` is untouched. Production alikro.art still reads from Crow.
- `../crow-cms` is **read-only** and was never modified.
- Live: Neon Postgres with **630 artworks, 30 series, 30 materials**; S3 bucket
  `alikro-payload-trial` (us-east-2) with 5,131 objects; admin at `/admin`.

## Rules that still apply

- ⛔ **Delete nothing.** No force-push, no history rewriting, no destructive
  resets. This branch is the only copy of the trial.
- **Do not push or merge** without Anton saying so explicitly.
- Agent commits are pre-authorised **on this branch only** — that overrides
  alikro's usual user-commits convention, and only here.
- Two orphans in Crow's bucket (`eye.png`, `love.png`) have no metadata record.
  Leave them; the migration iterates the export and never reads them.

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

## One habit worth keeping

Every guard in this branch was tested by making it fire: the export-staleness
check, the unclassified-tag block, the public-read URL. The one thing verified
against a *stand-in* rather than the real input — tiff support, checked with a
synthetic file while the two real ones sat unopened on disk — is the one thing
that failed in production. When a check exists to answer "will the real data
work?", the real data is the only valid input.
