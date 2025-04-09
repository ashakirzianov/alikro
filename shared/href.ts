import { AssetMetadata } from "./assets"

export function hrefForAsset(asset: Pick<AssetMetadata, 'id'>) {
    return `/works/${asset.id}`
}

export function hrefForCategory(category: string) {
    return `/works/${category}`
}

export function hrefForConsole(
    section: string,
    action?: 'upload' | 'edit' | 'json',
    id?: string,
): string {
    return id !== undefined ? `/console/${section}/${action}/${id}`
        : action !== undefined ? `/console/${section}/${action}`
            : `/console/${section}`
}