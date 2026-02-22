import {
    AssetMetadata,
} from "@/shared/asset"
import Link from "next/link"
import { AssetImage } from "@/app/AssetImage"
import { hrefForAssetModal } from "@/shared/href"
import { OptionalModal } from "./WorkModal"
import { AssetDescription } from "./AssetDescription"
import { GalleryLayout } from "./GalleryLayout"

export function Gallery({
    assets, pathname,
}: {
    assets: AssetMetadata[],
    pathname: string,
}) {
    return (
        <>
            <OptionalModal
                assets={assets}
                pathname={pathname}
            />
            <GalleryLayout
                pathname={pathname}
                assets={assets}
                fractions={[33, 33, 34]}
            />
        </>
    )
}

export function Tile({ asset, pathname }: {
    asset: AssetMetadata,
    pathname: string,
}) {
    const href = hrefForAssetModal({
        pathname,
        assetId: asset.id,
    })
    return (
        <div className="flex flex-col break-inside-avoid-column">
            <Link href={href} className="block">
                <AssetImage asset={asset} sizes="25vw" />
            </Link>
            <span className="text-xs text-accent">
                <AssetDescription asset={asset} pathname={pathname} />
            </span>
        </div>
    )
}