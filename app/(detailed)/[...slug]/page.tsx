import { allCollections } from "@/shared/collection"
import { generateMetadataForAssetId, generateMetadataForCollectionId, generateMetadataForMaterial, generateMetadataForTag, generateMetadataForYear } from "./metadata"
import { notFound } from "next/navigation"
import { assetsPageDataForSlug } from "./data"
import { AssetView } from "../AssetView"
import { Gallery } from "@/app/Gallery"

type Props = {
    slug: string[],
}
type Input = {
    params: Promise<{ slug: string[] }>
}

export const dynamicParams = true
export async function generateStaticParams(): Promise<Props[]> {
    const collections = allCollections()
    return collections.map(collection => ({
        slug: [collection.id],
    }))
}

export async function generateMetadata({
    params,
}: Input) {
    const { slug } = await params
    const [first, second, third] = slug
    if (third !== undefined) {
        return generateMetadataForAssetId(third)
    }
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

export default async function Page({
    params,
}: Input) {
    const { slug } = await params
    const pathname = `/${slug.join('/')}`

    const pageData = await assetsPageDataForSlug(slug)
    if (pageData === undefined) {
        return notFound()
    }
    const { asset, assets } = pageData
    if (asset !== undefined) {
        return <AssetView
            asset={asset}
            pathname={pathname}
        />
    } else if (assets !== undefined) {
        return <Gallery
            assets={assets}
            pathname={pathname}
        />
    } else {
        return notFound()
    }
}