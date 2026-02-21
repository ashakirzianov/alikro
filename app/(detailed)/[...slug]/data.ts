import { AssetMetadata } from "@/shared/asset"
import { getAssetMetadata, getAssetsForCollection, getAssetsForMaterial, getAssetsForTag, getAssetsForYear } from "@/shared/metadataStore"

export type AssetsPageData = {
    kind: 'tag' | 'material' | 'year',
    assets: AssetMetadata[],
    asset?: undefined,
} | {
    kind: 'collection',
    collectionId: string,
    assets: AssetMetadata[],
    asset?: undefined,
} | {
    kind: 'individual',
    assetId: string,
    asset: AssetMetadata,
    assets?: undefined,
}
export async function assetsPageDataForSlug(slug: string[]): Promise<AssetsPageData | undefined> {
    const [first, second, third] = slug
    switch (first) {
        case 'tag': case 'year': case 'material':
            if (second === undefined) {
                return undefined
            } else if (third !== undefined) {
                const asset = await getAssetMetadata(third)
                if (!asset) {
                    return undefined
                }
                return {
                    kind: 'individual',
                    assetId: third,
                    asset,
                }
            } else {
                const assets = first === 'year' ? await getAssetsForYear(parseInt(second))
                    : first === 'material' ? await getAssetsForMaterial(decodeURIComponent(second))
                        : await getAssetsForTag(decodeURIComponent(second))
                return {
                    kind: first,
                    assets,
                }
            }
        default: {
            if (second !== undefined) {
                const asset = await getAssetMetadata(second)
                if (!asset) {
                    return undefined
                }
                return {
                    kind: 'individual',
                    assetId: second,
                    asset,
                }
            } else {
                const assets = await getAssetsForCollection(first)
                return {
                    kind: 'collection',
                    collectionId: first,
                    assets,
                }
            }
        }
    }
}