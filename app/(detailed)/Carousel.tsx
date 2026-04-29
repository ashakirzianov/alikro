'use client'
import { useEffect, useLayoutEffect, useRef, useState } from "react"

const PRELOAD_BUFFER = 3

export function Carousel({
    count, currentIndex, onIndexChange, renderCell,
}: {
    count: number,
    currentIndex: number,
    onIndexChange: (index: number) => void,
    renderCell: (index: number, nearCurrent: boolean) => React.ReactNode,
}) {
    const scrollRef = useRef<HTMLDivElement>(null)
    const onIndexChangeRef = useRef(onIndexChange)
    onIndexChangeRef.current = onIndexChange

    // visualIndex drives nearCurrent for preloading. Updated locally on
    // scroll, so we don't depend on the URL round-trip to re-render.
    const [visualIndex, setVisualIndex] = useState(currentIndex)
    const visualIndexRef = useRef(visualIndex)
    visualIndexRef.current = visualIndex

    // Track whether the last index change came from scrolling, so the
    // external sync effect doesn't fight with us.
    const scrollOriginRef = useRef(false)

    // Hide the carousel until the scroll position is set correctly
    const [positioned, setPositioned] = useState(currentIndex === 0)

    const centerScrollLeft = (el: HTMLElement, idx: number) => idx * el.offsetWidth

    // Sync with external navigation (browser back/forward)
    useLayoutEffect(() => {
        if (scrollOriginRef.current) {
            scrollOriginRef.current = false
            return
        }
        setVisualIndex(currentIndex)
        const el = scrollRef.current
        if (!el) return
        const targetLeft = centerScrollLeft(el, currentIndex)
        if (Math.abs(el.scrollLeft - targetLeft) > 1) {
            el.scrollLeft = targetLeft
        }
        setPositioned(true)
    }, [currentIndex])

    // Detect scroll-snap settling on a new cell
    useEffect(() => {
        const el = scrollRef.current
        if (!el) return

        function handleScrollEnd() {
            const w = el!.offsetWidth
            if (w === 0) return
            const newIdx = Math.round(el!.scrollLeft / w)
            if (newIdx === visualIndexRef.current) return
            if (newIdx < 0 || newIdx >= count) return

            scrollOriginRef.current = true
            visualIndexRef.current = newIdx
            setVisualIndex(newIdx)
            onIndexChangeRef.current(newIdx)
        }

        el.addEventListener('scrollend', handleScrollEnd)
        return () => el.removeEventListener('scrollend', handleScrollEnd)
    }, [count])

    // Keyboard navigation
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            const el = scrollRef.current
            if (!el) return
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                el.scrollTo({ left: el.scrollLeft + el.offsetWidth, behavior: 'smooth' })
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                el.scrollTo({ left: el.scrollLeft - el.offsetWidth, behavior: 'smooth' })
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    return <>
        {!positioned && <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
        }}>
            <Spinner />
        </div>}
        <div
            ref={scrollRef}
            className="carousel-scroll"
            style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                overflowX: 'scroll',
                scrollSnapType: 'x mandatory',
                overscrollBehaviorX: 'contain',
                visibility: positioned ? 'visible' : 'hidden',
            }}
        >
            {Array.from({ length: count }, (_, idx) => (
                <div key={idx} style={{
                    flex: '0 0 100%',
                    scrollSnapAlign: 'start',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    position: 'relative',
                }}>
                    {renderCell(idx, Math.abs(idx - visualIndex) <= PRELOAD_BUFFER)}
                </div>
            ))}
        </div>
    </>
}

function Spinner() {
    return <div className="text-accent animate-spin" style={{
        width: 32,
        height: 32,
        border: '3px solid currentColor',
        borderTopColor: 'transparent',
        borderRadius: '50%',
    }} />
}

export function scrollCarouselNext(el: HTMLElement) {
    el.scrollTo({ left: el.scrollLeft + el.offsetWidth, behavior: 'smooth' })
}

export function scrollCarouselPrev(el: HTMLElement) {
    el.scrollTo({ left: el.scrollLeft - el.offsetWidth, behavior: 'smooth' })
}
