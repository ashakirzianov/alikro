import Image from "next/image"
import { AssetMetadata, assetAlt, assetHeight, assetWidth } from "./assets"
import { imageSrc } from "./images"

export type AssetImageSize = 'medium' | 'full'

interface AssetImageProps {
    asset: AssetMetadata
    size: AssetImageSize
    style?: React.CSSProperties
}

function getDimensionsForAsset(asset: AssetMetadata, _size: AssetImageSize): [number, number] {
    const width = assetWidth(asset)
    const height = assetHeight(asset)
    // const widths: Record<AssetImageSize, number> = {
    //     medium: 600,
    //     full: width,
    // }
    // const aspect = width / height
    // return [
    //     widths[size],
    //     Math.round(widths[size] / aspect),
    // ]
    return [width, height]
}

function loader({ src, width }: { src: string, width: number }) {
    return imageSrc({
        fileName: src,
        width,
    })
}

export function AssetImage({ asset, size, style }: AssetImageProps) {
    const [width, height] = getDimensionsForAsset(asset, size)
    return (
        <Image
            src={asset.fileName}
            loader={loader}
            alt={assetAlt(asset)}
            width={width}
            height={height}
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
