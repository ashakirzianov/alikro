import { Redis } from '@upstash/redis'
import { AssetMetadata, AssetMetadataUpdate } from './assets'

type AssetMetadataValue = Omit<AssetMetadata, 'id'>

// Initialize Redis
const redis = Redis.fromEnv()
const ASSETS = 'assets'
let allAssets: AssetMetadata[] | null = null
export async function getAllAssetMetadata() {
    return loadAllAssetMetadata()
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

export async function getAssetNames() {
    return redis.hkeys(ASSETS)
}

// Store a single asset
export async function storeAsset(asset: AssetMetadata): Promise<boolean> {
    if (!asset.fileName) throw new Error('Asset must have a URL')
    const { id, ...metadata } = asset

    await redis.hset(ASSETS, {
        [id]: JSON.stringify(metadata),
    })

    return true
}

// Store multiple assets
export async function storeAssets(assets: AssetMetadata[]): Promise<boolean> {
    const entries: AssetsRecord = {}

    for (const asset of assets) {
        if (!asset.id) {
            continue
        }
        const { id, ...metadata } = asset
        entries[id] = metadata
    }

    await redis.hset(ASSETS, entries)

    return true
}

// Delete a single asset
export async function deleteAssetMetadata(id: string): Promise<boolean> {
    const result = await redis.hdel(ASSETS, id)
    // Clear the cache after deletion
    allAssets = null
    return result > 0
}

export async function applyMetadataUpdates(
    updates: AssetMetadataUpdate[]) {
    const data = await redis.hgetall<AssetsRecord>(ASSETS)
    if (!data) {
        return
    }
    const assetStore: AssetsRecord = {}
    for (const update of updates) {
        const { id, ...metadata } = update
        if (data[id]) {
            assetStore[id] = {
                ...data[id],
                ...metadata,
            }
        }
    }
    let result = 0
    if (Object.keys(assetStore).length > 0) {
        result = await redis.hset(ASSETS, assetStore)
        allAssets = null
    }
    return result
}

export async function seed(assets: AssetMetadata[], force: boolean) {
    const assetStore: AssetsRecord = {}
    let storedSet: Set<string> = new Set()
    if (!force) {
        const storedNames = await getAssetNames()
        storedSet = new Set(storedNames)
    }
    let hasAny = false
    for (const asset of assets) {
        if (storedSet.has(asset.fileName)) {
            continue
        }
        const { id, ...metadata } = asset
        assetStore[id] = metadata
        hasAny = true
    }
    if (!hasAny) {
        return 0
    } else {
        return redis.hset(ASSETS, assetStore)
    }
}

export async function cleanMetadataStore() {
    await redis.del(ASSETS)
}

type AssetsRecord = {
    [key: string]: AssetMetadataValue,
}

async function loadAssetMetadata(id: string): Promise<AssetMetadata | undefined> {
    const data = await redis.hget<AssetMetadataValue>(ASSETS, id)
    if (!data) {
        return undefined
    }
    return { id, ...data }
}

// Get all stored assets
async function loadAllAssetMetadata(): Promise<AssetMetadata[]> {
    const data = await redis.hgetall<AssetsRecord>(ASSETS)
    if (!data) {
        return []
    } else {
        return Object.entries(data).map(
            ([id, data]) => ({ id, ...data })
        )
    }
}