import { assetDescription } from "@/shared/assets"
import { imageSrc } from "@/shared/images"
import { getAssetMetadata } from "@/shared/metadataStore"

export async function generateMetadataForAssetId(assetId: string) {
    const asset = await getAssetMetadata(assetId)
    if (!asset) {
        const title = 'Not found'
        const description = 'Not found'
        return {
            title, description,
            openGraph: {
                title, description,
            },
            twitter: {
                title, description,
            },
        }
    }
    const title = asset?.title ?? 'Picture'
    const description = asset ? assetDescription(asset) : 'My work'
    const images = [{
        url: imageSrc({
            fileName: asset.fileName,
            width: 1200,
        }),
        alt: asset.title,
    }]
    return {
        title, description,
        openGraph: {
            title, description, images,
        },
        twitter: {
            title, description, images,
        },
    }
}