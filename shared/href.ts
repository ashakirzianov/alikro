import { AssetMetadata } from "./assets"

// TODO: combine w/hrefForAssetModal
export function hrefForAsset(asset: Pick<AssetMetadata, 'id'>) {
    return `/works/${asset.id}`
}

export function hrefForAssetModal(asset: AssetMetadata, section: string) {
    return `/${section}?show=${asset.id}`
}

export function hrefForSection(category: string) {
    return `/${category}`
}

export function hrefForConsole({
    section, action, assetId
}: {
    section?: string,
    action?: string,
    assetId?: string,
}): string {
    const searchParams = new URLSearchParams()
    if (section && section !== 'all') {
        searchParams.set('filter', section)
    }
    if (assetId) {
        searchParams.set('aside', `edit:${assetId}`)
    } else if (action) {
        searchParams.set('aside', action)
    }
    return searchParams.size === 0
        ? '/console'
        : `/console?${searchParams.toString()}`
}