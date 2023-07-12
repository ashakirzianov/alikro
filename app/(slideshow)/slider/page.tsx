import { Asset, assetAlt, assetHeight, assetSrc, assetWidth, assets } from "@/shared/assets"
import { unique } from "@/shared/utils"
import Image from "next/image"

export default function Page() {
    return <Slide assets={assets} Layout={PrettyLayout} />
}

function Slide({ Layout }: {
    assets: Asset[],
    Layout: React.ComponentType<{ children: React.ReactNode[] }>,
}) {
    return <Layout>
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
