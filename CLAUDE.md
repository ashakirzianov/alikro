# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`alikro` is a Next.js art portfolio site for the artist "alikro". It reads asset metadata and images from the separate `crow-cms` project via its HTTP API (see `shared/cms.ts`). The CMS base URL is configured via `NEXT_PUBLIC_CROW_CMS` and an auth secret via `CROW_CMS_SECRET_KEY`.

The project is small, so the workflow here is lighter than in the more structured repos: dedicated `docs/` and `tasks/` folders aren't required, but they (or ad-hoc top-level `.md` files) are fine when they actually help.

## Collaboration Workflow

### Documentation Organization
- `CLAUDE.md` — conventions and guidance for Claude Code (this file).
- `IDEAS.md` — medium to long-term ideas.
- `SCRATCHPAD.md` — untracked scratch space for drafting prompts and half-formed ideas. Do not act on its contents unless explicitly asked.
- No `docs/` or `tasks/` folder is set up by default — most work is driven directly from prompts and doesn't need a persistent artifact. If a design doc or task list becomes genuinely useful, it's fine to add one: prefer a top-level `.md` (e.g. `tasks-<topic>.md`, `design-<topic>.md`) until there are enough to justify a folder.

### Task Management
- Work is usually driven through direct prompts.
- Persistent task `.md` files aren't required, but they're welcome when an effort is large enough that tracking it across sessions helps. When one exists, treat its tasks as pre-approved unless stated otherwise.

### Planning & Scope
- For small, well-scoped changes, just do it — no upfront planning needed unless requested.
- For larger or more complex features, design first: sketch the approach, lay out options with tradeoffs, and agree on direction before implementing. When the feature is substantial enough to benefit from a written record, a short top-level design `.md` is a good place for it.
- Ask about ambiguity rather than guessing.
- For non-trivial design decisions (type restructuring, naming, API shape), engage in discussion before implementing. Present concrete options with tradeoffs and a recommendation, but let the user choose.

### Code Changes
- Small incremental commits.
- The user makes all commits — do NOT commit unless explicitly asked.
- Propose a commit message after each change.
- Only add tests when explicitly asked.
- Always run `npm run build` after completing a change. Fix any errors before presenting the summary. Don't present work as done without a passing build.

### Communication Style
- Explanatory — include reasoning behind choices.
- Proactively suggest improvements noticed along the way, and mention them in conversation.

### Review & Iteration
- Present approach before executing (for direct prompts), unless told otherwise.
- Iterate on feedback immediately.

### Conventions & Documentation
- When a new convention emerges from discussion (naming rules, architectural patterns), add it to `CLAUDE.md` immediately.
- `CLAUDE.md` should be the authoritative source of truth for conventions — future conversations should be able to derive them from this file alone.

## Development Commands

- `npm run dev` — Start development server
- `npm run build` — Build for production
- `npm run start` — Start production server
- `npm run lint` — Run ESLint

### ⚠️ If `npm run build` fails and Anton's build is fine — check the environment first

**Agent shells inherit `NODE_ENV=development`.** Run this *before* investigating a
red build:

```
env | grep -iE '^(NODE_ENV|NEXT_|VITE_)'
```

If `NODE_ENV=development` is set, pin it at the invocation and re-run:

```
NODE_ENV=production npm run build
```

`NODE_ENV=development` **breaks `next build`**: development React resolves against
production chunks, the hook dispatcher is null, and every client page fails to
prerender. The symptom names a page, not the cause:

```
Error occurred prerendering page "/_global-error"
TypeError: Cannot read properties of null (reading 'useContext')
```

Verified in this repo on 2026-07-28, both directions: plain `npx next build`
exits **1** under the inherited environment and **0** under
`NODE_ENV=production`. Independent of Next/React/Node version (seen across next
16.1.6–16.2.12, react 19.0–19.2, Node 22–25).

**Name the class, because it costs whole sessions:** a build failure Anton cannot
reproduce is a **false red**, and the environment is the first suspect — not the
last. This one was already written up in the tooling's own notes and *still* cost
another track a session three days later, because it was filed where the cause
lives rather than where the symptom appears. It is in this file for that reason.

Two corollaries worth knowing:

- **A workaround that makes a false red go green is worse than the red.** This
  repo spent days believing `next build` was pre-existing-broken and that
  `--debug-prerender` was the fix. It was not a fix; it happened to mask the
  environment bug, which made a false red look like a characterised defect.
- **`npx eslint .` really does crash on its config**, under both environments.
  That one is genuinely pre-existing and is not this.

## Coding preferences

### General
- Prefer `function name(...) { ... }` style to `const name = (...) => { ... }` style.
- Always put private (non-exported) functions at the bottom of the file, after all exports.

### Types
- Inline prop/parameter types unless the type is referenced from other places. Extract a named type only when it's used in multiple locations.

### Nullability
- Prefer `undefined` over `null` for absent values in app/shared code. Convert at boundaries where an external source (CMS API, etc.) returns `null`.

### Naming
- Use `isLoading` (not `loading`) for boolean loading state.

## CSS and Styling

- Tailwind v4 with PostCSS. Only use colors defined in `app/globals.css` (e.g. `--color-primary`). They work as Tailwind classes (e.g. `text-dimmed`). If a new color is needed, define it in `globals.css` and then use it.

## Architecture Overview

- **Framework**: Next.js 16 App Router, React 19, Tailwind v4.
- **Content source**: All asset metadata comes from `crow-cms` via `shared/cms.ts`. Images are served by the CMS (S3-backed) and rendered through `app/AssetImage.tsx`.
- **Storage helpers**: `@upstash/redis` and `@aws-sdk/client-s3` are present for any direct access that bypasses the CMS when needed.
- **Route groups**:
  - `app/(detailed)/` — the main gallery experience with filtering, navigation, and an expanded work modal.
  - `app/(slideshow)/` — slideshow/grid presentation.
  - `app/api/` — `og` (OpenGraph image generation) and `revalidate` (cache revalidation hook called by the CMS when content changes).
- **Shared logic**: `shared/` holds the CMS client, asset/tag/collection types, metadata helpers, query parsing, and small utilities. Frontend code should read from `shared/` rather than reimplementing fetches.

## Environment

Required env vars (see `shared/cms.ts`):
- `NEXT_PUBLIC_CROW_CMS` — base URL of the `crow-cms` instance.
- `CROW_CMS_SECRET_KEY` — bearer token for authenticated CMS requests.

## Related projects

- `../crow-cms` — the CMS backend that serves this site's content. All asset metadata and images flow from there through `shared/cms.ts`. The CMS also calls this repo's `/api/revalidate/[tag]` endpoint when content changes, so when touching that endpoint or the CMS client, check `../crow-cms/CLAUDE.md` and coordinate.
