import {
    AssetMetadata, assetDescription,
} from "@/shared/assets"
import Link from "next/link"
import { AssetImage } from "@/shared/AssetImage"
import { hrefForAssetModal } from "@/shared/href"
import { WorkModal } from "./WorkModal"

export function Gallery({
    assets, path, modalAssetId, authenticated,
}: {
    assets: AssetMetadata[],
    path: string,
    modalAssetId?: string,
    authenticated?: boolean,
}) {
    return (
        <>
            {modalAssetId && <WorkModal
                assetId={modalAssetId}
                assets={assets}
                path={path}
                authenticated={authenticated}
            />}
            <div className="columns-3 sm:columns-4">
                {assets.map((asset) => (
                    <Tile
                        key={asset.fileName}
                        asset={asset}
                        path={path}
                    />
                ))}
            </div>
        </>
    )
}

function Tile({ asset, path }: {
    asset: AssetMetadata,
    path: string,
}) {
    return <Link href={hrefForAssetModal(asset, path)} className="block mb-4">
        <div className="flex flex-col break-inside-avoid-column">
            <AssetImage asset={asset} size="medium" />
            <span className="hidden sm:flex text-xs text-accent">
                {assetDescription(asset)}
            </span>
        </div>
    </Link>
}