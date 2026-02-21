import { AssetMetadata } from "./assets"
import { asserNever } from "./utils"

type AssetWildcardQuery = null
type AssetKindQuery = string
type AssetAndQuery = AssetQuery[]
type AssetOrQuery = { kind: 'or', queries: AssetQuery[] }
type AssetNotQuery = { kind: 'not', query: AssetQuery }
type AssetYearQuery = { kind: 'year', year: number }
type AssetMaterialQuery = { kind: 'material', material: string }
type AssetTagQuery = { kind: 'tag', tag: string }
export type AssetQuery = AssetWildcardQuery | AssetKindQuery | AssetAndQuery | AssetOrQuery | AssetNotQuery | AssetYearQuery | AssetMaterialQuery | AssetTagQuery

export function assetsForQuery(assets: AssetMetadata[], query: AssetQuery) {
    return assets.filter((asset) => matchQuery(asset, query))
}

export function and(...queries: AssetQuery[]): AssetQuery {
    return queries
}

export function or(...queries: AssetQuery[]): AssetQuery {
    return { kind: 'or', queries }
}

export function not(query: AssetQuery): AssetQuery {
    return { kind: 'not', query }
}

export function year(year: number): AssetQuery {
    return { kind: 'year', year }
}

export function material(material: string): AssetQuery {
    return { kind: 'material', material }
}

export function tag(tag: string): AssetQuery {
    return { kind: 'tag', tag }
}

function matchQuery(asset: AssetMetadata, query: AssetQuery): boolean {
    if (query === null) {
        return true
    } else if (typeof query === 'string') {
        return asset.kind === query
    } else if (Array.isArray(query)) {
        return query.every((q) => matchQuery(asset, q))
    }
    switch (query.kind) {
        case 'or':
            return query.queries.some((q) => matchQuery(asset, q))
        case 'not':
            return !matchQuery(asset, query.query)
        case 'material':
            return asset.material?.includes(query.material) ?? false
        case 'year':
            return asset.year === query.year
        case 'tag':
            return asset.tags?.includes(query.tag) ?? false
        default:
            // This should never happen if the type system is correct
            asserNever(query)
            return false
    }
}