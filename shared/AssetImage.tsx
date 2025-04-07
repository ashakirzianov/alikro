import Image from "next/image"
import { AssetMetadata, assetAlt, assetHeight, assetSrc, assetWidth } from "./assets"

export type AssetImageSize = 'small' | 'medium' | 'full'

interface AssetImageProps {
    asset: AssetMetadata
    size: AssetImageSize
    style?: React.CSSProperties
}

/**
 * Maps size prop to Next.js sizes attribute for optimized image loading
 * - small: 10vw (used for thumbnails in console)
 * - medium: 35vw (used for gallery and main page)
 * - full: 100vw (used for work detail pages and modals)
 */
function getSizeValue(size: AssetImageSize): string {
    switch (size) {
        case 'small':
            return '10vw'
        case 'medium':
            return '35vw'
        case 'full':
            return '100vw'
        default:
            return '50vw' // fallback
    }
}

export function AssetImage({ asset, size, style }: AssetImageProps) {
    return (
        <Image
            src={assetSrc(asset)}
            alt={assetAlt(asset)}
            width={assetWidth(asset)}
            height={assetHeight(asset)}
            sizes={getSizeValue(size)}
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