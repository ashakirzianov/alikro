import { notFound } from "next/navigation"
import { getAssetMetadata, getAssetsForTag } from "@/shared/metadataStore"
import { AssetView } from "@/app/(detailed)/AssetView"
import { generateMetadataForAssetId } from "@/app/(detailed)/metadata"

type Props = {
    filter: string,
    value: string,
    id: string,
}

export async function generateStaticParams({ params: { filter, value } }: {
    params: Omit<Props, 'id'>,
}): Promise<Props[]> {
    if (filter !== 'tag') {
        filter = 'tag'
        value = 'self-portrait'
    }
    const assets = await getAssetsForTag(value)
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