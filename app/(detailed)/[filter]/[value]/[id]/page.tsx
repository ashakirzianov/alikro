import { notFound } from "next/navigation"
import { getAssetMetadata, getAssetsForCollection, getAssetsForTag } from "@/shared/metadataStore"
import { AssetView } from "@/app/(detailed)/AssetView"
import { generateMetadataForAssetId } from "@/app/(detailed)/metadata"

type Props = {
    filter: string,
    value: string,
    id: string,
}

export async function generateStaticParams({ params }: {
    params: Omit<Props, 'id'>,
}): Promise<Props[]> {
    const { filter, value } = params ?? {}
    if (!filter || !value) {
        return [{ filter: 'tag', value: 'Self-portrait', id: '__fallback' }]
    }
    const assets = filter === 'tag'
        ? await getAssetsForTag(value)
        : await getAssetsForCollection(filter)
    if (assets.length === 0) {
        return [{ filter, value, id: '__empty' }]
    }
    return assets.map(asset => ({
        filter,
        value,
        id: asset.id,
    }))
}

export async function generateMetadata({
    params,
}: {
    params: Promise<Props>,
}) {
    const { id } = await params
    return generateMetadataForAssetId(id)
}

export default async function Page({
    params,
}: {
    params: Promise<Props>,
}) {
    const { filter, value, id } = await params

    const asset = await getAssetMetadata(id)
    if (!asset) {
        return notFound()
    }
    const pathname = `/${filter}/${value}`
    return <AssetView
        asset={asset}
        pathname={pathname}
    />
}
