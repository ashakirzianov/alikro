import { SocialLinks } from "@/shared/SocialLinks"
import { Asset, assetAlt, assetHeight, assetSrc, assetWidth, assets, assetsForKind, assetsForTags } from "@/shared/assets"
import { unique } from "@/shared/utils"
import Image from "next/image"
import React, { CSSProperties } from "react"

export default function Page() {
    return <Slider>
        <MainSlide />
        <DrawingsSlide />
        <IllustrationsSlide />
        <PaintingsSlide />
        <PostersSlide />
        <CollagesSlide />
        <TattoosSlide />
    </Slider>
}

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

function Slider({ children }: {
    children: React.ReactNode[],
}) {
    return <div style={{
        scrollSnapType: 'y mandatory',
        height: '100vh',
        maxHeight: '100vh',
        overflowX: 'hidden',
        overflowY: 'auto',
        scrollPaddingTop: '0vh',
    }}>
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
