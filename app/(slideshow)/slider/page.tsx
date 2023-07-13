'use client'
import { useEffect, useState } from "react"
import Image from "next/image"
import {
    Asset, assetAlt, assetHeight, assetSrc, assetWidth, assets, assetsForTags,
} from "@/shared/assets"
import { Slider } from "./Slider"

export default function Page() {
    let [scroll, setScroll] = useState(0)
    let aspect = useAspectRatio()
    let fractions = [30, 50, 20]
    let [one, two, three] = fractions
    let lines = computeLines({
        slides: [
            assetsForTags(assets, 'drawing'),
            assetsForTags(assets, 'illustration'),
            assetsForTags(assets, 'painting'),
            assetsForTags(assets, 'poster'),
            assetsForTags(assets, 'collage'),
            assetsForTags(assets, 'tattoo'),
        ],
        aspect,
        fractions,
    })
    let adjustedScroll = scroll * aspect
    return <div>
        <div className="flex flex-col" style={{
            position: 'fixed',
            width: '100vw',
            height: '100vh',
            zIndex: -1,
        }}>
            <AssetLine
                assets={lines[0]}
                scroll={adjustedScroll}
                height={`${one}dvh`}
            />
            <AssetLine
                assets={lines[1].reverse()}
                scroll={adjustedScroll}
                height={`${two}dvh`}
                direction="right"
            />
            <AssetLine
                assets={lines[2]}
                scroll={adjustedScroll}
                height={`${three}dvh`}
            />
        </div>
        <Slider onScroll={setScroll}>
            <TextSlide text="Drawings." hue={0} />
            <TextSlide text="Illustrations." hue={60} />
            <TextSlide text="Paintings." hue={120} />
            <TextSlide text="Posters." hue={240} />
            <TextSlide text="Collages." hue={180} />
            <TextSlide text="Tattoos." hue={300} />
        </Slider>
    </div>
}

function TextSlide({
    text, hue,
}: {
    text: string,
    hue: number,
}) {
    return <div style={{
        display: 'inline',
        fontSize: '10vw',
        // background: `hsl(${hue}, 100%, 50%, 1)`,
        background: `hsl(0, 100%, 50%, 1)`,
        color: 'white',
        alignSelf: 'flex-start',
        width: 'auto',
    }}>{text}</div>
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
            {assets.map((asset, i) =>
                <Image
                    key={i}
                    src={assetSrc(asset)}
                    alt={assetAlt(asset)}
                    width={assetWidth(asset)}
                    height={assetHeight(asset)}
                    style={{
                        maxHeight: '100%',
                        width: 'auto',
                    }}
                />
            )}
        </div>
    </div>
}

function computeLines({ slides, aspect, fractions }: {
    slides: Asset[][],
    aspect: number,
    fractions: number[],
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

function useAspectRatio() {
    function windowAspect() {
        return global.window ? window.innerWidth / window.innerHeight : 1
    }
    const [aspectRatio, setAspectRatio] = useState(windowAspect())

    useEffect(() => {
        function handleResize() {
            setAspectRatio(windowAspect())
        };

        window?.addEventListener('resize', handleResize)

        return () => {
            window?.removeEventListener('resize', handleResize)
        }
    }, [])

    return aspectRatio
}
