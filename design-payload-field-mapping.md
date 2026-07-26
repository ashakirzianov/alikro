# Crow → Payload field mapping (trial)

Branch-only document. Belongs to the Payload kill-test described in
`../axis/docs/crow-payload-trial.md`; production alikro.art still reads from Crow
and is untouched by this branch.

**This is the blessing gate.** Phase 2 (the overnight archive migration) should not
run until Anton has read this and the collections in `payload/collections/`. The
open questions at the bottom are the parts where a wrong guess costs a re-run.

---

## 1. `artworks` — parity with Crow's asset record

Crow's record is `AssetMetadata` in `crow-cms/shared/assets.ts`; alikro re-declares
it in `shared/asset.ts`. Every field maps one-to-one.

| Crow field | Payload field | Type | Notes |
|---|---|---|---|
| `id` | `slug` | text, unique, indexed | **Carry verbatim — never recompute.** Crow's id starts as a slugified filename (`generateAssetId`) but is user-editable, and **149 of the 523 live records have diverged** (`anton-with-the-vessel` ← `F1220031.jpeg`). Deriving instead of copying would break 149 `/all/<id>` URLs. Payload's own `id` is a Postgres serial and is not a public identifier. |
| `fileName` | `filename` | auto (upload) | **The migration join key.** Payload sets it from the uploaded file; Crow's value is what identifies the matching S3 object. |
| `width` | `width` | auto (upload) | Measured by Payload with the `image-size` package — header dimensions, **EXIF orientation not applied** — whereas the variants come out of sharp with `.rotate()`. A `beforeChange` hook on the collection swaps the pair back when it disagrees with the variants, restoring Crow's `sharp().rotate().metadata()` behaviour. Compare against Crow's recorded values during the spot-check. |
| `height` | `height` | auto (upload) | Same. |
| `uploaded` (epoch ms) | `uploadedAt` | date | **Needs conversion:** `new Date(asset.uploaded).toISOString()`. Payload's date validation runs `Date.parse` on the value, and `Date.parse("1771604584246")` is `NaN` — passing the raw epoch fails the create. Explicit field rather than `createdAt`, which Payload owns; alikro's `sortAssets` uses `order`, then newest-`uploaded` first, so the tie-break needs the original value. |
| `order` | `order` | number, indexed | Global position across the archive. Ascending; unset sorts as `0`. |
| `kind` | `kind` | select | Constrained to the nine values in the live data (see §5). Crow's is free text. |
| `title` | `title` | text | Optional in both. All 523 live records have one. |
| `year` | `year` | number | Optional. Live range 2015–2026. |
| `material` | `material` | text | Stays free text — alikro's `shared/material.ts` parses it (`" on "`, `" + "`, `", "`, clay/glaze suffixes) and that parser is the contract. |
| `tags` | `tags` | text, `hasMany` | Free labels, same as Crow. But most current tags become **series** instead — see §2. |
| — | `series` | relationship → `series`, hasMany | New. |
| — | `exhibitions` | relationship → `exhibitions`, hasMany | New. |

**Added by Payload, no Crow equivalent:** `mimeType`, `filesize`, `url`,
`thumbnailURL`, `sizes.*` (per-variant url/width/height/filesize/filename),
`createdAt`, `updatedAt`, `_artworks_artworks_order` (the fractional index behind
series drag-ordering).

**Dropped from Crow:** nothing.

### Migration join

For each file staged from `alikro/originals/`, join on **`fileName`** to the
exported Crow metadata, then `payload.create` with the mapped fields plus the file
bytes. Filenames are unique across the 523 live records (verified), so the join is
clean and one-to-one. Idempotency key for resume: `slug` (equivalently, `filename`).

**Create sequentially, not in parallel.** The fractional index behind series
ordering is allocated in a `beforeChange` hook that reads the current maximum and
generates a key after it — no lock, no unique constraint. Two concurrent
`payload.create` calls read the same maximum and get the same key. Parallelising
the archive pass is the obvious optimisation and it is the wrong one.

**Also budget for:** a single unreadable original hard-fails its `payload.create`
with `FileUploadError`. Crow tolerates this (`failOnError: false`); Payload gives
no way to reach the variant pipeline's sharp constructor, so the resumable script
has to catch, log, and continue.

---

## 2. `series` — the "beyond parity" layer

Today a "series" is a hardcoded query in `shared/collection.ts`, matched against
free-text tags at request time. Payload makes it a document.

| alikro collection id | tag it queries today | live tag in the data | artworks |
|---|---|---|---|
| `self-portraits` | `Self-portrait` | `selfportrait` | 26 |
| `friends` | `Friend Portrait` | `friend portrait` | 11 |
| `black-list` | `The Black List` | `The Black List` | 9 |
| `nai` | `NAI` | `NAI` | 10 |
| `sketches-from-museums` | `Sketch from Museum` | `sketch from museum` | 7 |
| — | — | `Vika Temnova` | 2 |
| — | — | `Porteño` | 1 |

> **Three of these are currently broken.** `matchQuery` does a case-sensitive
> `tags.includes(...)`, and `Self-portrait` / `Friend Portrait` /
> `Sketch from Museum` do not match the stored `selfportrait` /
> `friend portrait` / `sketch from museum`. Those three collections render empty
> today. Migrating series into documents fixes this by construction — worth
> confirming against production before assuming the `assets.json` snapshot is
> current.

**Not series:** `favorite` (60) and `secondary` (9) stay flat `tags` — they are
flags on a work, not bodies of work. `kind` (medium) stays a field: the
`paintings` / `drawings` / `ceramics` / `illustrations` / `posters` / `collages`
collections in `shared/collection.ts` are `kind` queries and remain so.

Fields: `slug`, `title`, `description`, `cover`, `featured` (show in nav),
`order` (position in nav), and `artworks` — a `join` on `artworks.series` with
`orderable: true`, which is what turns "reorder a gallery" into a drag inside one
document.

---

## 3. `exhibitions` — no Crow equivalent at all

Nothing in Crow represents a show. Fields: `slug`, `title`, `venue`, `city`,
`startDate`, `endDate`, `description`, `externalUrl`, `cover`, and an `artworks`
join. Populated by hand during the playtest — this is deliberately the part of the
trial where Payload is asked to do something Crow cannot.

---

## 4. Media pipeline

| Crow | Payload |
|---|---|
| `alikro/originals/<fileName>` | the upload's main file, **unconverted** (no top-level `formatOptions`, so original bytes are preserved) — except animated types, where Payload always builds a sharp instance and stores a libvips re-encode. Affects exactly one live asset, `gay_love.gif`. |
| `alikro/variants/<fileName>@w<width>.webp`, widths 320/480/640/768/960/1200/1600/1920 | eight `imageSizes` named `w320`…`w1920`, each `formatOptions: webp` |
| webp `quality: 80, effort: 5, smartSubsample: true` | same values, copied verbatim |
| `resize({ width, withoutEnlargement: true })` | `withoutEnlargement: true` per size |
| one extra full-size `@.webp` variant | **not reproduced** — alikro's `imageSrc` always passes a width, so nothing requests it |
| on-demand variant fallback endpoint that persists to S3 | **not reproduced** — Payload is eager-only. Deferred deliberately and confirmed recoverable (see the trial doc). |
| sharp `animated: true` for gif/webp | same — Payload sets it for `image/gif`, `image/avif`, `image/webp`, so the one animated asset keeps its frames |

**Eight sizes does not mean eight files.** `withoutEnlargement: true` returns the
original width for anything smaller, and Payload names variants by their *actual*
output dimensions — so for the 478 originals narrower than 1920px, several `sizes`
entries collapse onto one file (399 are narrower than 1600 as well). Semantically
identical to Crow, which writes distinct names holding identical bytes, but the
object count in the parity spot-check will legitimately differ.

**One route asks for widths that will not exist.** `app/api/og/[...slug]/route.tsx`
computes an arbitrary width from the asset's aspect ratio and passes it to
`imageSrc`; under Crow that falls through to the on-demand generator. Payload is
eager-only with exactly eight named sizes, so this is a concrete answer to the
trial plan's open question "record whether the absence of the fallback ever bites"
— it bites here, and the OG route needs to snap to the eight widths (or read
`doc.sizes`) during the Phase-2 rewiring.

**URL shape changes.** Crow: `<IMG_BASE>/<fileName>@w320.webp`. Payload:
`<bucket-or-CDN>/<prefix>/<basename>-320x<h>.webp`, read from `doc.sizes.w320.url`
rather than constructed by the client. Payload's `generateImageName` per image size
could reproduce Crow's exact naming if URL parity ever matters; the trial does not
use it, because Phase 2 points the site at the Local API where `sizes` is available
directly.

**Storage.** `@payloadcms/storage-s3` engages only when `S3_BUCKET` is set;
otherwise uploads go to `media/` on local disk, which is how this branch runs
without credentials. The `artworks` collection sets
`disablePayloadAccessControl: true` — **verified present in 3.86.0** — so file URLs
point straight at the bucket (or `NEXT_PUBLIC_PAYLOAD_ASSETS_DOMAIN`) instead of
being proxied through Payload's own route with per-request access control. That was
the Phase-1 verification item from the trial plan: it exists and is per-collection.

Two consequences of that flag that are Anton's to action in Phase 2:

- **The bucket needs a public-read policy.** Turning off Payload's access control
  also removes its static handler, so there is no serving path other than the
  bucket itself. The config sets no `acl` (and `public-read` would be rejected
  anyway on a modern bucket with Block Public Access on and bucket-owner-enforced
  ownership) — so the trial bucket needs an `s3:GetObject` policy on `<prefix>/*`.
- **The public URL host is built explicitly** in `payload.config.ts`, defaulting to
  `<bucket>.s3.<region>.amazonaws.com`. The adapter's own generator would fall back
  to `config.endpoint`, which is unset for plain AWS, and would write the literal
  string `undefined/…` into every `url` and `sizes.*.url` column — at write time,
  so an entire archive pass would have to be redone.

---

## 5. Transformation notes

- **`kind` becomes a select.** Options: `painting`, `drawing`, `ceramic`,
  `illustration`, `poster`, `collage`, `tattoo`, `hidden`, `unpublished` — every
  value in the live archive plus Crow's on-upload default. Migration fails loudly
  on an unknown value, which is the desired behaviour.
- **`kind` conflates medium with publication state.** `unpublished` and `hidden`
  are not media. Inherited from Crow as-is for parity; see the open questions.
  Note only `unpublished` is actually load-bearing — `shared/collection.ts`
  filters it from the `all` collection, but nothing anywhere filters `hidden`, so
  those two records are visible on the site today.
- **Public read is scoped.** `unpublished` and `hidden` are excluded from
  unauthenticated REST/GraphQL reads (signed-in editors see everything, and the
  Local API bypasses access control). Without that, embedding would publish over
  the API what Crow keeps behind a bearer token.
- **Slugs are derived, not required.** The admin validates required fields in the
  browser before it POSTs, so a `required` slug would force Alina to hand-type one
  on every upload and the derivation hook would never run.
- **`tattoo` is invisible on the site.** `shared/preprocess.ts` filters it out
  client-side. Migrated as-is — the filtering stays in alikro's code for now.
- **New uploads get a Crow-shaped slug.** A `beforeValidate` hook on `slug`
  reproduces `generateAssetId` (lowercase, non-alphanumerics → `-`), so a piece
  uploaded through the Payload admin lands on the same URL it would have had in
  Crow.
- **`order` is global, not per-series.** Crow has one linear ordering (live data:
  1–513, plus ten zeros). Per-series ordering is new and lives on the series
  document.

---

## 6. Open questions for Anton — the blessing gate

1. **`kind` vs publication state.** Split `unpublished`/`hidden` out into a
   `status` field (or a `published` checkbox) and let `kind` mean medium only? It
   is the right model and the migration is the cheap moment to do it — but it
   changes alikro's query code, so it is not free. *Default if you say nothing:
   keep Crow's shape.*
2. **Per-series ordering is approximate.** Payload's `orderable` join stores one
   fractional-index column per artwork, and for a `hasMany` relationship the
   reorder scope comes from the artwork's *first* series. A work in two series
   shares one sort key across both. Exact per-series order would need an explicit
   array field on `series` instead of a join — more precise, but loses the reverse
   view on the artwork and the drag UI. Payload also marks `orderable`
   experimental. *Default: keep the join, accept the approximation.*
3. **Exhibition hang order is not orderable at all.** Payload derives the index
   column name from `_{collection}_{fieldName}_order`, so a second orderable join
   named `artworks` on `artworks` would collide with the Series one — same column,
   and the later registration wins the scope mapping. Left off. Fixable by renaming
   the field (e.g. `exhibitions.works`) if hang order matters. *Default: leave it.*
4. **Database migrations.** The Postgres adapter is on its default `push` (dev
   only), which is right while the model is still moving — but it means there is
   no committed migration for a deployed environment, and a *headless* run whose
   schema has drifted calls an interactive prompt, gets the default "no", and
   exits **0**, which reads as success. Run `payload migrate:create` once and
   commit the migration before the archive job. *Default: I do this at the top of
   Phase 2.*
5. **Series seeding needs your eye.** The derivation in §2 is mine, from tags. It
   produces a review list for Alina during the playtest — but if `Vika Temnova` and
   `Porteño` are something other than series (a collaborator? a place?), say so
   before the migration links them.
6. **Multi-image works.** An `artworks` document is one image, exactly like Crow.
   Ceramics with detail shots would want several. Out of scope for the trial;
   flagging because it is the kind of thing the modelling layer is supposed to buy.
