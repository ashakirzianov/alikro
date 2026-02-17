'use client'

import Image from "next/image"
import { AssetMetadata, assetAlt, assetHeight, assetSrc, assetVariantSrc, assetWidth } from "./assets"
import { requestVariant } from "./variantClient"

export type AssetImageSize = 'medium' | 'full'

interface AssetImageProps {
    asset: AssetMetadata
    size: AssetImageSize
    style?: React.CSSProperties
}

function getDimensionsForAsset(asset: AssetMetadata, _size: AssetImageSize): [number, number] {
    const width = assetWidth(asset)
    const height = assetHeight(asset)
    return [width, height]
}

// Tracks in-flight variant requests to avoid duplicate API calls
const pendingVariants = new Set<string>()

function scheduleVariant(assetId: string, variant: string) {
    console.log(`Scheduling variant generation: ${assetId} - ${variant}`)
    const key = `${assetId}:${variant}`
    if (pendingVariants.has(key)) return
    pendingVariants.add(key)
    requestVariant(assetId, variant).finally(() => pendingVariants.delete(key))
}

function findClosestVariant(variants: string[], requestedWidth: number): string | undefined {
    return variants
        .map(v => ({ v, width: parseInt(v.split('@')[0], 10) }))
        .filter(({ width }) => width >= requestedWidth)
        .sort((a, b) => a.width - b.width)[0]?.v
}

function makeLoader(asset: AssetMetadata) {
    return function loader({ width, quality }: { src: string; width: number; quality?: number }): string {
        const variant = quality !== undefined ? `${width}@${quality}` : `${width}`
        const variants = asset.variants ?? []

        if (variants.includes(variant)) {
            return assetVariantSrc(asset, variant)
        }

        scheduleVariant(asset.id, variant)

        const closest = findClosestVariant(variants, width)
        return closest ? assetVariantSrc(asset, closest) : assetSrc(asset)
    }
}

export function AssetImage({ asset, size, style }: AssetImageProps) {
    const [width, height] = getDimensionsForAsset(asset, size)
    return (
        <Image
            loader={makeLoader(asset)}
            src={assetSrc(asset)}
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
