import { unique } from "@/shared/utils"
import { ReactNode } from "react"


export function GridLayout({ template, children }: {
    template: string[],
    children: ReactNode[]
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

export function PrettyLayout({ children }: {
    children: ReactNode[]
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