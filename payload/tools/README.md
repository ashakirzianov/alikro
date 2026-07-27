# Trial tooling

Three scripts that were rebuilt from scratch more than once because they lived in
`/tmp`. They exist because Payload's CLI and the preview tooling both fail in
ways that are invisible rather than loud.

## `screenshot.mjs` — page capture

```
# start Chrome once
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --remote-debugging-port=9222 --hide-scrollbars \
  --user-data-dir=/tmp/chrome-shot-profile --no-first-run &

# log in, then capture
TOKEN=$(curl -sS -X POST http://localhost:5733/api/users/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"alina@alikro.art","password":"playtest-2026"}' \
  | python3 -c "import json,sys; print(json.load(sys.stdin)['token'])")

node payload/tools/screenshot.mjs \
  "http://localhost:5733/admin/collections/artworks?limit=24" \
  /tmp/out.png "$TOKEN" 1400 1000
```

**Why not the preview tool:** `preview_snapshot` and `preview_resize` fail on
every call on this machine, while `preview_navigate` / `preview_evaluate` work —
so the browser is fine and you simply cannot get an image out of it.

**Why headless specifically, and not a screen capture:** headless is
**page-scoped by construction**, so it cannot catch Anton's own windows. That
constraint is standing, not situational.

The script polls for images to finish loading before capturing, and warns if they
did not — a screenshot of a half-loaded gallery is a misleading artifact, and the
whole point of the image is that a human judges it.

## `migrate-create.exp` / `migrate-run.exp` — driving the Payload CLI

```
./payload/tools/migrate-create.exp   # wraps `payload migrate:create`
./payload/tools/migrate-run.exp      # wraps `payload migrate`
```

Payload's migration CLI prompts, and **every prompt fails in two directions that
both look like success**:

- Piped, the prompt never reaches the terminal and the process **hangs forever**.
- Unattended, it takes the default and **exits 0**, which reads as success.
- `migrate:create` specifically will EOF out and produce **no migration at all**,
  silently.

`migrate-create.exp` answers every ambiguity with the default, which is always
*create*. **After running it, verify there are zero `RENAME` statements:**

```
grep -c RENAME migrations/<new>.ts   # must be 0
```

A rename looks near-identical to a create-plus-drop and carries data instead of
dropping it. That check is what distinguishes a correct migration from a quietly
wrong one.

**Also:** write migrations idempotently. `migrate:create` diffs code against the
last migration *snapshot*, not the live database, so anything applied by `push`
reappears as catch-up DDL that aborts the batch on "already exists". Use
`IF NOT EXISTS` / `IF EXISTS`, drop-then-add for foreign keys, and a
`DO $$ … EXCEPTION WHEN duplicate_object` block for `CREATE TYPE`, which Postgres
has no `IF NOT EXISTS` for.

## One general rule these all encode

Long runs are **block-buffered through a pipe**. `cmd | grep` shows nothing for
minutes and looks hung when it is working fine — and looks identical to actually
being hung, which is how three runs were misdiagnosed in one afternoon.
Redirect to a file and read the file.
