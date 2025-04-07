'use client'
import { AssetImage } from "@/shared/AssetImage"
import Link from "next/link"
import dynamic from 'next/dynamic'
import { ReactNode, useEffect, useState } from "react"
import { BehanceLink, InstagramLink, MailLink } from "@/shared/SocialLinks"
import { Slider } from "./Slider"
import { assetHeight, AssetMetadata, assetWidth } from "@/shared/assets"
import { hrefForAsset } from "@/shared/href"

export const ClientsideDynamicPage = dynamic(() => Promise.resolve(DynamicPage), {
    ssr: false,
})

function DynamicPage({ slides }: {
    slides: AssetMetadata[][],
}) {
    const [scroll, setScroll] = useState(0)
    const aspect = useAspectRatio()
    const corner = <div className="flex flex-row">
        <div className="bg-accent hover:bg-white">
            <div className="p-4 invert brightness-0 hover:invert-0 hover:brightness-0">
                <InstagramLink />
            </div>
        </div>
        <div className="bg-accent hover:bg-white">
            <div className="p-4 invert brightness-0 hover:invert-0 hover:brightness-0">
                <BehanceLink />
            </div>
        </div>
        <div className="bg-accent hover:bg-white">
            <div className="p-4 invert brightness-0 hover:invert-0 hover:brightness-0">
                <MailLink />
            </div>
        </div>
    </div>
    return <div style={{
        display: 'grid',
        gridTemplateAreas: 'center',
    }}>
        <div className="flex flex-col" style={{
            width: '100svw',
            height: '100svh',
            gridArea: 'center',
            zIndex: 1,
        }}>
            <DynamicLayout
                slides={slides}
                aspect={aspect}
                // fractions={[30, 40, 30]}
                // fractions={[25, 50, 25]}
                fractions={[50, 30, 20]}
                scroll={scroll}
            />
        </div>
        <div style={{
            gridArea: 'center',
            zIndex: 2,
        }}>
            <Slider onScroll={setScroll}>
                <TextSlide text="Alikro, an artist." href='/about' corner={corner} />
                <TextSlide text="Drawings." href='/drawings' />
                <TextSlide text="Illustrations." href='/illustrations' />
                <TextSlide text="Paintings." href='/paintings' />
                <TextSlide text="Posters." href='/posters' />
                <TextSlide text="Collages." href='/collages' />
                <TextSlide text="Tattoos." href='/tattoos' />
            </Slider>
        </div>
    </div>
}

function TextSlide({
    text, href, corner
}: {
    text: string,
    href: string,
    corner?: ReactNode,
}) {
    return <div className="flex flex-col py-[8svh] justify-between h-full cursor-pointer" onClick={() => {
        window.location.href = href
    }}>
        <div>
            {/* TODO: make this a Link (once I figure out how to make it work with the slider) */}
            <a href={href} className="inline text-9xl bg-accent text-white mt-[30svh] self-start text-[min(12svw,10svh)] hover:bg-white hover:text-black">{text}</a>
        </div>
        {corner ? <div className="self-end">{corner}</div> : null}
    </div>
}

function useAspectRatio() {
    function windowAspect() {
        if (!global?.document?.documentElement)
            return 1
        const { scrollWidth, scrollHeight } = document.documentElement
        return (scrollWidth) / (scrollHeight)
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

function DynamicLayout({
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
            height={`${two}svh`}
        />
        <AssetLine
            assets={lines[0]}
            scroll={scroll * aspect}
            height={`${one}svh`}
            direction="right"
        />
        <AssetLine
            assets={lines[2]}
            scroll={scroll * aspect}
            height={`${three}svh`}
        />
    </>
}

function AssetLine({ assets, scroll, height, direction }: {
    assets: AssetMetadata[],
    scroll: number,
    height: string,
    direction?: 'left' | 'right',
}) {
    if (direction === 'right') {
        assets = [...assets].reverse()
    }
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
            {assets.map((asset, idx) =>
                <Link key={idx} href={hrefForAsset(asset)} style={{
                    aspectRatio: `${assetWidth(asset)} / ${assetHeight(asset)}`,
                    height: '100%',
                }}>
                    <AssetImage asset={asset} size="medium" />
                </Link>
            )}
        </div>
    </div>
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