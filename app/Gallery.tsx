import Image from "next/image"
import { Asset } from "./assets"
import { assetAlt, assetDescription, assetHeight, assetHref, assetSrc, assetWidth } from "./utils"
import Link from "next/link"

export function Gallery({ assets }: {
    assets: Asset[],
}) {
    return (
        <div className="columns-4">
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
            <Image
                src={assetSrc(asset)}
                alt={assetAlt(asset)}
                width={assetWidth(asset)}
                height={assetHeight(asset)}
            />
            <span className="text-xs text-lime-500">
                {assetDescription(asset)}
            </span>
        </div>
    </Link>
}