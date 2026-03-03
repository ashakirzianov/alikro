import { notFound } from "next/navigation"
import { getAssetMetadata, getAssetsForTag } from "@/shared/metadataStore"
import { AssetView } from "@/app/(detailed)/AssetView"

type Props = {
    filter: string,
    value: string,
    id: string,
}

export async function generateStaticParams({ params }: {
    params: Omit<Props, 'id'>[],
}): Promise<Props[]> {
    const paramArrays = await Promise.all(params.map(async ({ filter, value }) => {
        if (filter !== 'tag') {
            return []
        }
        const assets = await getAssetsForTag(value)
        return assets.map(asset => ({
            filter,
            value,
            id: asset.id,
        }))
    }))
    return paramArrays.flat()
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