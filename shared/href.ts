import { AssetMetadata, AssetMetadataUpdate } from "./assets"
import { filterOutUndefined } from "./utils"

export function hrefForAsset(asset: Pick<AssetMetadata, 'id'>) {
    return `/works/${asset.id}`
}

export function hrefForCategory(category: string) {
    return `/works/${category}`
}

export function affectedPathsForAsset(asset: AssetMetadataUpdate) {
    return filterOutUndefined([
        '/',
        '/console',
        hrefForAsset(asset),
        asset.kind ? hrefForCategory(asset.kind ?? '') : undefined,
    ])
}