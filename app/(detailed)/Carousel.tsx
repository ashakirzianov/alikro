'use client'
import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { flushSync } from "react-dom"

// How many prev/next cells to pre-render on each side of the current cell.
const CAROUSEL_BUFFER = 3

export function Carousel({
    count, currentIndex, onIndexChange, renderCell,
}: {
    count: number,
    currentIndex: number,
    onIndexChange: (index: number) => void,
    renderCell: (index: number, isCurrent: boolean) => React.ReactNode,
}) {
    const [centerIdx, setCenterIdx] = useState(currentIndex)
    const scrollRef = useRef<HTMLDivElement>(null)
    const prevIndexRef = useRef(currentIndex)
    const centerIdxRef = useRef(centerIdx)
    centerIdxRef.current = centerIdx

    const centerScrollLeft = (el: HTMLElement) => CAROUSEL_BUFFER * el.offsetWidth

    // Set initial scroll to center cell on mount
    useLayoutEffect(() => {
        const el = scrollRef.current
        if (el) el.scrollLeft = centerScrollLeft(el)
    }, [])

    // Sync with external navigation (browser back/forward)
    useLayoutEffect(() => {
        const prev = prevIndexRef.current
        if (currentIndex === prev) return
        prevIndexRef.current = currentIndex
        setCenterIdx(currentIndex)
        const el = scrollRef.current
        if (el) el.scrollLeft = centerScrollLeft(el)
    }, [currentIndex])

    // Detect when scroll snaps off-center, then swap cells and reset scroll
    useEffect(() => {
        const el = scrollRef.current
        if (!el) return

        function handleScrollEnd() {
            const w = el!.offsetWidth
            const pos = Math.round(el!.scrollLeft / w)
            const delta = pos - CAROUSEL_BUFFER
            if (delta === 0) return

            const cur = centerIdxRef.current
            const newIdx = (cur + delta + count * Math.abs(delta)) % count

            flushSync(() => setCenterIdx(newIdx))
            prevIndexRef.current = newIdx
            el!.scrollLeft = centerScrollLeft(el!)

            onIndexChange(newIdx)
        }

        el.addEventListener('scrollend', handleScrollEnd)
        return () => el.removeEventListener('scrollend', handleScrollEnd)
    }, [count, onIndexChange])

    // Keyboard navigation
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            const el = scrollRef.current
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                el?.scrollTo({ left: (CAROUSEL_BUFFER + 1) * el.offsetWidth, behavior: 'smooth' })
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                el?.scrollTo({ left: (CAROUSEL_BUFFER - 1) * el.offsetWidth, behavior: 'smooth' })
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    const cells = Array.from({ length: CAROUSEL_BUFFER * 2 + 1 }, (_, i) => {
        const delta = i - CAROUSEL_BUFFER
        const idx = (centerIdx + delta + count * CAROUSEL_BUFFER) % count
        return { idx, delta }
    })

    return <div
        ref={scrollRef}
        className="carousel-scroll"
        style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            overflowX: 'scroll',
            scrollSnapType: 'x mandatory',
            overscrollBehaviorX: 'contain',
        }}
    >
        {cells.map(({ idx, delta }) => (
            <div key={delta} style={{
                flex: '0 0 100%',
                scrollSnapAlign: 'start',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
            }}>
                {renderCell(idx, delta === 0)}
            </div>
        ))}
    </div>
}

export function scrollCarouselNext(el: HTMLElement) {
    el.scrollTo({ left: (CAROUSEL_BUFFER + 1) * el.offsetWidth, behavior: 'smooth' })
}

export function scrollCarouselPrev(el: HTMLElement) {
    el.scrollTo({ left: (CAROUSEL_BUFFER - 1) * el.offsetWidth, behavior: 'smooth' })
}
