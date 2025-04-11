import { assetDescription, assetSrc } from "@/shared/assets"
import { collectionForId } from "@/shared/collection"
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
        url: assetSrc(asset),
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

export async function generateMetadataForTag(tag: string) {
    const title = `Alikro | ${tag}`
    const description = `Alikro's works marked as '${tag}'`
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

export async function generateMetadataForCollectionId(collectionId: string) {
    let title = 'Not found'
    let description = 'Not found'
    const collectionMetadata = collectionForId(collectionId)
    if (collectionMetadata !== undefined) {
        title = collectionMetadata.title
        description = collectionMetadata.description
    }
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