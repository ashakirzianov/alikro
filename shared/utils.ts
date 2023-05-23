export type AssetKind = 'drawing' | 'illustration' | 'painting' | 'poster' | 'hidden' | 'collage' | 'tattoo'
export type AssetSize = `${number}x${number}`
export type Asset = {
    kind: AssetKind,
    name: string,
    title: string,
    year: number,
    material: string,
    size: AssetSize,
}

export function assetsForKind(assets: Asset[], kind: AssetKind) {
    return assets.filter((asset) => asset.kind === kind)
}
export function assetSrc(asset: Asset) {
    return `/${asset.name}`
}
export function assetAlt(asset: Asset) {
    return `${asset.title} (${asset.year})`
}
export function assetWidth(asset: Asset) {
    return asset.size ? parseInt(asset.size.split('x')[0]) : 300
}
export function assetHeight(asset: Asset) {
    return asset.size ? parseInt(asset.size.split('x')[1]) : 300
}
export function assetDescription(asset: Asset) {
    return `${asset.title} (${asset.year}), ${asset.material}`
}
export function assetHref(asset: Asset) {
    return `/works/${assetSegment(asset)}`
}
export function assetSegment(asset: Asset) {
    return asset.title.toLowerCase().replace(/[^a-zA-Z0-9]/g, '-')
}
export function findAssetForSegment(assets: Asset[], segment: string) {
    return assets.find((asset) => assetSegment(asset) === segment)
}

export function findDuplicates<T>(arr: T[], comparator: (a: T, b: T) => boolean): T[] {
    const duplicates: T[] = [];
    const seen: T[] = [];

    arr.forEach((item) => {
        if (seen.some((seenItem) => comparator(item, seenItem))) {
            duplicates.push(item);
        } else {
            seen.push(item);
        }
    });

    return duplicates;
}

