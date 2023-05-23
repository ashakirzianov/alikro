import Image from "next/image"
import { Asset } from "./assets"

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
    return <div className="flex flex-col break-inside-avoid-column">
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
}

function assetSrc(asset: Asset) {
    return `/${asset.name}`
}
function assetAlt(asset: Asset) {
    return `${asset.title} (${asset.year})`
}
function assetWidth(asset: Asset) {
    return asset.size ? parseInt(asset.size.split('x')[0]) : 300
}
function assetHeight(asset: Asset) {
    return asset.size ? parseInt(asset.size.split('x')[1]) : 300
}
function assetDescription(asset: Asset) {
    return `${asset.title} (${asset.year}), ${asset.material}`
}