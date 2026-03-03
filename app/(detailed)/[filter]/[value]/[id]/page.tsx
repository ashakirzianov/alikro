import { notFound } from "next/navigation"
import { getAssetMetadata } from "@/shared/metadataStore"
import { AssetView } from "@/app/(detailed)/AssetView"

type Props = {
    filter: string,
    value: string,
    id: string,
}

export async function generateStaticParams(): Promise<Props[]> {
    return [{
        filter: 'tag',
        value: 'self-portrait',
        id: '1',
    }]
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