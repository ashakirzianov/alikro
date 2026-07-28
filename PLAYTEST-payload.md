# Payload playtest — brief for Anton & Alina

The archive is migrated and the site runs on Payload. This is a **comparison, not
a launch**: production alikro.art is untouched and still runs on Crow.

> **Revised 2026-07-28 for Alina's session.** Two things happened after the first
> playtest that made parts of this brief wrong, and a brief that misdescribes what
> she is about to open would poison exactly the feedback we want:
>
> - **The `series` and `materials` collections were built, judged and removed.**
>   Anton and Alina preferred Crow's flat shape. Tasks that said "edit a series"
>   are gone below, because that screen no longer exists.
> - **The admin was re-skinned toward Crow** (`RESKIN-crow-admin.md`). The list
>   view is now a wall of pictures, not rows of text. The old instruction to
>   "react to the lack of images" has been removed — that complaint was heard and
>   acted on, and leaving it in would invite feedback on a fixed problem.

## Read this to Alina before she opens anything

**Two ceramics are missing on purpose — "a cup" and "broken vessel".** They are
the only two TIFF files in the archive, and Payload refuses to ingest them
(it measures image dimensions with a stricter library than the one it resizes
with). This is a **known finding we chose not to paper over**, not a mistake and
not something to report. Everything else — 630 works — is there.

Three other things that are deliberate, so they don't get reported as bugs:

- **"Love (for app)" and "Love and Kindness (for app)" are also gone from the
  site.** These were marked hidden in Crow but leaked onto the site anyway; the
  new model actually honours the flag. They are still in the admin.
- **There is no per-series ordering.** A series page is the global order filtered
  to that series. If Alina wants to sequence works *within* a series, **say so —
  that is a finding about the model**, and we want it written down. It is not a
  defect to fix during the session.
- **There is one junk record**, id **631**, "PLAYTEST upload check (delete me)",
  left as a draft from testing the upload path. Deleting it is a fine first task.

  **⚠️ But do not delete the other drafts, and one of them especially.** Record
  **632**, now titled *"KEEP — draft-leak guard fixture (do not delete)"*, is the
  only record in the whole archive that can express the draft-leak failure — every
  one of the 630 migrated works is published. Delete it and `migrate:spotcheck`'s
  draft guard stops testing anything (it prints `NOT EXERCISED` rather than lying,
  but the protection is gone). It had **no title at all** until 2026-07-28, which
  made it look exactly like a stray screenshot to tidy away — sitting right next
  to one that says "delete me". The other seven drafts (633–639) are the
  agent-operability probes and are also evidence, not litter.

  `npx tsx payload/tools/list-drafts.mts` prints all of them with the titles the
  admin shows, and flags the load-bearing one.

## Starting it

```
cd ~/repos/alikro-art          # branch: payload-trial
CONTENT_SOURCE=payload npm run dev
```

Site → <http://localhost:5733> · Admin → <http://localhost:5733/admin>
Logins are in `PLAYTEST-CREDENTIALS.local.md` (gitignored, next to this file).

**To see the A/B**, restart without the flag — plain `npm run dev` — and the same
URLs render from Crow exactly as production does. That is the only difference
between the two runs.

## What we actually want from Alina

Her judgement on the **admin UX for image-heavy work** is criterion 1 of the whole
trial, and she is the only person who can give it. Three tasks, in this order:

1. **Upload and catalogue a new piece.** Artworks → Create New. Watch how it feels
   to add title, year, material, medium and tags to a picture she has just
   dropped in. Does it fight her? Is anything asked twice?
2. **Find things in the archive.** The red filter row across the top of the
   artworks list is Crow's — `all, painting, drawing, ceramic, …` plus `drafts`
   and `hidden`. Does she get to a given work faster or slower than in Crow?
   **It lists mediums but not tags** — tags are free text and unbounded, so a tag
   row would need its own fetch. Does she miss them?
3. **Reorder a gallery.** Ordering is a number typed on each artwork. Would drag
   to reorder be better? (Payload can do it; we deliberately did not turn it on.)
4. **Judge the re-skin.** Anton has already ruled it close enough to Crow to be a
   fair comparison. Alina's question is different and is the one that matters:
   *does it work for her?* Especially the edit view — Title / Year / Material /
   Medium / Tags in the main column, Slug / Show On Site / Order in the sidebar.
   Is anything in the wrong place?

Prompts worth asking her out loud: *Could you catalogue fifty new works in this?
What did you look for and not find? What is worse than Crow?*

## What to ignore

- **Speed.** This is a dev server on a laptop talking to a free database in
  another country. Nothing here says anything about production performance.
- **The medium list is fixed** (painting, drawing, ceramic, illustration, poster,
  collage, tattoo). Adding one currently needs a code change — that is a known
  tradeoff we are revisiting after the playtest, not a bug. Worth noting if it
  annoys her.
- **Payload's own chrome above the filter row** — the "Artworks" heading, Create
  New / Bulk Upload, search, Columns, Filters. Crow has one line where this has
  three. Removing it means replacing Payload's list view outright, which is a
  much bigger commitment. Worth a reaction, not worth designing around.
- Console warnings about a missing email adapter. Mail is not configured.

## Verified working before you sat down

630 migrated artworks (639 records including the nine drafts) · flat `tags`, no
`series`/`materials` collections · 5,131 files in the trial bucket. Galleries,
tag pages, materials, years and artwork pages all render from Payload; images
come from the trial bucket at the right widths. Uploading a real original
produces all its web sizes and lands in the bucket. With the flag off, the site
still renders from Crow — the two paths differ by exactly the four records named
above and nothing else.

Re-checked on 2026-07-28, after the re-skin: `migrate:spotcheck` clean, the site
layer returns 575 assets, and the draft-leak guard was **made to fire and then
restored** — it is protecting, not merely passing. `next build` green.

## Where findings go

`design-payload-field-mapping.md` in this repo holds the live findings and open
questions; `RESKIN-crow-admin.md` holds the ones about the admin's look.

**Two questions that were waiting on Alina are now differently shaped**, and
saying so is better than dropping them: whether the six clays and two glazes
should nest under broader terms, and whether `marker` and `markers` are one term
or two. Both assumed the `Materials` collection that was since removed, so
neither can be answered "in the admin" any more. The underlying questions still
matter — they are about her vocabulary, not about Payload — so ask them out loud
if the subject comes up, and record the answers as findings about the *model*.

**No verdict during the session.** Collect reactions; Anton decides afterwards.
