import { AssetMetadata, assetSrc } from "@/shared/assets"

export async function ogImagesForAsset(asset: AssetMetadata) {
    return [{
        url: assetSrc(asset),
        alt: asset.title,
    }]

}