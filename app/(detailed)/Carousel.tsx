'use client'
import { useEffect, useLayoutEffect, useRef } from "react"

export function Carousel({
    count, currentIndex, onIndexChange, renderCell,
}: {
    count: number,
    currentIndex: number,
    onIndexChange: (index: number) => void,
    renderCell: (index: number) => React.ReactNode,
}) {
    const scrollRef = useRef<HTMLDivElement>(null)
    const onIndexChangeRef = useRef(onIndexChange)
    onIndexChangeRef.current = onIndexChange
    const currentIndexRef = useRef(currentIndex)

    // Scroll to the correct cell on mount and when currentIndex changes externally
    useLayoutEffect(() => {
        const el = scrollRef.current
        if (!el) return
        const targetLeft = currentIndex * el.offsetWidth
        // Only scroll if we're not already there (avoids fighting with scrollend)
        if (Math.abs(el.scrollLeft - targetLeft) > 1) {
            el.scrollLeft = targetLeft
        }
        currentIndexRef.current = currentIndex
    }, [currentIndex])

    // Detect scroll-snap settling on a new cell
    useEffect(() => {
        const el = scrollRef.current
        if (!el) return

        function handleScrollEnd() {
            const w = el!.offsetWidth
            if (w === 0) return
            const newIdx = Math.round(el!.scrollLeft / w)
            if (newIdx !== currentIndexRef.current && newIdx >= 0 && newIdx < count) {
                currentIndexRef.current = newIdx
                onIndexChangeRef.current(newIdx)
            }
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
        {Array.from({ length: count }, (_, idx) => (
            <div key={idx} style={{
                flex: '0 0 100%',
                scrollSnapAlign: 'start',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                position: 'relative',
            }}>
                {renderCell(idx)}
            </div>
        ))}
    </div>
}

export function scrollCarouselNext(el: HTMLElement) {
    el.scrollTo({ left: el.scrollLeft + el.offsetWidth, behavior: 'smooth' })
}

export function scrollCarouselPrev(el: HTMLElement) {
    el.scrollTo({ left: el.scrollLeft - el.offsetWidth, behavior: 'smooth' })
}
