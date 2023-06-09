import {
    Asset, AssetKind, assetDescription, assetHref, assets, assetsForKind,
} from "@/shared/assets"
import Link from "next/link"
import { AssetImage } from "@/shared/AssetImage"

export function GalleryPage({ kind }: {
    kind: AssetKind,
}) {
    return <Gallery assets={assetsForKind(assets, kind)} />
}

export function Gallery({ assets }: {
    assets: Asset[],
}) {
    return (
        <div className="columns-3 sm:columns-4">
            {assets.map((asset) => (
                <Tile key={asset.name} asset={asset} />
            ))}
        </div>
    )
}

function Tile({ asset }: {
    asset: Asset,
}) {
    return <Link href={assetHref(asset)}>
        <div className="flex flex-col break-inside-avoid-column">
            <AssetImage asset={asset} />
            <span className="hidden sm:flex text-xs text-accent">
                {assetDescription(asset)}
            </span>
        </div>
    </Link>
}