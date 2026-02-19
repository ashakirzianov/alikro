import { AssetMetadata } from "./assets"

export async function fetchAssetMetadata(id: string): Promise<AssetMetadata | undefined> {
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
export async function fetchAllAssetMetadata(): Promise<AssetMetadata[]> {
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