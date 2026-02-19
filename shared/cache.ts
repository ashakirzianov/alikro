import { cacheTag } from "next/cache"
import { AssetQuery } from "./assets"
import { asserNever } from "./utils"

export function cacheTagForAssetId(assetId: string) {
    cacheTag(`crow:asset:id:${assetId}`)
}

export function cacheTagForTag(tag: string) {
    cacheTag(`crow:asset:tag:${tag}`)
}

export function cacheTagForMaterial(material: string) {
    cacheTag(`crow:asset:material:${material}`)
}

export function cacheTagForYear(year: number) {
    cacheTag(`crow:asset:year:${year}`)
}

export function cacheTagForIndex() {
    cacheTag('crow:asset:index')
}

export function cacheTagForQuery(query: AssetQuery) {
    if (query === null) {
        cacheTagForIndex()
    } else if (typeof query === 'string') {
        cacheTagForTag(query)
    } else if (Array.isArray(query)) {
        query.forEach((q) => cacheTagForQuery(q))
    } else {
        switch (query.kind) {
            case 'or':
                query.queries.forEach((q) => cacheTagForQuery(q))
                break
            case 'not':
                cacheTagForQuery(query.query)
                break
            case 'material':
                cacheTagForMaterial(query.material)
                break
            case 'year':
                cacheTagForYear(query.year)
                break
            default:
                // This should never happen if the type system is correct
                asserNever(query)
                break
        }
    }
}