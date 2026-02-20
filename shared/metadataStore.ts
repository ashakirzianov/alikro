import {
    AssetMetadata, AssetQuery, assetsForQuery, sortAssets,
    year as yearQuery, material as materialQuery, tag as tagQuery,
} from './assets'
import { fetchAllAssetMetadata } from './cms'
import { collectionForId } from './collection'
import { cacheLife, cacheTag } from 'next/cache'

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

export async function getUniqueYears() {
    const years = await getUniquePropertyValues('year')
    // Sort years, undefined goes last
    years.sort((a, b) => (b ?? 0) - (a ?? 0))
    return years
}

export async function getUniqueMaterials() {
    return getUniquePropertyValues('material')
}

export async function getUniqueTags() {
    const assets = await getAllAssetMetadata()
    const tagSet = new Set<string>()
    assets.forEach(asset => {
        asset.tags?.forEach(tag => tagSet.add(tag))
    })
    return Array.from(tagSet)
}

async function getUniquePropertyValues<P extends keyof AssetMetadata>(property: P): Promise<AssetMetadata[P][]> {
    'use cache'
    cacheLife('days')
    const assets = await getAllAssetMetadata()
    const values = assets
        .map(asset => asset[property])
        .filter((value): value is NonNullable<AssetMetadata[P]> => value !== undefined)
    return Array.from(new Set(values))
}

async function getSortedAssetsForQuery(query: AssetQuery) {
    'use cache'
    cacheLife('days')
    const unsorted = await getAllAssetMetadata()
    const assets = sortAssets(unsorted)
    const filtered = assetsForQuery(assets, query)
    filtered.forEach(asset => cacheTagForAssetId(asset.id))
    return filtered
}

export async function getAssetMetadata(id: string) {
    'use cache'
    cacheLife('days')
    cacheTagForAssetId(id)
    const assets = await getAllAssetMetadata()
    return assets.find(asset => asset.id === id)
}

async function getAllAssetMetadata() {
    'use cache'
    cacheTagForIndex()
    cacheLife('days')
    return fetchAllAssetMetadata()
}

function cacheTagForAssetId(assetId: string) {
    cacheTag(`crow-asset-id-${assetId}`)
}

function cacheTagForIndex() {
    cacheTag('crow-asset-index')
}