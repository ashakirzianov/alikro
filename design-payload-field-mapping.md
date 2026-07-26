# Crow → Payload field mapping (trial)

Branch-only document. Belongs to the Payload kill-test described in
`../axis/docs/crow-payload-trial.md`; production alikro.art still reads from Crow
and is untouched by this branch.

**Status: blessed 2026-07-26**, with rulings applied — `exhibitions` dropped from
the trial, `kind` split into medium + draft state + an explicit visibility flag,
and the two competing orderings collapsed into one. What remains open is at the
bottom: one real question (which tags are series) and one Phase-2 prerequisite.

---

## 0. Where the numbers come from

**The live Crow archive: 632 records, read 2026-07-26.** An earlier draft of this
document profiled `assets.json` instead — that file is a **February 2026 backup,
109 records stale**, and its tag values have since been recased.

One retraction follows from that: the earlier claim that three "selected"
collection pages render empty in production, from a case-sensitivity mismatch, is
**wrong**. The live tags are `Self-portrait`, `Friend Portrait` and
`Sketch from Museum` — matching `shared/collection.ts` exactly. Those pages work.
There is no production bug, and no confound to record in the playtest.

| | live | Feb backup |
|---|---|---|
| records | 632 | 523 |
| distinct tags | 31 | 9 |
| formats | 337 png, 186 jpg, 106 jpeg, 2 **tiff**, 1 gif | no tiff |
| ids diverged from filename | 190 | 149 |

---

## 1. `artworks` — parity with Crow's asset record

Crow's record is `AssetMetadata` in `crow-cms/shared/assets.ts`; alikro re-declares
it in `shared/asset.ts`.

| Crow field | Payload field | Type | Notes |
|---|---|---|---|
| `id` | `slug` | text, unique, indexed | **Carry verbatim — never recompute.** Crow's id starts as a slugified filename (`generateAssetId`) but is user-editable, and **190 of the 632 live records have diverged** (`anton-with-the-vessel` ← `F1220031.jpeg`). Deriving instead of copying would break 190 `/all/<id>` URLs. Payload's own `id` is a Postgres serial and is not a public identifier. |
| `fileName` | `filename` | auto (upload) | **The migration join key.** Unique across all 632 records, so the join is clean and one-to-one. |
| `width` | `width` | auto (upload) | Payload measures with the `image-size` package — header dimensions, **EXIF orientation not applied** — while variants go through sharp `.rotate()`. A `beforeChange` hook swaps the pair back when it disagrees with the variants, restoring Crow's `sharp().rotate().metadata()` behaviour. |
| `height` | `height` | auto (upload) | Same. |
| `uploaded` (epoch ms) | `uploadedAt` | date | **Needs conversion:** `new Date(asset.uploaded).toISOString()`. Payload runs `Date.parse` on the value and `Date.parse("1771604584246")` is `NaN`, so the raw epoch fails validation. Kept as its own field because `createdAt` is Payload's; alikro's `sortAssets` tie-breaks on it. |
| `order` | `order` | number, indexed | **The single ordering** (see §2). 575 distinct values across 632 records; one record has none and 58 sit at 0. |
| `kind` | `medium` | select | **Split three ways** — see §4. Medium only: painting, drawing, ceramic, illustration, poster, collage, tattoo. |
| `kind: 'unpublished'` | `_status` | draft/published | Payload's native draft state, via `versions: { drafts: true }`. Zero live records carry it today, but Crow stamps it on every fresh upload. |
| `kind: 'hidden'` | `showOnSite: false` | checkbox | Two live records, both digital illustrations made for an app ("Love (for app)", "Love and Kindness (for app)"). They migrate as `medium: illustration` with the box unchecked. |
| `title` | `title` | text | All 632 have one. |
| `year` | `year` | number | All 632 have one. Range 2015–2026. |
| `material` | `material` | text | Stays free text — `shared/material.ts` parses it (`" on "`, `" + "`, `", "`, clay/glaze suffixes) and that parser is the contract. |
| `tags` | `tags` + `series` | text hasMany / relationship | Split by §2. Tags that name a body of work become series documents; the rest stay flat. |

**Added by Payload, no Crow equivalent:** `mimeType`, `filesize`, `url`,
`thumbnailURL`, `sizes.*`, `createdAt`, `updatedAt`, `_status`.

**Dropped from Crow:** nothing.

### Migration join

For each file staged from `alikro/originals/`, join on **`fileName`** to the
exported Crow metadata, then `payload.create` with the mapped fields plus the file
bytes. Idempotency key for resume: `slug`.

**Create sequentially, not in parallel** — and budget for failures: a single
unreadable original hard-fails its `payload.create` with `FileUploadError`. Crow
tolerates this (`failOnError: false`); Payload gives no way to reach the variant
pipeline's sharp constructor, so the resumable script has to catch, log, continue.

---

## 2. `series` — the "beyond parity" layer

Today a "series" is a hardcoded query in `shared/collection.ts`, matched against
free-text tags at request time. Payload makes it a document: `slug`, `title`,
`description`, `cover`, `featured` (show in nav), `order` (position in nav), and
`artworks` — a read-only `join` view of its members.

**Membership is set on the artwork** (`artworks.series`, a hasMany relationship),
so cataloguing a new upload never leaves the document being edited. Only 31 of 632
works carry more than one tag, and 361 carry none, so overlap is rare.

**One ordering, not two.** Per-series ordering is gone: `artworks.order` is the
only sort key, and series pages use it exactly as the tag-driven collections do
today. The alternative was a per-series fractional index on the join, which would
have been a second ordering that drifts from the first with neither derived from
the other — and it was approximate anyway (Payload marks `orderable` experimental,
and for a hasMany relationship the reorder scope comes from the artwork's *first*
series). Payload's native drag-to-reorder is still available as a **replacement**
for the numeric field if the playtest says dragging beats typing numbers; that is
a UX question for Alina, not a schema decision to take now.

---

## 3. Media pipeline

| Crow | Payload |
|---|---|
| `alikro/originals/<fileName>` | the upload's main file, **unconverted** (no top-level `formatOptions`) — except animated types, where Payload always builds a sharp instance and stores a libvips re-encode. Affects exactly one live asset, `gay_love.gif`. |
| `alikro/variants/<fileName>@w<width>.webp`, widths 320/480/640/768/960/1200/1600/1920 | eight `imageSizes` named `w320`…`w1920`, each `formatOptions: webp` |
| webp `quality: 80, effort: 5, smartSubsample: true` | same values, copied verbatim |
| `resize({ width, withoutEnlargement: true })` | `withoutEnlargement: true` per size |
| one extra full-size `@.webp` variant | **not reproduced** — alikro's `imageSrc` always passes a width |
| on-demand variant fallback that persists to S3 | **not reproduced** — Payload is eager-only. Deferred deliberately, confirmed recoverable (see the trial doc). |
| sharp `animated: true` for gif/webp | same — Payload sets it for `image/gif`, `image/avif`, `image/webp` |

**Two tiffs in the archive** (`broken_vessel.tiff`, `a_cup.tiff`). Payload has a
dedicated tiff path — it cannot measure tiffs from a buffer, so it writes a temp
file first. Worth watching in the spot-check; sharp handles the conversion.

**Eight sizes does not mean eight files.** `withoutEnlargement: true` returns the
original width for anything smaller, and Payload names variants by their *actual*
output dimensions — so for the 491 originals narrower than 1920px, several `sizes`
entries collapse onto one file (406 are narrower than 1600 too).

**That kills URL-construction-by-convention, and it is a Phase-2 constraint.**
Crow's contract is that a variant URL is *derivable*: build `file.jpg@w1600.webp`
from filename and width, and CloudFront serves or generates it. Under Payload a
constructed name for a collapsed width does not exist. So alikro's image layer has
to **read `doc.sizes`** instead of composing names — `shared/image.ts` and
`AssetImage`'s snapping loader both change shape. Arguably better (the map is
authoritative and travels with the document through the Local API), but a rewrite,
not a swap. Spot-check accordingly: measure **srcset coverage**, not object counts.

**One route asks for widths that will not exist.** `app/api/og/[...slug]/route.tsx`
computes an arbitrary width from the aspect ratio and passes it to `imageSrc`;
under Crow that falls through to the on-demand generator. This is a concrete answer
to the trial plan's "record whether the absence of the fallback ever bites" — it
bites here, and the OG route must snap to the eight widths during Phase-2 rewiring.

**Storage.** `@payloadcms/storage-s3` engages only when `S3_BUCKET` is set;
otherwise uploads go to `media/` on local disk, which is how this branch runs
without credentials. `disablePayloadAccessControl: true` on `artworks` — verified
present in 3.86.0 — points file URLs straight at the bucket. Two consequences for
Phase 2:

- **The bucket needs an `s3:GetObject` policy** on `<prefix>/*`. Disabling
  Payload's access control also removes its serving route, so the bucket is the
  only path.
- **The public URL host is built explicitly** in `payload.config.ts`, defaulting to
  `<bucket>.s3.<region>.amazonaws.com`. The adapter's own generator falls back to
  `config.endpoint`, unset for plain AWS — it would have written the literal string
  `undefined/…` into every `url` and `sizes.*.url` column at write time, i.e. an
  entire archive pass redone.

---

## 4. Transformation notes

- **`kind` split three ways.** Crow's single field carried medium, publication
  state and a hardcoded site exclusion. Now: `medium` (7 values, medium only);
  `unpublished` → Payload's native draft state; `hidden` → `showOnSite: false`;
  and the `kind !== 'tattoo'` filter in `shared/preprocess.ts` → `showOnSite:
  false` on the 53 tattoos, so the exclusion is visible and editable instead of
  buried in the consumer's code.
- **Public read is scoped to published.** Unauthenticated REST/GraphQL sees
  published work only; editors see everything; the Local API bypasses access
  control entirely. An unscoped `read: () => true` would have served drafts that
  Crow keeps behind a bearer token.
- **Slugs are derived, not required.** The admin validates required fields in the
  browser before it POSTs, so a `required` slug would force a hand-typed value on
  every upload and the derivation hook would never run. The hook reproduces Crow's
  `generateAssetId` for new uploads; migrated records carry their id verbatim.
- **`Favorite` (59) stays a flat tag** — a flag on a work, not a body of work.
- **`medium` collections are unchanged.** The `paintings` / `drawings` /
  `ceramics` / `illustrations` / `posters` / `collages` pages are medium queries
  and stay that way.

---

## 5. Still open

1. **Which tags are series?** This is the one question left, and it is yours —
   31 distinct tags, and the answer decides what the migration links. Confirmed so
   far: `Vika Temnova` (posters made for her) and `Porteño` (Buenos Aires) are
   series. My proposed default for the rest:

   | group | tags | → |
   |---|---|---|
   | bodies of work | Green Theatre (26), Vietnam (22), Sketch from Museum (20), The Black List (15), Ukrainian History (14), NAI (11), Friend Portrait (11), Self-portrait (28), Venice Beach (9), IT (9), Plates (6), Kunsht (4), Vsi.Svoi (3), Cat Hotel (3), Anton (12), War (12), Vika Temnova (2), Porteño (1) | series |
   | poster topics, 2019–21, 35 works, no shared campaign tag — Eating Disorders, Illness Anxiety Disorder, Menstruation, Abuse, Cat Calling, Parenthood, Children Watch Porn, Sperm Donation, School Bullying, Toxic Masculinity, Organ Donation, Sirens | each 1–4 works | series each, unless they are one campaign — **your call** |
   | flag | Favorite (59) | stays a tag |

   Correct anything wrong here and I will seed from it; silence means I migrate the
   table as written and Alina reviews the result during the playtest.

2. **Database migrations — a Phase-2 prerequisite, not a question.** The Postgres
   adapter is on its default `push` (dev only), which is right while the model
   moves, but it leaves no committed migration for a deployed environment — and a
   *headless* run whose schema has drifted hits an interactive prompt, takes the
   default "no", and exits **0**, which reads as success. I run
   `payload migrate:create` and commit the migration before the archive job.

---

## 6. Recorded for the trial write-up

- **Version coupling is a recurring cost.** Embedding pins alikro's Next floor to
  whatever the installed Payload requires — 3.86.0 demands `>=16.2.6`, forcing
  16.1.6 → 16.2.12, React 19.2.4 → 19.2.8, and a full ESM conversion. Payload v3
  ships near-weekly, so this recurs on every upgrade. Criterion 5.
- **The consumer's image layer is not portable, in either direction** — the largest
  single migration cost found so far (§3). It is symmetric: it would also be the
  cost of ever moving back.
- **Two undocumented media traps**: `image-size` vs sharp `.rotate()` dimensions,
  and eight configured sizes yielding fewer than eight files. Mine are patched or
  accounted for; neither is documented on Payload's side.
- **Drafts are now genuinely exercised** — a baseline dimension Crow scores 1/5 on,
  and one of the strongest reasons Payload might win. Leaving `kind` overloaded
  would have rigged the playtest against it.
- **Stale-backup caution.** `assets.json` is a periodic backup, not the archive.
  Anything derived from it needs re-checking against the live CMS.
