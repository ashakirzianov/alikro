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

async function loadAssetMetadata(id: string): Promise<AssetMetadata | undefined> {
    const base = process.env.NEXT_PUBLIC_CROW_CMS
    const secret = process.env.CROW_CMS_SECRET_KEY
    const res = await fetch(`${base}/api/projects/alikro/assets/${id}`, {
        headers: { Authorization: `Bearer ${secret}` },
    })
    if (!res.ok) return undefined
    type Response = AssetMetadata
    const asset = await res.json() as Response
    return asset
}

// Get all stored assets
async function loadAllAssetMetadata(): Promise<AssetMetadata[]> {
    console.log('Loading all asset metadata from CMS...')
    const base = process.env.NEXT_PUBLIC_CROW_CMS
    const secret = process.env.CROW_CMS_SECRET_KEY
    const res = await fetch(`${base}/api/projects/alikro/assets`, {
        headers: { Authorization: `Bearer ${secret}` },
    })
    console.log(`Response status: ${res.status}, for ${base}/api/projects/alikro/assets`)
    if (!res.ok) return []
    type Response = AssetMetadata[]
    const data: Response = await res.json()
    console.log(`Loaded ${data.length} assets from CMS`)
    return data
}