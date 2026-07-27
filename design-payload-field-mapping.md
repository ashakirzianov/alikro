# Crow → Payload field mapping (trial)

Branch-only document. Belongs to the Payload kill-test described in
`../axis/docs/crow-payload-trial.md`; production alikro.art still reads from Crow
and is untouched by this branch.

**Status: blessed 2026-07-26**, all rulings applied — `exhibitions` dropped from
the trial, `kind` split into medium + draft state + an explicit visibility flag,
the two competing orderings collapsed into one, and `material` modelled into a
taxonomy while keeping the prose (§2b). What remains open is at the bottom: one
content question (which tags are series) and one Phase-2 prerequisite.

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
| `uploaded` (epoch ms) | `createdAt` | date (native) | **Needs conversion:** `new Date(asset.uploaded).toISOString()` — `Date.parse("1771604584246")` is `NaN`, so the raw epoch fails validation. Goes into Payload's *own* `createdAt`: the Postgres adapter defaults it only when a value is not supplied (`@payloadcms/drizzle/upsertRow`), so no second date field is needed. For a migrated archive the upload time is the creation time. |
| `order` | `order` | number, indexed | **The single ordering** (see §2). 575 distinct values across 632 records; one record has none and 58 sit at 0. |
| `kind` | `medium` | select | **Split three ways** — see §4. Medium only: painting, drawing, ceramic, illustration, poster, collage, tattoo. |
| `kind: 'unpublished'` | `_status` | draft/published | Payload's native draft state, via `versions: { drafts: true }`. Zero live records carry it today, but Crow stamps it on every fresh upload. |
| `kind: 'hidden'` | `showOnSite: false` | checkbox | Two live records, both digital illustrations made for an app ("Love (for app)", "Love and Kindness (for app)"). They migrate as `medium: illustration` with the box unchecked. |
| `title` | `title` | text | All 632 have one. |
| `year` | `year` | number | All 632 have one. Range 2015–2026. |
| `material` | `material` + `materials` + `support` | text + two relationships | **Modelled, with the prose kept.** The raw string stays authoritative on every record — the site still parses it, and it makes the modelling fully reversible. Alongside it, the same parser derives relations into a `materials` taxonomy: what the work is made *of*, and what it is made *on*. See §2b. |
| `tags` | `series` + `favorite` | relationship / checkbox | Split by §2. Every tag either names a body of work (→ a series relation) or is the single flag `Favorite` (→ a checkbox). There is no flat-tag field: an unclassified tag **blocks the migration** rather than being carried silently. |

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

## 2b. `materials` — modelling the prose

Crow stores "gouache on paper + digital" as a string. alikro depends on its
structure anyway, re-deriving it on every request with a bespoke parser — which
makes **the parser the schema**. This is the one place the trial asks Payload to
model something Crow could only describe.

`materials` is a collection (`slug`, `name`, optional `broader`), and artworks
carry two relationships into it: **`materials`** (what it is made of) and
**`support`** (what it is made on — the "on paper" half). The raw string stays on
every record and remains authoritative, so this is additive and reversible.

**Seeded from the archive, not hand-listed.** The migration runs the site's own
parser over all 632 records: **30 terms** from 56 distinct descriptions — 27
media, 3 supports (paper, canvas, cardboard).

**One design decision worth stating, because it went against the obvious.** The
site's parser is deliberately *lossy*: it splits "soldate clay" into a discarded
"soldate" plus "clay" so the filter can offer one broad term. Deriving from that
output would have been faithful to the filter — and would have baked the parser's
compromises into the schema, throwing away exactly the distinction a ceramicist
cares about. Because the raw string is retained, filter parity is guaranteed
regardless of the taxonomy's grain, so there was no reason to inherit the
lossiness. The qualifiers are preserved: `soldate clay`, `murietta clay`,
`porcelain clay`, `raku glaze`, `underglaze` all survive as distinct terms.

**What that surfaced.** The archive has a material *hierarchy* the flat string
could never express — six kinds of clay, two of glaze. The migration reports
these as broader/narrower pairs and does **not** merge them; `Materials.broader`
exists for Alina to confirm. It likewise reports `marker ~ markers` as a likely
duplicate rather than merging it, because collapsing two terms is a content
decision and not one a regex should make.

**Blocking guard:** a record whose `material` is non-empty but yields no
components stops the dry run. An artwork silently arriving with no materials is
the kind of hole nobody notices until someone filters for it.

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

### Payload cannot ingest 2 of 632 originals that Crow ingests fine

The archive's two tiffs (`broken_vessel.tiff`, `a_cup.tiff`, both ceramics) fail
the migration outright. **This is not "Payload is weak at tiff."** Payload's
*resize* path — sharp — reads both files without complaint:

```
broken_vessel.tiff: sharp OK -> 1299x1732 tiff
broken_vessel.tiff: image-size FAILED -> Invalid Tiff. Missing tags
```

Payload probes **dimensions** with a different library (`image-size`) than it
**resizes** with (sharp), and the stricter of the two gates the more capable one.
`getImageSize` throws before the resize pipeline is ever reached, and the whole
upload fails. Crow ingests both files precisely because it measures with sharp
(`crow-cms/shared/images.ts`). So this is a concrete capability regression against
the incumbent, with a named cause — not a missing feature.

**It only surfaces on a real archive.** A synthetic tiff, generated by sharp,
passes both libraries — which is exactly how it was missed in pre-flight. That
single example retroactively justifies migrating the full archive rather than a
sample: a sampled trial would very likely have skipped both files.

**Three ways forward, and the two remedies are not free:**

| option | result | cost |
|---|---|---|
| **Leave it (chosen)** | 630 / 632 | two works absent from the site; the finding stands |
| `beforeOperation` hook | 632 / 632 | ~15 lines — collection `beforeOperation` runs at `create.js:35`, before `generateFileData` at line 79, so a hook can convert tiff → PNG in-memory before the probe. **But those two records then hold PNG bytes, not the artist's originals.** |
| Pre-convert in staging | 632 / 632 | same loss of original bytes, no code, and the staging copy diverges from Crow's bucket |

Chosen deliberately: the trial exists to surface where Payload is worse than Crow,
and patching the gap with a hook *we* wrote would delete the datapoint. Note also
that both remedies trade away **"originals kept untouched"** — itself one of the
properties under test. A remedy that violates one criterion to satisfy another
should be visible as such. The hook stays costed but unbuilt, orderable any time.

**Playtest brief — tell Alina before she looks.** Two ceramics are absent from the
Payload site. She has to hear that it is a known finding and not a mistake, or she
will read it as a bug and it will colour her feedback on everything else. Same
discipline as any other confound.

**Eight sizes does not mean eight files — measured across the migrated archive.**
`withoutEnlargement: true` returns the original width for anything smaller, and
Payload names variants by their *actual* output dimensions, so entries collapse
onto one file. Over all 630 migrated records:

| distinct files | records |
|---|---|
| 8 | 335 |
| 7 | 131 |
| 6 | 104 |
| 5 | 49 |
| 4 or fewer | 11 |

**295 of 630 records collapse at least once**, producing 4,501 rendition files
instead of 5,040. Object counts are therefore meaningless as a parity measure —
which is why the spot-check asserts **srcset coverage** instead: every width the
site requests must resolve to a file. It does, for all 630.

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
- **`Favorite` (59) becomes a checkbox.** Crow stored it as a magic string inside a tags array; it is a boolean, and Payload has booleans. With every other tag now a series, the flat-tag field had exactly one possible value left, so it is gone — and a tag that matches neither a series nor the flag is a **blocking** dry-run error. Verified by tampering with the export: an unknown tag fails the dry run rather than reaching the archive pass.
- **alikro's tag vocabulary is reconstructed, not stored — do not "simplify" this.**
  The site's filters and its hardcoded collections still query Crow-style tag
  strings, so the Payload adapter rebuilds them from series relations plus the
  flag (`shared/payloadContent.ts`). The obvious shortcut — keep a `tags` column
  populated with the legacy strings so the consumer just works — would leave the
  database holding a hybrid model: the native relation *and* the Crow-ism it
  replaced, free to drift apart. It would also quietly invalidate the trial,
  because the two content paths would then be comparing **two different data
  models** rather than two presentations of one. The native model lives in the
  data; the legacy shape exists only at the presentation boundary, which is the
  entire reason both paths coexist.
- **`medium` collections are unchanged.** The `paintings` / `drawings` /
  `ceramics` / `illustrations` / `posters` / `collages` pages are medium queries
  and stay that way.

---

### Native-primitive sweep

Run before the archive pass, on the principle behind Anton's gate rulings: prefer
the target system's native primitive over reproducing the legacy shape, and one
mechanism over two. After 632 records exist, a shape decision gets expensive.

| finding | outcome |
|---|---|
| `uploadedAt` duplicated `createdAt` | **Adopted the native one.** Verified in `@payloadcms/drizzle/upsertRow`: a supplied `createdAt` is honoured, defaulted only when absent. Two timestamps would have forced every consumer to choose between them forever. |
| `tags` was vestigial; `Favorite` a boolean as a string | **Replaced with a checkbox**, flat-tag field dropped, unclassified tags now blocking. |
| `order` vs Payload's native fractional ordering | **No change** — already ruled, and one mechanism either way. The deferral is demonstrably safe: converting 632 numbers to fractional keys later is a single ordered pass. |
| `material` is structured data inside a string, parsed at runtime | **Modelled** (Anton, 2026-07-26) — see §2b. Raw string retained, so it is fully reversible. |
| `medium` as a code-defined select | **Kept through the migration** (Anton, 2026-07-26), because it fails loudly on unknown values during a bulk pass; revisit straight after the playtest. The cost is real and is now stated in the field's own admin description: adding a medium needs a code change, where Crow accepted free text. Recorded as a playtest finding either way, along with the taxonomy asymmetry — series and materials are content, but the medium collections are still hardcoded in `shared/collection.ts`. |

Swept and genuinely fine: `slug` (no native equivalent, and carrying Crow's id
verbatim is the point), `showOnSite` (drafts are the wrong primitive — these are
published works deliberately kept out of galleries), `series`, variants,
`_status`, access.

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

## 6. Migration (Phase 2) — built, dry-run, waiting on credentials

`payload/migration/`, driven by npm scripts:

| | |
|---|---|
| `npm run migrate:export` | Crow → neutral JSON (`crow-export.json`). The portability artifact — worth keeping under **every** verdict, FREEZE included. |
| `npm run migrate:validate` | Dry run. No database, no bucket, no staged files needed. |
| `npm run migrate:series` | Series documents only. Idempotent, safe to repeat. |
| `npm run migrate` | Series + the archive. Resumable. |

**Resumability is the database, not the log.** Every run reads existing slugs
first and skips them, so a killed run resumes by being started again. The JSONL
log beside it is a diagnostic, not state. A single unreadable original is logged
and stepped over rather than ending the run — Crow tolerates these
(`failOnError: false`), Payload raises `FileUploadError`, and an overnight job
must not die on record 400 of 632.

**Sequential by default, but not for the reason we thought.** The fractional
index that was allocated without a lock disappeared along with the orderable
join, so parallel creation is no longer *incorrect*. It stays serial because each
document is a download, eight resizes and nine uploads, and a serial log makes
the failure point obvious. `MIGRATION_CONCURRENCY` raises it.

**The export refuses to be stale.** `migrate` rejects an export older than 24h
unless `ALLOW_STALE_EXPORT=true`. This is a direct consequence of §0: a committed
JSON file was trusted as the archive when it was five months and 109 records
behind.

**Dry run, all 632 records, invariants holding:** slugs unique and non-empty,
filenames unique (clean join), every `uploadedAt` parses, every series link
resolves. Distribution: 215 illustration, 100 poster, 90 drawing, 63 collage,
61 painting, 53 tattoo, 50 ceramic; 632 published, 0 draft; 55 `showOnSite=false`
(53 tattoos + the 2 ex-`hidden`); 30 series all receiving members; `Favorite`
(59) the only flat tag. **190 slugs would break if recomputed** rather than
carried.

**Tiffs are fine.** Payload resizes `image/tiff`, and the migration passes a
`filePath` rather than a buffer — which matters, because a tiff cannot be
measured from a buffer at all. Measured on a synthetic 900×1400 tiff: eight sizes
produce **five** distinct files, the four above the original's width collapsing
into one. The predicted collapse, now a measured number.

### The archive run — done, 2026-07-26

**630 of 632 migrated** (the two missing are the tiffs above), 30 series, 30
materials, 5,131 objects in the bucket. Zero missing files; zero failures other
than the two with a named cause, and `failed=2` held constant from the first
checkpoint to the last — scatter, not a cluster, so the abort guard correctly
never fired.

**~58 minutes total at 5.5s/record**, not the overnight job the plan assumed.
Worth correcting in the trial doc: maintenance weight is an evaluation criterion,
and "about an hour" reads very differently from "overnight-class".

**Resumability was proven by accident.** The first leg was killed mid-flight at
~323 records with no completion record. Restarting skipped exactly those and
finished the remaining 309 — no duplicates, no loss, no manual reconciliation.
A property designed against a hypothetical, tested by a real failure.

**Full spot-check clean across all 630:** 1,260 URLs fetched and live, every
requested width resolving, no orientation disagreements, and filename /
`createdAt` / `order` / raw-material cross-checked against the source export.

### The site can already read Payload

`CONTENT_SOURCE=payload` swaps the CMS underneath the whole site
(`shared/payloadContent.ts`, read through the **Local API** — in-process, no
HTTP, no token, no CORS). Unset, the site reads Crow exactly as production does.

Verified locally: with the switch off the site renders as before; with it on it
reaches Payload and fails only on the absent Postgres. That is as far as this
goes without a database.

The image layer moved with it, as §3 predicted. `AssetMetadata` gained an
optional `variants` list; `imageSrc` picks from reported renditions when they
exist and composes Crow-style names when they do not; `AssetImage`'s snapping
loader defers to the CMS's widths rather than guessing at filenames. Both paths
live side by side, which is what makes the playtest an A/B rather than a rewrite.

---

## 7. Recorded for the trial write-up

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
