import { allCollections, collectionForId } from "@/shared/collection"
import { generateMetadataForAssetId } from "../common"
import { AssetsPage } from "../AssetsPage"

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
    const { show } = await searchParams
    if (typeof show === 'string') {
        return generateMetadataForAssetId(show as string)
    }
    const { collection } = await params
    let title = 'Not found'
    let description = 'Not found'
    const collectionMetadata = collectionForId(collection)
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

export default async function Page({
    params, searchParams,
}: {
    params: Promise<{ collection: string }>
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>,
}) {
    const { collection } = await params
    const { show } = await searchParams
    const pathname = `/${collection}`
    const modalAssetId = typeof show === 'string' ? show : undefined
    const collectionObject = collectionForId(collection)
    if (collectionObject === undefined) {
        return null
    }

    return <AssetsPage
        query={collectionObject.query}
        pathname={pathname}
        modalAssetId={modalAssetId}
    />
}