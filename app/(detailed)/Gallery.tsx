import {
    AssetMetadata,
} from "@/shared/asset"
import Link from "next/link"
import { AssetImage } from "@/app/AssetImage"
import { hrefForAssetModal } from "@/shared/href"
import { OptionalModal } from "./WorkModal"
import { AssetDescription } from "./AssetDescription"

export function Gallery({
    assets, pathname,
}: {
    assets: AssetMetadata[],
    pathname: string,
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
            <OptionalModal
                assets={assets}
                pathname={pathname}
            />
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
    return (
        <div className="flex flex-col break-inside-avoid-column">
            <Link href={href} scroll={false} className="block">
                <AssetImage asset={asset} sizes="25vw" />
            </Link>
            <span className="text-xs text-accent">
                <AssetDescription asset={asset} pathname={pathname} />
            </span>
        </div>
    )
}