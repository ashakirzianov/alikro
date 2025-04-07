import {
    AssetMetadata, AssetKind,
    assetDescription, assetsForTags,
    AssetTag,
} from "@/shared/assets"
import Link from "next/link"
import { AssetImage } from "@/shared/AssetImage"
import { hrefForAsset } from "@/shared/href"

export function GalleryPage({ assets, kind }: {
    assets: AssetMetadata[],
    kind: AssetKind | AssetTag,
}) {
    return <Gallery assets={assetsForTags(assets, kind)} />
}

export function AllWorksPage({ assets }: {
    assets: AssetMetadata[],
}) {
    return <Gallery assets={assets} />
}

export function Gallery({ assets }: {
    assets: AssetMetadata[],
}) {
    return (
        <div className="columns-3 sm:columns-4">
            {assets.map((asset) => (
                <Tile key={asset.fileName} asset={asset} />
            ))}
        </div>
    )
}

function Tile({ asset }: {
    asset: AssetMetadata,
}) {
    return <Link href={hrefForAsset(asset)}>
        <div className="flex flex-col break-inside-avoid-column">
            <AssetImage asset={asset} size="medium" />
            <span className="hidden sm:flex text-xs text-accent">
                {assetDescription(asset)}
            </span>
        </div>
    </Link>
}