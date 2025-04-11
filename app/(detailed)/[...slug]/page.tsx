import { allCollections, collectionForId } from "@/shared/collection"
import { AssetPage, AssetsPage } from "@/app/(detailed)/AssetsPage"
import { generateMetadataForAssetId, generateMetadataForCollectionId, generateMetadataForMaterial, generateMetadataForTag, generateMetadataForYear } from "./metadata"
import { notFound } from "next/navigation"
import { material, tag, year } from "@/shared/assets"

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
        case 'material':
            return generateMetadataForMaterial(second)
        case 'year':
            return generateMetadataForYear(second)
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
        case 'tag': case 'year': case 'material':
            if (second === undefined) {
                return null
            } else if (third === undefined) {
                const query = first === 'year' ? year(parseInt(second))
                    : first === 'material' ? material(second)
                        : tag(second)
                return <AssetsPage
                    query={query}
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