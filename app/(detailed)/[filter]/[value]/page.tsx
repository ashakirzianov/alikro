import { notFound } from "next/navigation"
import { getTiles } from "@/app/(detailed)/tiles"
import { Gallery } from "@/app/(detailed)/Gallery"
import { AssetView } from "@/app/(detailed)/AssetView"
import { generateMetadataForMaterial, generateMetadataForTag, generateMetadataForYear, generateMetadataForAssetId } from "@/app/(detailed)/metadata"
import { collectionForId } from "@/shared/collection"
import { getAssetMetadata } from "@/shared/metadataStore"

type Props = {
    filter: string,
    value: string,
}

export async function generateStaticParams({ params: { filter } }: { params: Omit<Props, 'value'> }): Promise<Props[]> {
    return [{
        filter: 'tag',
        value: 'self-portrait',
    }]
}

export async function generateMetadata({
    params,
}: {
    params: Promise<Props>,
}) {
    const { filter, value } = await params
    switch (filter) {
        case 'tag':
            return generateMetadataForTag(value)
        case 'material':
            return generateMetadataForMaterial(value)
        case 'year':
            return generateMetadataForYear(value)
        default:
            return generateMetadataForAssetId(value)
    }
}

export default async function Page({
    params,
}: {
    params: Promise<Props>,
}) {
    const { filter, value } = await params
    const decodedValue = decodeURIComponent(value)

    if (isKindFilter(filter)) {
        const asset = await getAssetMetadata(decodedValue)
        if (!asset) {
            return notFound()
        }
        const pathname = `/${filter}`
        return <AssetView
            asset={asset}
            pathname={pathname}
        />
    }

    const pathname = `/${filter}/${value}`
    const tiles = await getTiles(filter, decodedValue)
    if (tiles.length === 0) {
        return notFound()
    }

    return <Gallery
        tiles={tiles}
        pathname={pathname}
    />
}

function isKindFilter(filter: string): boolean {
    return collectionForId(filter) !== undefined
}