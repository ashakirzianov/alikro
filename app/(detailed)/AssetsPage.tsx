import { AssetQuery, assetsForQuery, sortAssets } from "@/shared/assets"
import { getAllAssetMetadata, getAssetMetadata } from "@/shared/metadataStore"
import { Gallery } from "../Gallery"
import { AssetView } from "./AssetView"
import { notFound } from "next/navigation"

export async function AssetsPage({
    query, pathname, modalAssetId, admin,
}: {
    query: AssetQuery,
    pathname: string,
    modalAssetId?: string,
    admin?: boolean,
}) {
    const unsorted = await getAllAssetMetadata()
    const assets = sortAssets(unsorted)
    const filtered = assetsForQuery(assets, query)
    modalAssetId = filtered.some(asset => asset.id === modalAssetId)
        ? modalAssetId
        : undefined

    return <Gallery
        assets={filtered}
        pathname={pathname}
        modalAssetId={modalAssetId}
        admin={admin}
    />
}

export async function AssetPage({
    assetId, pathname, admin,
}: {
    assetId: string,
    pathname: string,
    admin?: boolean,
}) {
    const asset = await getAssetMetadata(assetId)
    if (asset === undefined) {
        return notFound()
    }
    return <AssetView
        asset={asset}
        admin={admin}
        pathname={pathname}
    />
}