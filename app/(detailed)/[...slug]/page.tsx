import { allCollections, collectionForId } from "@/shared/collection"
import { AssetPage, AssetsPage } from "@/app/(detailed)/AssetsPage"
import { generateMetadataForAssetId, generateMetadataForCollectionId, generateMetadataForMaterial, generateMetadataForTag, generateMetadataForYear } from "./metadata"
import { notFound } from "next/navigation"
import { AssetQuery, material, tag, year } from "@/shared/assets"

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
            if (second === undefined) {
                return generateMetadataForCollectionId(first)
            } else {
                return generateMetadataForAssetId(second)
            }
    }
}

export type AssetsPageData = {
    kind: 'collection' | 'tag' | 'material' | 'year',
    query: AssetQuery,
    assetId: string,
}
export function assetsPageDataForSlug(slug: string[]): AssetsPageData | undefined {
    const [first, second, third] = slug
    switch (first) {
        case 'tag': case 'year': case 'material':
            if (second === undefined) {
                return undefined
            } else {
                const query = first === 'year' ? year(parseInt(second))
                    : first === 'material' ? material(decodeURIComponent(second))
                        : tag(decodeURIComponent(second))
                const assetId = third
                return {
                    kind: first,
                    query,
                    assetId,
                }
            }
        default: {
            const collectionObject = collectionForId(first)
            if (collectionObject === undefined) {
                return undefined
            }
            return {
                kind: 'collection',
                query: collectionObject.query,
                assetId: second,
            }
        }
    }
}

export default async function Page({
    params, searchParams,
}: Input) {
    const { show } = await searchParams
    const { slug } = await params
    const pathname = `/${slug.join('/')}`
    const modalAssetId = typeof show === 'string' ? show : undefined

    const pageData = assetsPageDataForSlug(slug)
    if (pageData === undefined) {
        return notFound()
    } else if (pageData.assetId !== undefined) {
        return <AssetPage
            assetId={pageData.assetId}
            pathname={pathname}
        />
    } else {
        return <AssetsPage
            query={pageData.query}
            pathname={pathname}
            modalAssetId={modalAssetId}
        />
    }
}