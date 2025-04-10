import { Gallery } from "@/app/Gallery"
import { assetsForQuery, sortAssets } from "@/shared/assets"
import { isAuthenticated } from "@/shared/auth"
import { getAllAssetMetadata, getAssetMetadata } from "@/shared/metadataStore"
import { allCollections, collectionForId } from "@/shared/collection"
import { ogImagesForAsset } from "./utils"

type Props = {
    collection: string,
}
type Params = Promise<Props>

export async function generateStaticParams(): Promise<Props[]> {
    const collections = allCollections()
    return collections.map(collection => ({
        collection: collection.id,
    }))
}

export async function generateMetadata({
    params, searchParams,
}: {
    params: Params,
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>,
}) {
    const { collection } = await params
    let title = 'Not found'
    let description = 'Not found'
    const collectionMetadata = collectionForId(collection)
    if (collectionMetadata !== undefined) {
        title = collectionMetadata.title
        description = collectionMetadata.description
    }
    const { show } = await searchParams
    const modalAssetId = typeof show === 'string' ? show : undefined
    const asset = modalAssetId
        ? await getAssetMetadata(modalAssetId)
        : undefined
    const images = asset ? ogImagesForAsset(asset) : undefined
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

export default async function Page({
    params, searchParams,
}: {
    params: Promise<{ collection: string }>
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>,
}) {
    const { collection } = await params
    const collectionObject = collectionForId(collection)
    if (collectionObject === undefined) {
        return null
    }
    const { show } = await searchParams
    let modalAssetId = typeof show === 'string' ? show : undefined
    const unsorted = await getAllAssetMetadata()
    const assets = sortAssets(unsorted)
    const filtered = assetsForQuery(assets, collectionObject.query)
    modalAssetId = filtered.some(asset => asset.id === modalAssetId)
        ? modalAssetId
        : undefined

    const pathname = `/${collection}`
    const authenticated = await isAuthenticated()

    return <Gallery
        assets={filtered}
        pathname={pathname}
        modalAssetId={modalAssetId}
        authenticated={authenticated}
    />
}