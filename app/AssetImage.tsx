'use client'
import Image from "next/image"
import { AssetMetadata, assetAlt, assetHeight, assetWidth } from "../shared/asset"
import { imageSrc } from "../shared/image"

interface AssetImageProps {
    asset: AssetMetadata
    sizes?: string
    style?: React.CSSProperties
    loading?: 'lazy' | 'eager'
    priority?: boolean
}

const snapWidths = [320, 480, 640, 768, 960, 1200, 1600, 1920]
function makeLoader(asset: AssetMetadata) {
    return function loader({ src, width, quality }: { src: string, width: number, quality?: number }) {
        // With reported variants the CMS owns the widths, so snapping to our own
        // list would be guessing at names it never promised.
        if (asset.variants && asset.variants.length > 0) {
            return imageSrc({ fileName: src, width, quality, variants: asset.variants })
        }
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
}

export function AssetImage({ asset, sizes, style, loading, priority }: AssetImageProps) {
    const width = assetWidth(asset)
    const height = assetHeight(asset)
    return (
        <Image
            src={asset.fileName}
            loader={makeLoader(asset)}
            alt={assetAlt(asset)}
            width={width}
            height={height}
            sizes={sizes}
            loading={loading}
            priority={priority}
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
