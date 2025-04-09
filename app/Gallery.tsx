import {
    AssetMetadata, assetDescription,
} from "@/shared/assets"
import Link from "next/link"
import { AssetImage } from "@/shared/AssetImage"
import { hrefForAsset } from "@/shared/href"

export function Gallery({ assets, path }: {
    assets: AssetMetadata[],
    path: string,
}) {
    return (
        <div className="columns-3 sm:columns-4">
            {assets.map((asset) => (
                <Tile
                    key={asset.fileName}
                    asset={asset}
                    path={path}
                />
            ))}
        </div>
    )
}

function Tile({ asset, path }: {
    asset: AssetMetadata,
    path: string,
}) {
    return <Link href={{
        pathname: hrefForAsset(asset),
        query: { from: path },
    }}>
        <div className="flex flex-col break-inside-avoid-column">
            <AssetImage asset={asset} size="medium" />
            <span className="hidden sm:flex text-xs text-accent">
                {assetDescription(asset)}
            </span>
        </div>
    </Link>
}