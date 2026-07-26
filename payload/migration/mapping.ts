// The Crow record -> Payload document transform, kept as a pure function so it
// can be exercised over the whole archive without a database. `validate.ts` runs
// it across all 632 records; `migrate.ts` is the only thing that writes.

import { isFlagTag, seriesSlugForTag } from './series'

// Crow's AssetMetadata, as it comes out of the export.
export type CrowAsset = {
    id: string,
    fileName: string,
    width: number,
    height: number,
    uploaded: number,
    order?: number,
    kind?: string,
    title?: string,
    year?: number,
    material?: string,
    tags?: string[],
}

export type CrowExport = {
    exportedAt: string,
    source: string,
    count: number,
    assets: CrowAsset[],
}

export type MappedArtwork = {
    slug: string,
    fileName: string,
    title?: string,
    year?: number,
    material?: string,
    medium?: Medium,
    showOnSite: boolean,
    status: 'draft' | 'published',
    order?: number,
    uploadedAt: string,
    tags: string[],
    seriesSlugs: string[],
}

export type MappingIssue = {
    slug: string,
    field: string,
    message: string,
}

const MEDIUMS = ['painting', 'drawing', 'ceramic', 'illustration', 'poster', 'collage', 'tattoo'] as const
export type Medium = typeof MEDIUMS[number]

// Crow's `kind` carried medium, publication state and a site exclusion at once.
// These two values are the non-medium ones and each maps somewhere specific.
const KIND_UNPUBLISHED = 'unpublished'
const KIND_HIDDEN = 'hidden'

// The two `hidden` records are digital illustrations made for an app. They keep
// a real medium and lose their place in the galleries, which is what `hidden`
// was standing in for.
const HIDDEN_MEDIUM: Medium = 'illustration'

export function mapAsset(asset: CrowAsset): { artwork: MappedArtwork, issues: MappingIssue[] } {
    const issues: MappingIssue[] = []
    const slug = asset.id

    if (!slug) {
        issues.push({ slug: '(missing)', field: 'slug', message: 'Crow record has no id' })
    }
    if (!asset.fileName) {
        issues.push({ slug, field: 'fileName', message: 'Crow record has no fileName — nothing to join to' })
    }

    const uploadedAt = new Date(asset.uploaded ?? 0).toISOString()
    if (Number.isNaN(Date.parse(uploadedAt))) {
        issues.push({ slug, field: 'uploadedAt', message: `uploaded value ${asset.uploaded} is not a date` })
    }

    const medium = mediumForKind(asset.kind)
    if (asset.kind && medium === undefined && asset.kind !== KIND_UNPUBLISHED) {
        issues.push({ slug, field: 'medium', message: `unknown kind "${asset.kind}" — add it to MEDIUMS or map it` })
    }

    const tags: string[] = []
    const seriesSlugs: string[] = []
    for (const tag of asset.tags ?? []) {
        const seriesSlug = seriesSlugForTag(tag)
        if (seriesSlug) {
            seriesSlugs.push(seriesSlug)
        } else if (isFlagTag(tag)) {
            tags.push(tag)
        } else {
            // A tag added to Crow after the series table was written. Kept as a
            // flat tag so nothing is lost, and reported so it can be classified.
            tags.push(tag)
            issues.push({ slug, field: 'tags', message: `tag "${tag}" is neither a known series nor a known flag — kept as a flat tag` })
        }
    }

    return {
        artwork: {
            slug,
            fileName: asset.fileName,
            title: asset.title,
            year: asset.year,
            material: asset.material,
            medium,
            showOnSite: showOnSiteForKind(asset.kind),
            status: asset.kind === KIND_UNPUBLISHED ? 'draft' : 'published',
            order: asset.order,
            uploadedAt,
            tags,
            seriesSlugs,
        },
        issues,
    }
}

export function mapExport(assets: CrowAsset[]) {
    const artworks: MappedArtwork[] = []
    const issues: MappingIssue[] = []
    for (const asset of assets) {
        const result = mapAsset(asset)
        artworks.push(result.artwork)
        issues.push(...result.issues)
    }
    issues.push(...duplicateSlugIssues(artworks))
    return { artworks, issues }
}

// The fields handed to payload.create. Kept separate from MappedArtwork so the
// transform stays inspectable and the write shape stays obvious.
export function createDataFor(artwork: MappedArtwork) {
    return {
        slug: artwork.slug,
        title: artwork.title,
        year: artwork.year,
        material: artwork.material,
        medium: artwork.medium,
        showOnSite: artwork.showOnSite,
        order: artwork.order,
        uploadedAt: artwork.uploadedAt,
        tags: artwork.tags,
        _status: artwork.status,
    }
}

function mediumForKind(kind: string | undefined): Medium | undefined {
    if (kind === undefined || kind === KIND_UNPUBLISHED) {
        return undefined
    }
    if (kind === KIND_HIDDEN) {
        return HIDDEN_MEDIUM
    }
    return isMedium(kind) ? kind : undefined
}

function isMedium(kind: string): kind is Medium {
    return (MEDIUMS as readonly string[]).includes(kind)
}

// alikro hides tattoos from every gallery via a hardcoded filter in
// shared/preprocess.ts, and `hidden` marked work that was made for somewhere
// else. Both become the same explicit, editable flag.
function showOnSiteForKind(kind: string | undefined): boolean {
    return kind !== 'tattoo' && kind !== KIND_HIDDEN
}

function duplicateSlugIssues(artworks: MappedArtwork[]): MappingIssue[] {
    const seen = new Map<string, number>()
    for (const artwork of artworks) {
        seen.set(artwork.slug, (seen.get(artwork.slug) ?? 0) + 1)
    }
    return [...seen.entries()]
        .filter(([, count]) => count > 1)
        .map(([slug, count]) => ({
            slug,
            field: 'slug',
            message: `${count} records share this slug — the unique index will reject all but the first`,
        }))
}
