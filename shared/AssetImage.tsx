'use client'
import Image from "next/image"
import { AssetMetadata, assetAlt, assetHeight, assetWidth } from "./assets"
import { imageSrc } from "./images"

interface AssetImageProps {
    asset: AssetMetadata
    sizes?: string
    style?: React.CSSProperties
}

const snapWidths = [320, 480, 640, 768, 960, 1200, 1600, 1920]
function loader({ src, width, quality }: { src: string, width: number, quality?: number }) {
    let closestWidth = snapWidths[0]
    for (const snapWidth of snapWidths) {
        closestWidth = snapWidth
        if (snapWidth >= width) {
            break
        }
    }
    return imageSrc({
        fileName: src,
        width: closestWidth,
        quality,
    })
}

export function AssetImage({ asset, sizes, style }: AssetImageProps) {
    const width = assetWidth(asset)
    const height = assetHeight(asset)
    return (
        <Image
            src={asset.fileName}
            loader={loader}
            alt={assetAlt(asset)}
            width={width}
            height={height}
            sizes={sizes}
            style={{
                userSelect: 'none',
                WebkitUserSelect: 'none',
                MozUserSelect: 'none',
                msUserSelect: 'none',
                ...style,
            }}
        />
    )
}
