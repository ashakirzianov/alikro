import { Children, ReactNode } from "react"

export function Slider({ children, onScroll }: {
    children: ReactNode[],
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
        {Children.map(children, (child, idx) =>
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