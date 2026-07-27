# Spike: making the Payload admin image-native

**2026-07-27, after the playtest.** Anton and Alina judged the admin a downgrade —
"boring", "not image-native", artworks as rows of titles. They were judging
Payload's stock defaults, which no real deployment would ship. This spike builds
the fair version so it can be re-judged.

**Deliverable: a judgeable artifact plus an honest cost.** Not a finished admin.

![the artworks list, image-native](./spike-admin-grid.png)

![filtered to ceramics](./spike-admin-grid-ceramics.png)

Both captured from the running admin at 1400×1000, all images loaded before
capture. Second shot is `medium = ceramic` — 48 works, matching the site.

---

## What was tried, cheapest first

### 1. `folders: true` — one line, and not the answer

It does work, in the narrow sense: the folder view renders real thumbnail cards
(verified — a filed artwork drew its picture at 260×260). But:

- **The folder view shows only folders.** Unfiled artworks do not appear at all,
  so out of the box it is an empty screen. Making it useful means filing all 630
  works into folders by hand.
- **It is a second organisational axis that duplicates `series`.** We already
  modelled bodies of work; folders would be a parallel, unrelated hierarchy with
  no connection to what the site renders.
- **Drafts do not appear in it.** Draft/publish was the one thing the playtest
  liked, and it is invisible in the only image-native view Payload ships.

Kept enabled — it costs nothing and the "By Folder" toggle is visible in the
screenshots — but it does not answer the complaint.

### 2. A gallery grid on the list view — this is the artifact

`payload/components/ArtworkGrid.tsx`, mounted as `beforeListTable`.

The important choice: **it does not replace the list view.** `useListQuery()`
hands back the documents the default list has *already* fetched, so search,
filters, sorting, pagination, the Columns and Filters controls, and the result
counter all keep working with **no query code of ours**. The component only
decides how rows are drawn.

Verified through the real admin, not by reading the code:

| | result |
|---|---|
| baseline | `1-12 of 632`, 12 cards |
| search "vietnam" | `1-1 of 1` → *Vietnamese woman drawing* |
| filter `medium=ceramic` | `1-12 of 48` — the site shows 48 ceramics too |
| pagination, page 3 | `25-36 of 632` |
| sort `-year` | applies |

Cards carry the thumbnail (from `sizes.w480`, the same bucket the site reads),
title, medium · year, and badges for **draft** and **hidden** — so the feature
the playtest liked is visible at a glance, which it is not in the folder view.

---

## The cost — the actual finding

| what | lines (code, excl. comments) |
|---|---|
| `payload/components/ArtworkGrid.tsx` | **61** |
| `app/(payload)/custom.scss` | **75** |
| wiring in `Artworks.ts` (`beforeListTable` + `folders`) | **4** |
| **total custom code** | **~140** |

**Do not round that down.** 140 lines is small, but the number alone understates
it in three ways:

1. **It leans on a Payload-owned class name.** `beforeListTable` can only add a
   component *above* the table; there is no supported way to replace the table
   from that slot. Hiding it uses the `.collection-list--artworks .table`
   selector — exactly the kind of internal that a project shipping near-weekly
   renames without it being a breaking change. When it breaks, the symptom is a
   gallery with a redundant 630-row table underneath, not an error.
2. **It is presentation we now own forever.** Card layout, badges, truncation,
   empty states, responsive breakpoints — none of this is Payload's to maintain.
   Every upgrade is a re-test.
3. **This is the cheap version.** It inherits the query layer. Anything the
   default list cannot express — drag-to-reorder in the grid, hover previews,
   bulk actions on cards, a lightbox — starts from a custom list view instead,
   which is where the reimplementation the charge warned about actually begins.

**What that points at.** ~140 lines buys a good-looking gallery today. But the
thing being maintained is a bespoke image-native admin, written in React, living
against someone else's weekly release train. That is approximately a description
of Crow. The criterion-5 question is therefore not "can Payload be made
image-native" — it demonstrably can, cheaply — but **whether owning that layer on
top of Payload is meaningfully lighter than owning Crow.**

That is Anton's call, and this spike exists to make it with a number rather than
an impression.

---

## Two bugs fixed while in here

**The site's edit button pointed at the wrong CMS.** `hrefForConsole` always
built a `NEXT_PUBLIC_CROW_CMS` URL, so under `CONTENT_SOURCE=payload` the edit
link sent you to Crow's console — to a record that CMS was not serving. Now the
record carries `cmsEditPath` and `hrefForEdit` follows it. Verified both ways:

```
CROW mode     -> https://crowcms.vercel.app/projects/alikro?aside=edit:anton-with-the-vessel
PAYLOAD mode  -> /admin/collections/artworks/98        (= anton-with-the-vessel)
```

The path is carried **on the record** rather than read from a client-visible copy
of the flag, because `CONTENT_SOURCE` is server-only — a `NEXT_PUBLIC_` twin
would give the A/B two switches that can disagree.

**Drafts were publicly visible on the site.** `fetchAllAssetMetadataFromPayload`
filtered `showOnSite` but never `_status`. The collection's `access.read` does
scope anonymous reads to published — but the site reads through the **Local API,
which bypasses access control entirely**, so that predicate never ran for us.

This could not surface during preparation: all 630 migrated records are
published, and the test draft had `showOnSite: false`. It appeared the moment a
real person made a draft in the admin during the playtest — that draft was
live on the site. Fixed; `/all` is back to 575 and byte-identical to the
pre-playtest baseline.

**It is worth naming what this one means for the trial.** Draft/publish was the
single feature the playtest rated a win, and in the consumer it was broken. The
win is real, but it was not actually being exercised end-to-end until now.

---

## State

- Two junk records remain, both drafts, both invisible to the site: id 631
  (mine, "PLAYTEST upload check") and id 632 (a screenshot uploaded during the
  playtest). Neither deleted — that is theirs to do.
- An empty folder, "SPIKE probe (folder-view test)", left from testing option 1.
  The real artwork filed into it was put back; only my own test draft is still in
  it. Mine to remove on request.
- Anton changed his admin password during the playtest, so
  `PLAYTEST-CREDENTIALS.local.md` is stale for his account. Alina's still works.
