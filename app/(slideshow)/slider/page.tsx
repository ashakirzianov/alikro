import { Asset, assetAlt, assetHeight, assetSrc, assetWidth, assets } from "@/shared/assets"
import { unique } from "@/shared/utils"
import Image from "next/image"
import { CSSProperties } from "react"

export default function Page() {
    return <ColorSlide
        assets={assets}
        color="white"
        background="hsl(300 100% 50% / 1)"
        title="I am Alikro, an artist."
        text="I do digital illustrations, paintings, drawings, tattoos, you name it."
    />
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
        }}>
            <div className="pr-[0vw] py-[30vh]">
                <span style={{
                    ...textStyle,
                    fontStyle: 'italic',
                    fontSize: '10vw',
                }}>{title}</span>
                <br />
                <span style={textStyle}>{text}</span>
            </div>
        </div>
    </Slide>
}

function Slide({ assets, Layout, children }: {
    assets: Asset[],
    children?: React.ReactNode,
    Layout: React.ComponentType<{ children: React.ReactNode[] }>,
}) {
    return <div>
        <div style={{
            position: 'absolute',
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
            position: 'absolute',
            display: 'flex',
            width: '100vw',
            height: '100vh',
            zIndex: 2,
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
        height: '100vh',
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
