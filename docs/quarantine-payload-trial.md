# Quarantine — unsorted Payload trial residue

**Not reference material.** `CLOSURE-payload-trial.md` is the real artifact and
already holds the verdict, the lessons and the revival path. This file is what
was in one agent's head and in no file: unverified assumptions, latent defects it
shipped, and speculation it deliberately kept out of CLOSURE because CLOSURE was
written to stay true even if the verdict reverses. **Expect most of this to be
deleted.**

---

## 1. Things I shipped that are weaker than they look

These are mine, they are in the branch now, and nobody else knows.

- **Three hardcoded `#fff` in `custom.scss`** (lines ~135, ~194, ~224 — filter
  highlight, badge, dashboard link hover). They should be theme variables. This is
  invisible **only because I set `admin.theme: 'light'`.** Anyone who sets it back
  to `'all'` gets white-on-light in dark mode. I disabled the mode that would have
  shown me the bug, in the same session I introduced it.
- **The Inter webfont loads by luck of bundling order.** The `@import url(...)` in
  `custom.scss` works because it landed at byte 0 of the emitted stylesheet. A CSS
  `@import` anywhere else is dropped by the parser. I *verified* that position —
  and then reported it as "Inter is actually fetched", which was true that day and
  is not a property anyone maintains. Add one stylesheet ahead of `custom.scss`
  and the font silently stops loading with no error. **Self-host via `next/font`
  in the payload layout instead**, and accept editing the file Payload marks as
  generated.
- **The filter row's active-state detection is `JSON.stringify` equality**
  (`ArtworkGrid.tsx:51`) against `query.where`. Key order matters. I proved the
  URL round-trip for one filter; I never checked whether building the *same* query
  through Payload's own Filters control highlights my row. It probably doesn't.
  Cosmetic, but it is an assumption dressed as a verified behaviour.

## 2. Assumptions I never verified

- **Only ever looked at 1400px wide.** Every screenshot, every judgement. My
  `--gutter-h` and `--base-px` overrides are unlayered, so they beat Payload's
  `mid-break`/`small-break` media queries at *all* widths — mobile and tablet get
  desktop spacing. I wrote that mechanism into a comment and never opened a narrow
  viewport. If Alina ever used an iPad, nobody has seen what she saw.
- **Never tested the grid beyond 24 records on screen.** The spike flagged this as
  untested; I inherited the flag and did not close it either.
- **Never watched a tier-D selector actually break.** The whole
  fragile-surface argument is sound but *predicted*. I never pinned an older
  Payload, or a newer one, to see one of the three go stale. That would have made
  the criterion-5 case evidential rather than structural, and it was affordable.
- **Never ran `npm outdated`** to see how far 3.86.0 had already drifted. The
  "near-weekly releases" claim is from the docs, not measured here.

## 3. Method findings — worth more than the Payload specifics

- **Read `node_modules/payload/dist/config/sanitize.js` before the docs.** Twenty
  minutes there answered more than the documentation did: it is where defaults are
  injected into your own config object at boot (it literally `push`es the stock
  `collections` dashboard widget into your `widgets` array), and where you learn
  that saved user preferences win over `defaultLayout`. For any config-driven
  product, **the sanitize/normalise step is the real specification.**
- **Payload wraps its CSS in `@layer payload-default` / `@layer payload`.** Any
  *unlayered* custom CSS beats all of it regardless of specificity — no
  `!important`, no specificity wars. Genuinely pleasant, and worth checking for in
  any vendor stylesheet before fighting it.
- **The one question that decides whether custom admin views are cheap:** does the
  list view expose its query state as a React context? Payload's `useListQuery()`
  returns both the already-fetched docs *and* `refineListData` — the same entry
  point its own Filters control uses. That single fact is why 88 lines bought
  working search, sort, filter and pagination. Ask it first when evaluating any
  headless CMS; it separates "custom presentation" from "reimplement the list".

## 4. What I would do differently

- **Classify the tiers before writing the CSS, not after.** I wrote the stylesheet
  and then sorted it into tiers. Sorting first would have surfaced the headline
  finding — that colour is not reachable through variables — on the first day
  instead of at the write-up.
- **Take one screenshot before touching anything.** I never captured the stock
  admin myself and leaned on the spike's. A before/after pair at the same viewport
  is the artifact a human actually judges, and it costs one command.

## 5. Speculation — deliberately kept out of CLOSURE

One trial, so none of this is supportable. Recorded because it is what I actually
came to think.

- **The tier-D:tier-A ratio is probably a proxy for how opinionated a product's
  design system is.** A CMS with real brand tokens — not just neutral elevation —
  would have made this 12 lines and zero vendor selectors. Payload's admin is
  designed to look like Payload.
- **A guess about why:** the admin is deliberately neutral so it does not compete
  with the customer's own product. That reads as a reasonable intent and would
  explain the missing accent variable, but it is a guess about someone's
  motivation and does not belong anywhere load-bearing.
- **The crossover from "customising a CMS" to "owning a CMS" is probably not a
  line count at all — it is the third vendor-internal hook.** By the time you need
  three, you have a private fork held together by CSS selectors. That is the
  strong form of the 1 → 3 finding, and it is a hunch from a single afternoon.
