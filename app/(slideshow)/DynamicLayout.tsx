import { AssetImage } from "@/app/AssetImage"
import { assetHeight, AssetMetadata, assetWidth } from "@/shared/assets"
import { hrefForAsset } from "@/shared/href"
import Link from "next/link"

export function DynamicLayout({
    slides, aspect, fractions, scroll,
}: {
    slides: AssetMetadata[][],
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
        />
        <AssetLine
            assets={lines[2]}
            scroll={scroll * aspect}
            fraction={three}
            aspect={aspect}
        />
    </>
}

function AssetLine({ assets, scroll, fraction, aspect, direction }: {
    assets: AssetMetadata[],
    scroll: number,
    fraction: number
    aspect: number
    direction?: 'left' | 'right',
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
                return <div key={asset.id} style={{
                    aspectRatio: `${assetWidth(asset)} / ${assetHeight(asset)}`,
                    height: '100%',
                }}
                >
                    <Link href={hrefForAsset({
                        assetId: asset.id,
                    })}>
                        <AssetImage asset={asset} sizes={`${vw}vw`} style={{
                            width: '100%',
                            height: '100%',
                        }} />
                    </Link>
                </div>
            })}
        </div>
    </div >
}

function computeLines({ slides, aspect, fractions }: {
    slides: AssetMetadata[][],
    aspect: number,
    fractions: readonly number[],
}) {
    const lines: AssetMetadata[][] = []
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
    slides: AssetMetadata[][],
    aspect: number,
}) {
    const line: AssetMetadata[] = []
    const remaining: AssetMetadata[][] = []
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