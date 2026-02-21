export type Timestamp = number
export type AssetMetadata = {
    id: string,
    fileName: string,
    width: number,
    height: number,
    uploaded: Timestamp,
    order?: number,
    kind?: string,
    title?: string,
    year?: number,
    material?: string,
    tags?: string[],
}
export type AssetMetadataUpdate = Omit<
    AssetMetadata,
    'fileName' | 'width' | 'height' | 'uploaded'
>

export type AssetKind = string
export type AssetTag = string

export type AssetSize = `${number}x${number}`

export function assetMetadataUpdate(asset: AssetMetadata): AssetMetadataUpdate {

    const { width, height, uploaded, fileName, ...update } = asset
    return update
}

export function assetFileName(asset: AssetMetadata) {
    return asset.fileName
}

export function assetAlt(asset: AssetMetadata) {
    return `${asset.title} (${asset.year})`
}

export function assetWidth(asset: AssetMetadata) {
    return asset.width ?? 300
}

export function assetHeight(asset: AssetMetadata) {
    return asset.height ?? 300
}

export function assetDescription(asset: AssetMetadata) {
    return `${asset.title ?? 'Untitled'} (${asset.year ?? 'year unknown'}), ${asset.material ?? 'unspecified material'}`
}

export function generateAssetId(fileName: string) {
    const [name] = splitFileNameAndExtension(fileName)
    return name.toLowerCase().replace(/[^a-zA-Z0-9]/g, '-')
}

export function sortAssets(assets: AssetMetadata[]) {
    return [...assets].sort((a, b) => {
        if (a.order !== b.order) {
            return (a.order ?? 0) - (b.order ?? 0)
        } else if (a.uploaded !== b.uploaded) {
            return b.uploaded - a.uploaded
        } else {
            return 0
        }
    })
}

// Extract unique kinds from assets
export function extractUniqueKinds(assets: AssetMetadata[]): AssetKind[] {
    return Array.from(new Set(
        assets
            .map(asset => asset.kind)
            .filter((kind): kind is AssetKind => !!kind)
    )).sort()
}

// Extract unique tags from assets
export function extractUniqueTags(assets: AssetMetadata[]): AssetTag[] {
    return Array.from(new Set(
        assets
            .flatMap(asset => asset.tags || [])
            .filter((tag): tag is AssetTag => !!tag)
    )).sort()
}

// Extract min and max order values from assets
export function getAssetsOrderRange(assets: AssetMetadata[]): [number, number] {
    if (assets.length === 0) {
        return [0, 0]
    }

    return assets.reduce(
        ([min, max], asset) => {
            const order = asset.order ?? 0
            return [
                Math.min(min, order),
                Math.max(max, order)
            ]
        },
        [Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER]
    )
}

// Parse comma-separated tags string into an array of tags
export function parseTagsString(tagsString?: string | null): AssetTag[] {
    if (!tagsString) return []

    return tagsString
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0) as AssetTag[]
}

export function splitFileNameAndExtension(fileName: string): [string, string] {
    const lastDotIndex = fileName.lastIndexOf('.')
    if (lastDotIndex === -1) {
        return [fileName, '']
    }
    const name = fileName.slice(0, lastDotIndex)
    const extension = fileName.slice(lastDotIndex + 1)
    return [name, extension]
}

