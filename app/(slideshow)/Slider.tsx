import { Children, ReactNode } from "react"

export function Slider({ children, onScroll }: {
    children: ReactNode[],
    onScroll?: (value: number) => void,
}) {
    return <div style={{
        scrollSnapType: 'y mandatory',
        height: '100svh',
        maxHeight: '100svh',
        overflowX: 'hidden',
        overflowY: 'auto',
        scrollPaddingTop: '0svh',
    }}
        onScroll={e => {
            if (onScroll) {
                onScroll(e.currentTarget.scrollTop)
            }
        }}
    >
        {Children.map(children, (child, idx) =>
            <section key={idx} style={{
                scrollSnapAlign: 'start',
                scrollSnapStop: 'always',
                width: '100svw',
                height: '100svh',
            }}>
                {child}
            </section>)}
    </div>
}