import { AssetImage } from "@/app/AssetImage"
import { assetHeight, AssetMetadata, assetWidth } from "@/shared/asset"
import { hrefForAssetModal } from "@/shared/href"
import Link from "next/link"
import { useState } from "react"

export type SlideAsset = AssetMetadata & { pathname: string, slideIndex: number }

export function DynamicLayout({
    slides, aspect, fractions, scroll,
}: {
    slides: SlideAsset[][],
    aspect: number,
    fractions: readonly [number, number, number],
    scroll: number,
}) {
    const [one, two, three] = fractions
    const lines = computeLines({
        slides,
        aspect,
        fractions,
    })
    return <>
        <AssetLine
            assets={lines[1]}
            scroll={scroll * aspect}
            fraction={two}
            aspect={aspect}
        />
        <AssetLine
            assets={lines[0]}
            scroll={scroll * aspect}
            fraction={one}
            aspect={aspect}
            direction="right"
            priority
        />
        <AssetLine
            assets={lines[2]}
            scroll={scroll * aspect}
            fraction={three}
            aspect={aspect}
        />
    </>
}

function AssetLine({ assets, scroll, fraction, aspect, direction, priority }: {
    assets: SlideAsset[],
    scroll: number,
    fraction: number
    aspect: number
    direction?: 'left' | 'right',
    priority?: boolean,
}) {
    if (direction === 'right') {
        assets = [...assets].reverse()
    }
    const height = `${fraction}svh`
    return <div style={{
        overflow: 'hidden',
        width: '100%',
    }}>
        <div className="flex flex-row flex-nowrap" style={{
            justifyContent: direction === 'right' ? 'flex-end' : 'flex-start',
            height,
            position: 'relative',
            left: direction === 'right' ? scroll : -scroll,
        }}>
            {assets.map((asset) => {
                const imageAspect = assetWidth(asset) / assetHeight(asset)
                const vw = Math.ceil(imageAspect / aspect * fraction)
                return <AssetCell
                    key={asset.id}
                    asset={asset}
                    sizes={`${vw}vw`}
                    priority={!!priority && asset.slideIndex === 0}
                    loading={asset.slideIndex <= 1 ? 'eager' : 'lazy'}
                />
            })}
        </div>
    </div >
}

function computeLines({ slides, aspect, fractions }: {
    slides: SlideAsset[][],
    aspect: number,
    fractions: readonly number[],
}) {
    const lines: SlideAsset[][] = []
    const totalFraction = fractions.reduce((a, b) => a + b, 0)
    const aspects = fractions.map(fraction => totalFraction * aspect / fraction)
    for (const a of aspects) {
        const { line, remaining } = computeLine({ slides, aspect: a })
        lines.push(line)
        slides = remaining
    }
    return lines
}

function computeLine({ slides, aspect }: {
    slides: SlideAsset[][],
    aspect: number,
}) {
    const line: SlideAsset[] = []
    const remaining: SlideAsset[][] = []
    let width = 0
    for (let idx = 0; idx < slides.length; idx++) {
        const reversed = [...slides[idx]].reverse()
        width += aspect
        while (width > 0) {
            const asset = reversed.pop()
            if (asset === undefined)
                break
            const assetAspect = assetWidth(asset) / assetHeight(asset)
            if (assetAspect > 2 * width && idx < slides.length - 1) // If less than a half of last asset fits in, stop. Unless it's the last slide.
                break
            line.push(asset)
            width -= assetAspect
        }
        remaining.push(reversed.reverse())
    }
    return { line, remaining }
}

function AssetCell({ asset, sizes, priority, loading }: {
    asset: SlideAsset,
    sizes: string,
    priority: boolean,
    loading: 'eager' | 'lazy',
}) {
    const [navigating, setNavigating] = useState(false)
    return <div style={{
        aspectRatio: `${assetWidth(asset)} / ${assetHeight(asset)}`,
        height: '100%',
        position: 'relative',
    }}>
        <Link href={hrefForAssetModal({
            pathname: asset.pathname,
            assetId: asset.id,
            includeHash: true,
        })} data-asset-id={asset.id} onClick={() => setNavigating(true)}>
            <AssetImage
                asset={asset} sizes={sizes}
                priority={priority}
                loading={loading}
                style={{
                    width: '100%',
                    height: '100%',
                }} />
        </Link>
        {navigating && <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            background: 'rgba(0, 0, 0, 0.3)',
        }}>
            <div className="text-accent animate-spin" style={{
                width: 32,
                height: 32,
                border: '3px solid currentColor',
                borderTopColor: 'transparent',
                borderRadius: '50%',
            }} />
        </div>}
    </div>
}