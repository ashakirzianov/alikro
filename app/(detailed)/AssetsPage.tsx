import { AssetQuery, assetsForQuery, sortAssets } from "@/shared/assets"
import { getAllAssetMetadata, getAssetMetadata } from "@/shared/metadataStore"
import { Gallery } from "../Gallery"
import { AssetView } from "./AssetView"
import { notFound } from "next/navigation"

export async function AssetsPage({
    query, pathname
}: {
    query: AssetQuery,
    pathname: string,
}) {
    const unsorted = await getAllAssetMetadata()
    const assets = sortAssets(unsorted)
    const filtered = assetsForQuery(assets, query)

    return <Gallery
        assets={filtered}
        pathname={pathname}
    />
}

export async function AssetPage({
    assetId, pathname,
}: {
    assetId: string,
    pathname: string,
}) {
    const asset = await getAssetMetadata(assetId)
    if (asset === undefined) {
        return notFound()
    }
    return <AssetView
        asset={asset}
        pathname={pathname}
    />
}