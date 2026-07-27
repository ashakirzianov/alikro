export type Timestamp = number
// One rendition of an asset, at a known width, at a known URL.
export type AssetVariant = {
    width: number,
    url: string,
}
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
    series?: string[],
    // Present only when the CMS reports its renditions rather than letting the
    // client compose URLs by convention. Crow does not; Payload does, and has to
    // — its variant filenames carry actual output dimensions, so a name built
    // from a requested width can point at nothing. Ascending by width.
    variants?: AssetVariant[],
    // Where this record is edited, in whichever CMS produced it. Present only
    // when the CMS is the embedded one — Crow's console lives on another origin
    // and is built from an env var instead. Carrying the path here rather than
    // branching on the content source in the client is deliberate: the flag is
    // server-only (`CONTENT_SOURCE`, no `NEXT_PUBLIC_` prefix), so a client
    // component cannot read it, and adding a second public copy of the flag
    // would give the A/B two switches that can disagree.
    cmsEditPath?: string,
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