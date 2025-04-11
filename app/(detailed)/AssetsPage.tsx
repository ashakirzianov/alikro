import { AssetQuery, assetsForQuery, sortAssets } from "@/shared/assets"
import { isAuthenticated } from "@/shared/auth"
import { getAllAssetMetadata, getAssetMetadata } from "@/shared/metadataStore"
import { Gallery } from "../Gallery"
import { AssetView } from "./AssetView"
import { notFound } from "next/navigation"

export async function AssetsPage({
    query, pathname, modalAssetId,
}: {
    query: AssetQuery,
    pathname: string,
    modalAssetId?: string,
}) {
    const unsorted = await getAllAssetMetadata()
    const assets = sortAssets(unsorted)
    const filtered = assetsForQuery(assets, query)
    modalAssetId = filtered.some(asset => asset.id === modalAssetId)
        ? modalAssetId
        : undefined

    const authenticated = await isAuthenticated()

    return <Gallery
        assets={filtered}
        pathname={pathname}
        modalAssetId={modalAssetId}
        authenticated={authenticated}
    />
}

export async function AssetPage({
    assetId, pathname,
}: {
    assetId: string,
    pathname: string,
}) {
    const authenticated = await isAuthenticated()

    const asset = await getAssetMetadata(assetId)
    if (asset === undefined) {
        return notFound()
    }
    return <AssetView
        asset={asset}
        authenticated={authenticated}
        pathname={pathname}
    />
}