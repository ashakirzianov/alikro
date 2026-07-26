// The Crow record -> Payload document transform, kept as a pure function so it
// can be exercised over the whole archive without a database. `validate.ts` runs
// it across all 632 records; `migrate.ts` is the only thing that writes.

import { materialComponents } from './materials'
import { isFavoriteTag, seriesSlugForTag } from './series'

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
    // Derived from `material` by the site's own parser. The raw string above
    // stays authoritative, so this is additive and fully reversible.
    materialSlugs: string[],
    supportSlugs: string[],
    medium?: Medium,
    showOnSite: boolean,
    status: 'draft' | 'published',
    order?: number,
    // Crow's `uploaded`, as Payload's own createdAt. The Postgres adapter only
    // defaults createdAt when one is not supplied, so no second date field is
    // needed to preserve it.
    createdAt: string,
    favorite: boolean,
    seriesSlugs: string[],
}

export type MappingIssue = {
    slug: string,
    field: string,
    message: string,
    // Blocking issues stop the migration. An unclassified tag is blocking on
    // purpose: silently carrying it is how mis-modelling survives a review.
    blocking: boolean,
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
        issues.push({ slug: '(missing)', field: 'slug', message: 'Crow record has no id', blocking: true })
    }
    if (!asset.fileName) {
        issues.push({ slug, field: 'fileName', message: 'Crow record has no fileName — nothing to join to', blocking: true })
    }

    const createdAt = new Date(asset.uploaded ?? 0).toISOString()
    if (Number.isNaN(Date.parse(createdAt))) {
        issues.push({ slug, field: 'createdAt', message: `uploaded value ${asset.uploaded} is not a date`, blocking: true })
    }

    const medium = mediumForKind(asset.kind)
    if (asset.kind && medium === undefined && asset.kind !== KIND_UNPUBLISHED) {
        issues.push({ slug, field: 'medium', message: `unknown kind "${asset.kind}" — add it to MEDIUMS or map it`, blocking: true })
    }

    const components = materialComponents(asset.material)
    if (asset.material && asset.material.trim().length > 0 && components.length === 0) {
        // The prose says the work is made of something and the parser found
        // nothing. Silently migrating an artwork with no materials would be a
        // hole nobody notices until Alina filters for it.
        issues.push({
            slug,
            field: 'materials',
            message: `material "${asset.material}" yields no components — check shared/material.ts before migrating`,
            blocking: true,
        })
    }

    let favorite = false
    const seriesSlugs: string[] = []
    for (const tag of asset.tags ?? []) {
        const seriesSlug = seriesSlugForTag(tag)
        if (seriesSlug) {
            seriesSlugs.push(seriesSlug)
        } else if (isFavoriteTag(tag)) {
            favorite = true
        } else {
            // A tag added to Crow after the series table was written. There is
            // no flat-tag field to hide it in any more, and quietly dropping it
            // would mis-model the work — so this stops the run.
            issues.push({
                slug,
                field: 'series',
                message: `tag "${tag}" is neither a known series nor the favorite flag — classify it in series.ts before migrating`,
                blocking: true,
            })
        }
    }

    return {
        artwork: {
            slug,
            fileName: asset.fileName,
            title: asset.title,
            year: asset.year,
            material: asset.material,
            materialSlugs: components.filter(c => c.role === 'medium').map(c => c.slug),
            supportSlugs: components.filter(c => c.role === 'support').map(c => c.slug),
            medium,
            showOnSite: showOnSiteForKind(asset.kind),
            status: asset.kind === KIND_UNPUBLISHED ? 'draft' : 'published',
            order: asset.order,
            createdAt,
            favorite,
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
        createdAt: artwork.createdAt,
        favorite: artwork.favorite,
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
            blocking: true,
        }))
}
