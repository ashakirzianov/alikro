import { notFound } from "next/navigation"
import { getTiles } from "@/app/(detailed)/tiles"
import { Gallery } from "@/app/(detailed)/Gallery"
import { AssetView } from "@/app/(detailed)/AssetView"
import { collectionForId } from "@/shared/collection"
import { getAssetMetadata } from "@/shared/metadataStore"

type Props = {
    filter: string,
    value: string,
}

export async function generateStaticParams(): Promise<Props[]> {
    return [{
        filter: 'tag',
        value: 'self-portrait',
    }]
}

export default async function Page({
    params,
}: {
    params: Promise<Props>,
}) {
    const { filter, value } = await params

    if (isKindFilter(filter)) {
        const asset = await getAssetMetadata(value)
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
    const tiles = await getTiles(filter, value)
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