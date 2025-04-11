import {
    AssetMetadata, assetDescription,
} from "@/shared/assets"
import Link from "next/link"
import { AssetImage } from "@/shared/AssetImage"
import { hrefForAssetModal } from "@/shared/href"
import { WorkModal } from "./WorkModal"

export function Gallery({
    assets, pathname, modalAssetId, authenticated,
}: {
    assets: AssetMetadata[],
    pathname: string,
    modalAssetId?: string,
    authenticated?: boolean,
}) {
    return (
        <>
            {modalAssetId && <WorkModal
                assetId={modalAssetId}
                assets={assets}
                pathname={pathname}
                authenticated={authenticated}
            />}
            <div className="columns-3 sm:columns-4">
                {assets.map((asset) => (
                    <Tile
                        key={asset.fileName}
                        asset={asset}
                        pathname={pathname}
                    />
                ))}
            </div>
        </>
    )
}

function Tile({ asset, pathname }: {
    asset: AssetMetadata,
    pathname: string,
}) {
    const href = hrefForAssetModal({
        pathname,
        assetId: asset.id,
    })
    return <Link href={href} className="block mb-4">
        <div className="flex flex-col break-inside-avoid-column">
            <AssetImage asset={asset} size="medium" />
            <span className="hidden sm:flex text-xs text-accent">
                {assetDescription(asset)}
            </span>
        </div>
    </Link>
}