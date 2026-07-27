import type { CollectionConfig } from 'payload'

import { MEDIUMS } from './mediums'

// Crow generates the eight eager webp variants listed here (see
// ../../../crow-cms/shared/variants.ts) and alikro's <AssetImage> loader snaps
// every srcset request to one of them. Keeping the same widths is what makes a
// media-parity comparison possible.
const VARIANT_WIDTHS = [320, 480, 640, 768, 960, 1200, 1600, 1920]

// Crow's webp settings, copied verbatim from crow-cms/shared/images.ts so the
// output is comparable byte-for-byte rather than "webp, roughly".
const WEBP_OPTIONS = {
    quality: 80,
    effort: 5,
    smartSubsample: true,
}

// Crow's `uploaded` timestamp maps onto Payload's own `createdAt`, which the
// Postgres adapter only defaults when a value is not supplied — so there is no
// second date field here. For a migrated archive the upload time *is* the
// creation time.
//
// `MEDIUMS` now lives in ./mediums so the admin's client-side grid can build
// Crow's filter row from the same list. `unpublished` becomes Payload's native
// draft state, `hidden` is dropped, and the tattoo exclusion becomes the
// explicit `showOnSite` field below.

export const Artworks: CollectionConfig = {
    slug: 'artworks',
    access: {
        // Payload's default for an undefined `read` is "any authenticated user",
        // so public read has to be explicit. Scoped to published, though: Crow's
        // metadata endpoint is bearer-gated, and an unscoped `() => true` would
        // serve drafts over REST and GraphQL. Signed-in editors see everything,
        // and the embedded site reads through the Local API, which bypasses
        // access control entirely.
        read: ({ req }) => req.user ? true : { _status: { equals: 'published' } },
    },
    // Replaces Crow's `unpublished` kind. Crow marks every fresh upload
    // unpublished; here an unfinished record is simply a draft, which is the
    // primitive Payload actually has and Crow does not.
    versions: {
        drafts: true,
    },
    // Spike (2026-07-27): the playtest judged the stock admin "not image-native".
    // This is the cheapest thing that puts pictures on screen — Payload's folder
    // browser renders thumbnail cards rather than table rows.
    folders: true,
    admin: {
        useAsTitle: 'title',
        defaultColumns: ['title', 'medium', 'year', 'order'],
        // No `description`: Crow's console carries no explanatory chrome, and the
        // sentence that was here restated the collection name.
        components: {
            // Draws the list as Crow's filter row plus a gallery, instead of rows
            // of titles. Mounted as `beforeListTable` rather than replacing the
            // list view, so the whole query layer — search, filters, sort,
            // pagination — keeps working with no code of ours. See the component
            // for the cost note.
            beforeListTable: ['/payload/components/ArtworkGrid#ArtworkGrid'],
        },
    },
    upload: {
        staticDir: 'media',
        mimeTypes: ['image/*'],
        // Naming a size here (`adminThumbnail: 'w480'`) builds the URL as
        // `/api/artworks/file/<name>` — Payload's own serving route, which
        // `disablePayloadAccessControl: true` removes. Every thumbnail in the
        // admin then 500s and renders as a grey file icon. Reading the URL off
        // `sizes` instead points at the bucket, the same place the site reads
        // from. Recorded as a trial finding: the two settings interact and
        // nothing warns you.
        adminThumbnail: ({ doc }) =>
            (doc as { sizes?: { w480?: { url?: string } } }).sizes?.w480?.url ?? null,
        // Both off for now: Crow has no equivalent, and enabling them would add a
        // per-asset editing step to the migration that nothing consumes yet.
        crop: false,
        focalPoint: false,
        // No top-level `formatOptions`: that would rewrite the stored original as
        // webp. Crow keeps originals untouched under `alikro/originals/` and only
        // converts variants, and for an art archive the original bytes are the
        // thing worth keeping.
        imageSizes: VARIANT_WIDTHS.map(width => ({
            name: `w${width}`,
            width,
            // Crow resizes with `withoutEnlargement: true`. In Payload the same
            // flag also decides what happens to images smaller than the size:
            // `true` returns the original rather than `null` (the default).
            withoutEnlargement: true,
            formatOptions: {
                format: 'webp' as const,
                options: WEBP_OPTIONS,
            },
        })),
    },
    hooks: {
        beforeChange: [reconcileOrientation],
    },
    fields: [
        {
            // Not `required`: the admin validates required fields in the browser
            // before it POSTs, so requiring it would make every upload demand a
            // hand-typed slug and the derivation hook below would never run.
            name: 'slug',
            type: 'text',
            unique: true,
            index: true,
            admin: {
                // Sidebar, not the main column: this is plumbing that derives
                // itself, and Crow's editor never showed it. Migrated artworks
                // carry Crow's asset id verbatim so existing links keep working.
                position: 'sidebar',
                description: 'Leave empty to derive from the file name.',
            },
            hooks: {
                beforeValidate: [slugFromFilename],
            },
        },
        {
            name: 'title',
            type: 'text',
            index: true,
        },
        {
            name: 'year',
            type: 'number',
            min: 1900,
            max: 2200,
            index: true,
        },
        {
            // Free text, exactly as Crow stored it. The `materials`/`support`
            // taxonomy derived from this string was built, shown to Alina, and
            // rejected (2026-07-27) — see design-payload-field-mapping.md §2b.
            // Keeping the prose verbatim through the modelling step is what made
            // that reversal a script rather than a re-migration.
            name: 'material',
            type: 'text',
            admin: {
                description: 'e.g. "acrylic on paper".',
            },
        },
        {
            // A code-defined select is stricter than Crow's free text: adding a
            // medium needs a deploy. Kept for the migration because it fails
            // loudly on an unknown value during a bulk pass; revisit after the
            // playtest, when the editor-autonomy cost has actually been felt.
            //
            // The description that said so has been moved into this comment: it
            // was a note to ourselves about the trial, rendered where the artist
            // edits her catalogue.
            name: 'medium',
            type: 'select',
            options: MEDIUMS,
            index: true,
        },
        {
            // Replaces the hardcoded `kind !== 'tattoo'` filter in
            // shared/preprocess.ts: the same exclusion, but visible and editable
            // instead of buried in the consumer's code.
            name: 'showOnSite',
            type: 'checkbox',
            defaultValue: true,
            index: true,
            admin: {
                // Sidebar with the other publication state, so the main column is
                // just the catalogue card Crow showed.
                position: 'sidebar',
                description: 'Uncheck to keep a published work out of the public galleries.',
            },
        },
        {
            name: 'order',
            type: 'number',
            index: true,
            admin: {
                position: 'sidebar',
                description: 'Sort position across the whole archive, ascending.',
            },
        },
        {
            // Back to Crow's flat vocabulary. This replaced a `series`
            // relationship and a `favorite` checkbox, both dropped 2026-07-27
            // after Anton and Alina judged the modelled shape and preferred this
            // one — "I have opened both, but didn't edit it."
            //
            // The cost is recorded rather than hidden: `Favorite` is a boolean
            // wearing a string costume, and folding it back in here deletes the
            // one place the split was genuinely better than Crow. That is the
            // price of parity with the incumbent, knowingly paid.
            name: 'tags',
            type: 'text',
            hasMany: true,
            index: true,
            admin: {
                description: '"Favorite" is one of these rather than its own field.',
            },
        },
    ],
}

// Payload measures the main file with the `image-size` package, which reads
// header dimensions and ignores EXIF orientation, while the webp variants come
// out of sharp with `.rotate()` applied. For an EXIF-rotated JPEG the two
// disagree — and alikro feeds the top-level pair straight into `<Image width
// height>` and its tile aspect ratios, so a portrait photo would lay out
// landscape. Crow measured with `sharp().rotate().metadata()`, so this restores
// parity by trusting the variant's orientation.
function reconcileOrientation({ data }: { data: Record<string, unknown> }) {
    const { width, height, sizes } = data
    if (typeof width !== 'number' || typeof height !== 'number' || width === height) {
        return data
    }
    if (!sizes || typeof sizes !== 'object') {
        return data
    }
    const variant = Object.values(sizes as Record<string, unknown>).find(size =>
        typeof size === 'object' && size !== null
        && typeof (size as { width?: unknown }).width === 'number'
        && typeof (size as { height?: unknown }).height === 'number'
    ) as { width: number, height: number } | undefined
    if (!variant || variant.width === variant.height) {
        return data
    }
    if ((width > height) === (variant.width > variant.height)) {
        return data
    }
    return { ...data, width: height, height: width }
}

// Crow derives an asset id from the file name (crow-cms/shared/assets.ts
// `generateAssetId`); reproducing it here means an artwork uploaded through
// Payload lands on the same slug it would have had in Crow.
function slugFromFilename({ value, data }: { value?: unknown, data?: Record<string, unknown> }) {
    if (typeof value === 'string' && value.length > 0) {
        return value
    }
    const filename = data?.filename
    if (typeof filename !== 'string') {
        return value
    }
    const lastDot = filename.lastIndexOf('.')
    const base = lastDot === -1 ? filename : filename.slice(0, lastDot)
    return base.toLowerCase().replace(/[^a-zA-Z0-9]/g, '-')
}
