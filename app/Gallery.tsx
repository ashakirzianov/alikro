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
    function buildColumns(assets: AssetMetadata[], num: number) {
        const columns: AssetMetadata[][] = Array(num).fill(null).map(() => [])
        assets.forEach((asset, index) => {
            const columnIndex = index % num
            columns[columnIndex].push(asset)
        })
        return columns
    }
    const columns = buildColumns(assets, 4)
    return (
        <>
            {modalAssetId && <WorkModal
                assetId={modalAssetId}
                assets={assets}
                pathname={pathname}
                authenticated={authenticated}
            />}
            <div className="flex flex-row gap-2">
                {columns.map((column, index) => (
                    <div key={index} className="flex flex-col w-1/4 gap-0">
                        {column.map((asset) => (
                            <Tile
                                key={asset.fileName}
                                asset={asset}
                                pathname={pathname}
                            />
                        ))}
                    </div>
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
    return <Link href={href} className="block">
        <div className="flex flex-col break-inside-avoid-column">
            <AssetImage asset={asset} size="medium" />
            <span className="hidden sm:flex text-xs text-accent">
                {assetDescription(asset)}
            </span>
        </div>
    </Link>
}