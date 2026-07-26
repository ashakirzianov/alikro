import type { CollectionConfig } from 'payload'

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

// Crow's `kind` carried three unrelated things at once: medium, publication
// state (`unpublished`, `hidden`), and a category the site filtered out in code
// (`tattoo`). Split per Anton: this is medium only. `unpublished` becomes
// Payload's native draft state, `hidden` is dropped, and the tattoo exclusion
// becomes the explicit `showOnSite` field below.
const MEDIUMS = [
    'painting',
    'drawing',
    'ceramic',
    'illustration',
    'poster',
    'collage',
    'tattoo',
]

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
    admin: {
        useAsTitle: 'title',
        defaultColumns: ['title', 'kind', 'year', 'order'],
        description: 'One record per artwork — the image and its catalogue data.',
    },
    upload: {
        staticDir: 'media',
        mimeTypes: ['image/*'],
        adminThumbnail: 'w480',
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
                description: 'Public URL segment — leave empty to derive it from the file name. Migrated artworks carry Crow\'s asset id verbatim so existing links keep working.',
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
            name: 'material',
            type: 'text',
            admin: {
                description: 'Free text, matching Crow — e.g. "acrylic on paper", "clay, underglaze". alikro parses it for the material filter.',
            },
        },
        {
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
                description: 'Uncheck to keep a published work out of the public galleries. Migration unchecks it for tattoos, matching what the site does today.',
            },
        },
        {
            name: 'tags',
            type: 'text',
            hasMany: true,
            index: true,
            admin: {
                description: 'Flat labels that are not series — currently `favorite` and `secondary`.',
            },
        },
        {
            name: 'order',
            type: 'number',
            index: true,
            admin: {
                description: 'Sort position across the whole archive, ascending. The single ordering — series pages sort by it too, exactly as they do today.',
            },
        },
        {
            name: 'uploadedAt',
            type: 'date',
            admin: {
                description: 'Crow\'s `uploaded` timestamp, preserved so the existing tie-break sort (order, then newest first) survives the migration.',
            },
        },
        {
            name: 'series',
            type: 'relationship',
            relationTo: 'series',
            hasMany: true,
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
