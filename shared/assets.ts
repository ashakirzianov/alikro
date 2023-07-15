import { allAssets } from "./allAssets"

export type AssetKind = 'drawing' | 'illustration' | 'painting' | 'poster' | 'hidden' | 'collage' | 'tattoo'
export type AssetTag = 'selfportrait' | 'favorite'
export type AssetQuery = AssetTag | AssetKind | {
    kind: 'and' | 'or',
    queries: AssetQuery[],
} | {
    kind: 'not',
    query: AssetQuery,
}
export type AssetSize = `${number}x${number}`
export type Asset = {
    kind: AssetKind,
    name: string,
    title: string,
    year: number,
    material: string,
    size: AssetSize,
    tags?: AssetTag[],
}

export function assetSrc(asset: Asset) {
    return `/${asset.name}`
}
export function assetAlt(asset: Asset) {
    return `${asset.title} (${asset.year})`
}
export function assetWidth(asset: Asset) {
    return asset.size ? parseInt(asset.size.split('x')[0]) : 300
}
export function assetHeight(asset: Asset) {
    return asset.size ? parseInt(asset.size.split('x')[1]) : 300
}
export function assetDescription(asset: Asset) {
    return `${asset.title} (${asset.year}), ${asset.material}`
}
export function assetHref(asset: Asset) {
    return `/works/${assetSegment(asset)}`
}
export function assetSegment(asset: Asset) {
    return asset.title.toLowerCase().replace(/[^a-zA-Z0-9]/g, '-')
}

export function all() {
    return allAssets
}

export function forTags(...tags: (AssetTag | AssetKind)[]) {
    return assetsForTags(allAssets, ...tags)
}

export function forSegment(segment: string) {
    return findAssetForSegment(allAssets, segment)
}

export function forQueries(...queries: AssetQuery[]) {
    return assetsForQuery(allAssets, and(...queries))
}

export function and(...queries: AssetQuery[]): AssetQuery {
    return { kind: 'and', queries }
}

export function or(...queries: AssetQuery[]): AssetQuery {
    return { kind: 'or', queries }
}

export function not(query: AssetQuery): AssetQuery {
    return { kind: 'not', query }
}

function assetsForTags(assets: Asset[], ...tags: (AssetTag | AssetKind)[]) {
    return assets.filter((asset) =>
        tags.some(
            (tag) => asset.tags?.includes(tag as AssetTag) || asset.kind === tag
        )
    )
}

function assetsForKind(assets: Asset[], kind: AssetKind) {
    return assets.filter((asset) => asset.kind === kind)
}

function findAssetForSegment(assets: Asset[], segment: string) {
    return assets.find((asset) => assetSegment(asset) === segment)
}

function assetsForQuery(assets: Asset[], query: AssetQuery) {
    return assets.filter((asset) => matchQuery(asset, query))
}

function matchQuery(asset: Asset, query: AssetQuery): boolean {
    if (typeof query === 'string') {
        return asset.tags?.includes(query as AssetTag) || asset.kind === query
    } else if (query.kind === 'and') {
        return query.queries.every((q) => matchQuery(asset, q))
    } else if (query.kind === 'or') {
        return query.queries.some((q) => matchQuery(asset, q))
    } else if (query.kind === 'not') {
        return !matchQuery(asset, query.query)
    } else {
        return false
    }
}
