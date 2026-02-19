import {
    AssetMetadata, AssetQuery, assetsForQuery, sortAssets,
    year as yearQuery
} from './assets'

let allAssets: AssetMetadata[] | null = null
function invalidateCache() {
    allAssets = null
}

export async function getAssetsForYear(year: number) {
    const query = yearQuery(year)
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

export async function getAllAssetMetadata(force?: boolean) {
    if (force || null === allAssets) {
        allAssets = await loadAllAssetMetadata()
        setTimeout(invalidateCache, 1000 * 60 * 1) // Invalidate cache after 1 minute
    }
    return allAssets
}

export async function getAssetMetadata(id: string) {
    if (null !== allAssets) {
        const asset = allAssets.find((asset) => asset.id === id)
        if (asset) {
            return asset
        }
    }
    return loadAssetMetadata(id)
}

async function loadAssetMetadata(id: string): Promise<AssetMetadata | undefined> {
    const base = process.env.NEXT_PUBLIC_CROW_CMS
    const secret = process.env.CROW_CMS_SECRET_KEY
    const res = await fetch(`${base}/api/projects/alikro/metadata/${id}`, {
        headers: { Authorization: `Bearer ${secret}` },
    })
    if (!res.ok) return undefined
    type Response = AssetMetadata
    const asset = await res.json() as Response
    return asset
}

// Get all stored assets
async function loadAllAssetMetadata(): Promise<AssetMetadata[]> {
    const base = process.env.NEXT_PUBLIC_CROW_CMS
    const secret = process.env.CROW_CMS_SECRET_KEY
    const res = await fetch(`${base}/api/projects/alikro/metadata`, {
        headers: { Authorization: `Bearer ${secret}` },
    })
    if (!res.ok) return []
    type Response = AssetMetadata[]
    const data: Response = await res.json()
    return data
}