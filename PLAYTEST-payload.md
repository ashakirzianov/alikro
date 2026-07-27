# Payload playtest — brief for Anton & Alina

The archive is migrated and the site runs on Payload. This is a **comparison, not
a launch**: production alikro.art is untouched and still runs on Crow.

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
- **There is one junk record**, "PLAYTEST upload check (delete me)", left as a
  draft from testing the upload path. Deleting it is a fine first task.

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
   to add title, year, material, medium and series to a picture she has just
   dropped in. Does it fight her? Is anything asked twice?
2. **Edit a series.** Series → e.g. *Vietnam*. Description, cover, whether it shows
   in the nav. Note that a work's membership is set **on the work**, not here —
   does that feel right or backwards?
3. **Reorder a gallery.** Ordering is a number typed on each artwork. Would drag
   to reorder be better? (Payload can do it; we deliberately did not turn it on.)

Prompts worth asking her out loud: *Could you catalogue fifty new works in this?
What did you look for and not find? What is worse than Crow?*

## What to ignore

- **Speed.** This is a dev server on a laptop talking to a free database in
  another country. Nothing here says anything about production performance.
- **The medium list is fixed** (painting, drawing, ceramic, illustration, poster,
  collage, tattoo). Adding one currently needs a code change — that is a known
  tradeoff we are revisiting after the playtest, not a bug. Worth noting if it
  annoys her.
- **The artwork list shows no pictures**, only rows of text — Payload's table view
  has no image column. The "Columns" button lets you change which fields show.
  React to it, don't work around it.
- Console warnings about a missing email adapter. Mail is not configured.

## Verified working before you sat down

630 artworks · 30 series · 30 materials · 5,131 files in the trial bucket.
Galleries, series pages, materials, years and artwork pages all render from
Payload; images come from the trial bucket at the right widths. Uploading a real
original produces all its web sizes and lands in the bucket. With the flag off,
the site still renders from Crow — the two paths differ by exactly the four
records named above and nothing else.

## Where findings go

`design-payload-field-mapping.md` in this repo holds the live findings and open
questions. Two questions are already waiting on Alina: whether the six clays and
two glazes should nest under broader terms, and whether `marker` and `markers`
are one term or two.

**No verdict during the session.** Collect reactions; Anton decides afterwards.
