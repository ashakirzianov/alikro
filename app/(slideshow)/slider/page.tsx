'use client'
import { SocialLinks } from "@/shared/SocialLinks"
import { Asset, assetAlt, assetHeight, assetSrc, assetWidth, assets, assetsForKind, assetsForTags } from "@/shared/assets"
import { unique } from "@/shared/utils"
import Image from "next/image"
import React, { CSSProperties, useEffect, useState } from "react"

export default function Page() {
    let [scroll, setScroll] = React.useState(0)
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
    const textStyle: CSSProperties = {
        display: 'inline',
        fontSize: '10vw',
        // WebkitTextStroke: '2px white',
        // background: 'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.6) 80%, rgba(255,255,255,0) 100%)',
        background: 'hsl(0, 80%, 80%, 0.6)',
        alignSelf: 'flex-start',
        width: 'auto',
    }
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
        console.log(`slide: ${slide[0].kind}, count: ${slide.length}`)
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
    const [aspectRatio, setAspectRatio] = useState(window.innerWidth / window.innerHeight)

    useEffect(() => {
        function handleResize() {
            setAspectRatio(window.innerWidth / window.innerHeight)
        };

        window.addEventListener('resize', handleResize)

        // Clean up the event listener when the component unmounts
        return () => {
            window.removeEventListener('resize', handleResize)
        }
    }, []) // Empty dependency array means this effect runs once on mount and clean up on unmount

    return aspectRatio
};

function MainSlide() {
    let background = 'hsl(331 82% 58% / 0.8)'
    return <Slide assets={assetsForTags(assets, 'selfportrait')} Layout={PrettyLayout}>
        <div style={{
            display: 'flex',
            justifyContent: 'flex-start',
            alignItems: 'flex-start',
            width: '100%',
            height: '100%',
        }}>
            <div className="ml-[0vw] my-[50vh] p-4" style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                // backgroundColor: 'white',
                color: 'white',
                height: 'auto',
            }}>
                <span style={{
                    fontStyle: 'italic',
                    fontSize: '6vw',
                    background,
                }}>I am Alikro, an artist.</span>
                <br />
                <span style={{
                    fontSize: '3vw',
                    background,
                    // WebkitTextStroke: `1px white`,
                }}>Here you can find my works across many mediums that I created throughout the years. Contact me if you&apos;re interested in any of the works or if you would like to work with me.</span>
                <div className="flex flex-row space-x-4 my-4" style={{
                    // background: 'hsl(0 100% 100% / 0.8)',
                    background: 'white',
                }}>
                    <SocialLinks />
                </div>
            </div>
        </div>
    </Slide>
}

function DrawingsSlide() {
    return <ColorSlide
        assets={assetsForKind(assets, 'drawing')}
        color="white"
        background="hsl(60 100% 50% / 0.8)"
        title="Drawings."
        text="I've been drawing for about 20 years now, and I love it."
    />
}

function IllustrationsSlide() {
    return <ColorSlide
        assets={assetsForKind(assets, 'illustration')}
        color="white"
        background="hsl(120 100% 50% / 0.8)"
        title="Illustrations."
        text="I've been doing professional illustration for about 10 years now."
    />
}

function PaintingsSlide() {
    return <ColorSlide
        assets={assetsForKind(assets, 'painting')}
        color="white"
        background="hsl(0 100% 50% / 0.8)"
        title="Paintings."
        text="I've been painting for about 15 years now, and I love it."
    />
}

function PostersSlide() {
    return <ColorSlide
        assets={assetsForKind(assets, 'poster')}
        color="white"
        background="hsl(90 100% 50% / 0.8)"
        title="Posters."
        text="I've been doing posters for about 10 years now."
    />
}

function CollagesSlide() {
    return <ColorSlide
        assets={assetsForKind(assets, 'collage')}
        color="white"
        background="hsl(210 100% 50% / 0.8)"
        title="Collages."
        text="Ever since I was in a kindergarden and glued some pieces together I enjoyed making collages."
    />
}

function TattoosSlide() {
    return <ColorSlide
        assets={assetsForKind(assets, 'tattoo')}
        color="white"
        background="hsl(40 100% 50% / 0.8)"
        title="Tattoos."
        text="I started tattoo fairly recently, just over a year ago, and it's a lot of fun! I am thrilled to put my art on people's skin."
    />
}

function Slider({ children, onScroll }: {
    children: React.ReactNode[],
    onScroll?: (value: number) => void,
}) {
    return <div style={{
        scrollSnapType: 'y mandatory',
        height: '100vh',
        maxHeight: '100vh',
        overflowX: 'hidden',
        overflowY: 'auto',
        scrollPaddingTop: '0vh',
    }}
        onScroll={e => {
            if (onScroll) {
                onScroll(e.currentTarget.scrollTop)
            }
        }}
    >
        {React.Children.map(children, (child, idx) =>
            <section key={idx} style={{
                scrollSnapAlign: 'start',
                scrollSnapStop: 'always',
                width: '100vw',
                height: '100vh',
            }}>
                {child}
            </section>)}
    </div>
}

function ColorSlide({
    assets, color, background, title, text,
}: {
    assets: Asset[],
    color: string,
    background: string,
    title: string,
    text: string,
}) {
    const textStyle: CSSProperties = {
        background,
        color,
    }
    return <Slide assets={assets} Layout={PrettyLayout}>
        <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            width: '100%',
            height: '100%',
            // border: `5px solid ${background}`,
        }}>
            <div className="pr-[0vw] py-[30vh]">
                <span style={{
                    ...textStyle,
                    fontStyle: 'italic',
                    fontSize: '10vw',
                }}>{title}</span>
                <br />
                <span style={{
                    ...textStyle,
                    fontSize: '3vw',
                }}>{text}</span>
            </div>
        </div>
    </Slide>
}

function Slide({ assets, Layout, children }: {
    assets: Asset[],
    children?: React.ReactNode,
    Layout: React.ComponentType<{ children: React.ReactNode[] }>,
}) {
    return <div style={{
        display: 'grid',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
    }}>
        <div style={{
            gridArea: '1 / 1 / 2 / 2',
            width: '100vw',
            height: '100vh',
        }}>
            <Layout>
                {assets.map((asset) =>
                    <Image
                        key={asset.name}
                        src={assetSrc(asset)}
                        alt={assetAlt(asset)}
                        width={assetWidth(asset)}
                        height={assetHeight(asset)}
                        style={{
                            objectFit: 'cover',
                            minWidth: '100%',
                            minHeight: '100%',
                        }}
                    />
                )}
            </Layout>
        </div>
        <div style={{
            gridArea: '1 / 1 / 2 / 2',
            width: '100vw',
            height: '100vh',
        }}>
            {children}
        </div>
    </div>
}

function PrettyLayout({ children }: {
    children: React.ReactNode[]
}) {
    return <GridLayout template={[
        "a a b b c c c c c",
        "a a b b c c c c c",
        "d d d d c c c c c",
        "d d d d c c c c c",
        "d d d d c c c c c",
        "e e e f f f g g g",
        "e e e f f f g g g",
        "e e e f f f g g g",
    ]}>
        {children}
    </GridLayout>
}

function GridLayout({ template, children }: {
    template: string[],
    children: React.ReactNode[]
}) {
    const splited = template.map(t => t.split(' '))
    const areas = unique(
        splited.flat(),
        (a, b) => a === b,
    )
    const cols = splited[0]!.length
    const rows = splited.length
    const gridTemplateAreas = template.map(s => `"${s}"`).join('\n')
    return <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gridTemplateRows: `repeat(${rows}, 1fr)`,
        gridTemplateAreas,
        height: '100%',
        width: '100%',
        overflow: 'hidden',
    }}>
        {
            areas.map((area, idx) =>
                <div key={area} style={{
                    gridArea: area,
                }}>{children[idx]}</div>
            )}
    </div>
}
