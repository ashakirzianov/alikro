import { allCollections, collectionForId } from "@/shared/collection"
import { AssetPage, AssetsPage } from "@/app/(detailed)/AssetsPage"
import { generateMetadataForAssetId, generateMetadataForCollectionId, generateMetadataForTag } from "./metadata"
import { notFound } from "next/navigation"

type Props = {
    slug: string[],
}
type Input = {
    params: Promise<{ slug: string[] }>
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export const dynamicParams = true
export async function generateStaticParams(): Promise<Props[]> {
    const collections = allCollections()
    return collections.map(collection => ({
        slug: [collection.id],
    }))
}

export async function generateMetadata({
    params, searchParams,
}: Input) {
    const { show } = await searchParams
    if (typeof show === 'string') {
        return generateMetadataForAssetId(show)
    }
    const { slug } = await params
    const [first, second] = slug
    switch (first) {
        case 'tag':
            return generateMetadataForTag(second)
        default:
            return generateMetadataForCollectionId(first)
    }
}

export default async function Page({
    params, searchParams,
}: Input) {
    const { show } = await searchParams
    const { slug } = await params
    const [first, second, third] = slug
    const pathname = `${slug.join('/')}`
    const modalAssetId = typeof show === 'string' ? show : undefined

    switch (first) {
        case 'tag':
            if (second === undefined) {
                return null
            } else if (third === undefined) {
                return <AssetsPage
                    query={second}
                    pathname={pathname}
                    modalAssetId={modalAssetId}
                />
            } else {
                return <AssetPage
                    assetId={third}
                    pathname={pathname}
                />
            }
        default: {
            const collectionObject = collectionForId(first)
            if (collectionObject === undefined) {
                return notFound()
            }
            if (second === undefined) {
                return <AssetsPage
                    query={collectionObject.query}
                    pathname={pathname}
                    modalAssetId={modalAssetId}
                />
            } else {
                return <AssetPage
                    assetId={second}
                    pathname={pathname}
                />
            }
        }
    }
}