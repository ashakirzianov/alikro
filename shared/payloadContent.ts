// Reads content from the embedded Payload instance through the Local API — an
// in-process function call, no HTTP, no bearer token, no CORS. That is the
// structural difference the trial is testing, and it is why Payload had to be
// installed *into* this app rather than beside it.
//
// Server-only: it pulls in the Payload config and a Postgres connection. Import
// it from shared/metadataStore.ts and nowhere else.
//
// Selected with CONTENT_SOURCE=payload. Unset, the site reads Crow exactly as
// production does.

import { AssetMetadata, AssetVariant } from './asset'
import { FAVORITE_TAG, tagForSeriesSlug } from '../payload/migration/series'

export function isPayloadContentSource() {
    return process.env.CONTENT_SOURCE === 'payload'
}

export async function fetchAllAssetMetadataFromPayload(): Promise<AssetMetadata[]> {
    const payload = await getPayloadInstance()
    const result = await payload.find({
        collection: 'artworks',
        depth: 1,
        limit: 0,
        pagination: false,
        // The site shows published work that is meant to be shown. Replaces
        // Crow's `kind !== 'unpublished'` filter and the hardcoded tattoo
        // exclusion in shared/preprocess.ts.
        where: { showOnSite: { equals: true } },
    })
    return result.docs.filter(hasSlug).map(toAssetMetadata)
}

export async function fetchAssetMetadataFromPayload(id: string): Promise<AssetMetadata | undefined> {
    const payload = await getPayloadInstance()
    const result = await payload.find({
        collection: 'artworks',
        depth: 1,
        limit: 1,
        where: { slug: { equals: id } },
    })
    const doc = result.docs[0]
    return doc && hasSlug(doc) ? toAssetMetadata(doc) : undefined
}

// `slug` is optional in the schema so the admin can derive it on upload, which
// means a document can in principle exist without one. Such a record has no
// public URL, so the site simply does not show it.
function hasSlug<T extends { slug?: string | null }>(doc: T): doc is T & { slug: string } {
    return typeof doc.slug === 'string' && doc.slug.length > 0
}

// Payload's generated document type, narrowed to what this app reads. Declared
// structurally rather than imported so the Crow path stays free of any
// dependency on the trial.
type ArtworkDoc = {
    slug?: string | null,
    filename?: string | null,
    width?: number | null,
    height?: number | null,
    createdAt: string,
    order?: number | null,
    medium?: string | null,
    title?: string | null,
    year?: number | null,
    material?: string | null,
    favorite?: boolean | null,
    series?: (number | { slug?: string | null })[] | null,
    sizes?: Record<string, { url?: string | null, width?: number | null } | undefined> | null,
}

type ArtworkWithSlug = ArtworkDoc & { slug: string }

function toAssetMetadata(doc: ArtworkWithSlug): AssetMetadata {
    return {
        // Crow's asset id, carried through the migration — this is what keeps
        // /all/<id> URLs alive.
        id: doc.slug,
        fileName: doc.filename ?? '',
        width: doc.width ?? 300,
        height: doc.height ?? 300,
        uploaded: Date.parse(doc.createdAt),
        order: doc.order ?? undefined,
        kind: doc.medium ?? undefined,
        title: doc.title ?? undefined,
        year: doc.year ?? undefined,
        material: doc.material ?? undefined,
        tags: legacyTags(doc),
        series: seriesSlugs(doc),
        variants: variantsFor(doc),
    }
}

// alikro's filters and its hardcoded collections still query Crow's tag
// vocabulary. Payload stores series relations and a boolean instead, so the
// vocabulary is reconstructed here rather than duplicated in the database —
// which keeps the A/B comparing presentation rather than two different models.
function legacyTags(doc: ArtworkWithSlug): string[] | undefined {
    const tags = (seriesSlugs(doc) ?? [])
        .map(tagForSeriesSlug)
        .filter((tag): tag is string => tag !== undefined)
    if (doc.favorite) {
        tags.push(FAVORITE_TAG)
    }
    return tags.length > 0 ? tags : undefined
}

function seriesSlugs(doc: ArtworkWithSlug): string[] | undefined {
    const slugs = (doc.series ?? [])
        .map(entry => typeof entry === 'object' && entry?.slug ? entry.slug : undefined)
        .filter((slug): slug is string => slug !== undefined)
    return slugs.length > 0 ? slugs : undefined
}

function variantsFor(doc: ArtworkWithSlug): AssetVariant[] | undefined {
    const variants = Object.values(doc.sizes ?? {})
        .filter((size): size is { url: string, width: number } =>
            typeof size?.url === 'string' && typeof size?.width === 'number')
        .map(size => ({ width: size.width, url: size.url }))
        .sort((a, b) => a.width - b.width)
    return variants.length > 0 ? variants : undefined
}

// Imported lazily so that merely importing this module does not construct a
// database connection — the Crow path must stay unaffected.
async function getPayloadInstance() {
    const [{ getPayload }, { default: config }] = await Promise.all([
        import('payload'),
        import('../payload.config'),
    ])
    return getPayload({ config })
}
