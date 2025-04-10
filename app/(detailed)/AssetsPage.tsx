import { AssetQuery, assetsForQuery, sortAssets } from "@/shared/assets"
import { isAuthenticated } from "@/shared/auth"
import { getAllAssetMetadata } from "@/shared/metadataStore"
import { Gallery } from "../Gallery"

export default async function AssetsPage({
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