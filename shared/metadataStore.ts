import { AssetMetadata } from './assets'

let allAssets: AssetMetadata[] | null = null
function invalidateCache() {
    allAssets = null
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

async function loadAssetMetadata(_id: string): Promise<AssetMetadata | undefined> {
    return undefined
}

// Get all stored assets
async function loadAllAssetMetadata(): Promise<AssetMetadata[]> {
    return []
}