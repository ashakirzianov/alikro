import { AssetImage } from "@/shared/AssetImage"
import {
    Asset, assetHeight, assetWidth,
} from "@/shared/assets"

export function DynamicLayout({
    slides, aspect, fractions, scroll,
}: {
    slides: Asset[][],
    aspect: number,
    fractions: readonly [number, number, number],
    scroll: number,
}) {
    let [one, two, three] = fractions
    let lines = computeLines({
        slides,
        aspect,
        fractions,
    })
    return <>
        <AssetLine
            assets={lines[0]}
            scroll={scroll}
            height={`${one}dvh`}
        />
        <AssetLine
            assets={lines[1].reverse()}
            scroll={scroll}
            height={`${two}dvh`}
            direction="right"
        />
        <AssetLine
            assets={lines[2]}
            scroll={scroll}
            height={`${three}dvh`}
        />
    </>
}

function AssetLine({ assets, scroll, height, direction }: {
    assets: Asset[],
    scroll: number,
    height: string,
    direction?: 'left' | 'right',
}) {
    return <div style={{
        overflow: 'hidden',
        width: '100vw',
    }}>
        <div className="flex flex-row flex-nowrap" style={{
            justifyContent: direction === 'right' ? 'flex-end' : 'flex-start',
            height,
            position: 'relative',
            left: direction === 'right' ? scroll : -scroll,
        }}>
            {assets.map((asset) =>
                <AssetImage
                    key={asset.name}
                    asset={asset}
                    style={{
                        maxHeight: '100%',
                    }}
                />
            )}
        </div>
    </div>
}

function computeLines({ slides, aspect, fractions }: {
    slides: Asset[][],
    aspect: number,
    fractions: readonly number[],
}) {
    let lines: Asset[][] = []
    let totalFraction = fractions.reduce((a, b) => a + b, 0)
    let aspects = fractions.map(fraction => totalFraction * aspect / fraction)
    for (let a of aspects) {
        let { line, remaining } = computeLine({ slides, aspect: a })
        lines.push(line)
        slides = remaining
    }
    return lines
}

function computeLine({ slides, aspect }: {
    slides: Asset[][],
    aspect: number,
}) {
    let line: Asset[] = []
    let remaining: Asset[][] = []
    let width = 0
    for (let slide of slides) {
        let reversed = [...slide].reverse()
        width += aspect
        while (width > 0) {
            let asset = reversed.pop()
            if (asset === undefined)
                break
            let assetAspect = assetWidth(asset) / assetHeight(asset)
            line.push(asset)
            width -= assetAspect
        }
        remaining.push(reversed.reverse())
    }
    return { line, remaining }
}