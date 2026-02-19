import {
    AssetMetadata, AssetQuery, assetsForQuery, sortAssets,
    year as yearQuery, material as materialQuery, tag as tagQuery,
} from './assets'
import { fetchAllAssetMetadata, fetchAssetMetadata } from './cms'
import { collectionForId } from './collection'

export async function getAssetsForSlideshow() {
    return getSortedAssetsForQuery(null)
}

export async function getAssetsForYear(year: number) {
    const query = yearQuery(year)
    return getSortedAssetsForQuery(query)
}

export async function getAssetsForTag(tag: string) {
    const query = tagQuery(tag)
    return getSortedAssetsForQuery(query)
}

export async function getAssetsForMaterial(material: string) {
    const query = materialQuery(material)
    return getSortedAssetsForQuery(query)
}

export async function getAssetsForCollection(collectionId: string) {
    const collectionObject = collectionForId(collectionId)
    if (collectionObject === undefined) {
        return []
    }
    const query = collectionObject.query
    return getSortedAssetsForQuery(query)
}

export async function getUniquePropertyValues<P extends keyof AssetMetadata>(property: P): Promise<NonNullable<AssetMetadata[P]>[]> {
    const assets = await getAllAssetMetadata()
    const values = assets
        .map(asset => asset[property])
        .filter((value): value is NonNullable<AssetMetadata[P]> => value !== undefined)
    return Array.from(new Set(values))
}

async function getSortedAssetsForQuery(query: AssetQuery) {
    const unsorted = await getAllAssetMetadata()
    const assets = sortAssets(unsorted)
    const filtered = assetsForQuery(assets, query)
    return filtered
}

export async function getAssetMetadata(id: string) {
    if (null !== allAssets) {
        const asset = allAssets.find((asset) => asset.id === id)
        if (asset) {
            return asset
        }
    }
    return fetchAssetMetadata(id)
}

async function getAllAssetMetadata(force?: boolean) {
    if (force || null === allAssets) {
        allAssets = await fetchAllAssetMetadata()
        setTimeout(invalidateCache, 1000 * 60 * 1) // Invalidate cache after 1 minute
    }
    return allAssets
}

let allAssets: AssetMetadata[] | null = null
function invalidateCache() {
    allAssets = null
}