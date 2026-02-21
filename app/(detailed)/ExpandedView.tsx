'use client'
import { AssetMetadata, assetAlt, assetHeight, assetWidth } from "@/shared/asset"
import { imageSrc } from "@/shared/image"
import { useIsClient } from "@/shared/setting"
import React, { useEffect, useRef, useState } from "react"

type Phase = 'entering' | 'visible' | 'exiting'

const SCROLL_THRESHOLD = 150

type ExpandedViewProps = {
    assets: AssetMetadata[],
    assetIdx: number,
    originRect: DOMRect | null,
    onDismiss: () => void,
    onNavigate: (idx: number) => void,
}

export function ExpandedView(props: ExpandedViewProps) {
    const isClient = useIsClient()
    if (!isClient) return null
    return <ExpandedViewImpl {...props} />
}

function ExpandedViewImpl({
    assets,
    assetIdx,
    originRect,
    onDismiss,
    onNavigate,
}: ExpandedViewProps) {
    const [phase, setPhase] = useState<Phase>('entering')
    const overlayRef = useRef<HTMLDivElement>(null)
    const thumbnailRef = useRef<HTMLImageElement>(null)
    const fullResRef = useRef<HTMLImageElement>(null)
    const dismissingRef = useRef(false)
    const dismissViaInteractionRef = useRef<() => void>(() => { })

    const asset = assets[assetIdx]
    const ar = assetWidth(asset) / assetHeight(asset)
    const vw = window.innerWidth
    const vh = window.innerHeight
    const finalWidth = Math.min(vw, vh * ar)
    const finalHeight = finalWidth / ar

    // FLIP params — stable for the lifetime of this component
    const flipRef = useRef({ dx: 0, dy: 0, scale: 1 })
    if (originRect) {
        flipRef.current = {
            dx: (originRect.left + originRect.width / 2) - vw / 2,
            dy: (originRect.top + originRect.height / 2) - vh / 2,
            scale: originRect.width / finalWidth,
        }
    }

    // Enter animation: paint at gallery position first, then transition to center
    useEffect(() => {
        let raf2: number
        const raf1 = requestAnimationFrame(() => {
            raf2 = requestAnimationFrame(() => setPhase('visible'))
        })
        return () => { cancelAnimationFrame(raf1); cancelAnimationFrame(raf2) }
    }, [])

    // Scroll-to-dismiss: track scroll and animate image toward origin via direct DOM manipulation
    useEffect(() => {
        const startY = window.scrollY

        function setImgsTransform(transform: string) {
            for (const img of [thumbnailRef.current, fullResRef.current]) {
                if (img) {
                    img.style.transition = 'none'
                    img.style.transform = transform
                }
            }
        }

        function onScroll() {
            if (dismissingRef.current) return
            const delta = window.scrollY - startY
            const t = Math.abs(delta) / SCROLL_THRESHOLD
            if (t >= 1) {
                // Threshold crossed — dismiss immediately (image is back at its tile)
                dismissingRef.current = true
                onDismiss()
                return
            }

            // Interpolate toward origin, accounting for tile moving with the scroll
            const { dx, dy, scale } = flipRef.current
            const tx = dx * t
            const ty = (dy - delta) * t
            const s = 1 + (scale - 1) * t
            setImgsTransform(
                `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(${s})`
            )
            if (overlayRef.current) {
                overlayRef.current.style.transition = 'none'
                overlayRef.current.style.backgroundColor = `rgba(0, 0, 0, ${0.85 * (1 - t)})`
            }
        }

        window.addEventListener('scroll', onScroll, { passive: true })
        return () => window.removeEventListener('scroll', onScroll)
    }, [onDismiss])

    // Keyboard navigation
    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            switch (e.key) {
                case 'Escape': dismissViaInteractionRef.current(); break
                case 'ArrowRight':
                case 'ArrowDown':
                    onNavigate((assetIdx + 1) % assets.length); break
                case 'ArrowLeft':
                case 'ArrowUp':
                    onNavigate((assetIdx - 1 + assets.length) % assets.length); break
            }
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [assetIdx, assets.length, onNavigate])

    function dismissViaInteraction() {
        if (dismissingRef.current) return
        dismissingRef.current = true
        setPhase('exiting')
        setTimeout(onDismiss, 350)
    }
    dismissViaInteractionRef.current = dismissViaInteraction

    // React-controlled transform (only for enter/exit phases; scroll overrides via refs)
    function imageTransform(): string {
        if (phase === 'entering' && originRect) {
            const { dx, dy, scale } = flipRef.current
            return `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(${scale})`
        }
        return 'translate(-50%, -50%)'
    }

    const overlayOpacity = phase === 'visible' ? 0.85 : 0
    const imgOpacity = phase === 'exiting' ? 0 : 1
    const imgTransition = phase === 'entering'
        ? 'none'
        : 'transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.25s ease'

    const sharedImgStyle: React.CSSProperties = {
        position: 'fixed',
        top: '50%',
        left: '50%',
        width: `${finalWidth}px`,
        height: `${finalHeight}px`,
        objectFit: 'contain',
        transform: imageTransform(),
        transition: imgTransition,
        opacity: imgOpacity,
        userSelect: 'none',
        pointerEvents: 'none',
    }

    return (
        <div
            ref={overlayRef}
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 50,
                backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})`,
                transition: 'background-color 0.35s ease',
                cursor: 'zoom-out',
            }}
            onClick={dismissViaInteraction}
        >
            {/* Cached thumbnail: visible immediately during the FLIP animation */}
            <img  // eslint-disable-line @next/next/no-img-element
                ref={thumbnailRef}
                src={imageSrc({ fileName: asset.fileName, width: 480 })}
                alt=""
                aria-hidden
                style={sharedImgStyle}
            />
            {/* Full-res: loads in background, renders on top once ready */}
            <img  // eslint-disable-line @next/next/no-img-element
                ref={fullResRef}
                src={imageSrc({ fileName: asset.fileName, width: 1920 })}
                alt={assetAlt(asset)}
                style={{ ...sharedImgStyle, pointerEvents: 'auto', cursor: 'zoom-out' }}
                onClick={e => e.stopPropagation()}
            />
        </div>
    )
}
