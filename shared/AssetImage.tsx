import Image from "next/image"
import { Asset, assetAlt, assetHeight, assetSrc, assetWidth } from "./assets"

export function AssetImage({ asset, style }: {
    asset: Asset,
    style?: React.CSSProperties,
}) {
    return <Image
        src={assetSrc(asset)}
        alt={assetAlt(asset)}
        width={assetWidth(asset)}
        height={assetHeight(asset)}
        style={{
            userSelect: 'none',
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none',
            ...style,
        }}
    />
}