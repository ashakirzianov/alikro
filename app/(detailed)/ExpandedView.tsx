'use client'
import { AssetMetadata, assetAlt, assetHeight, assetWidth } from "@/shared/asset"
import { imageSrc } from "@/shared/image"
import React, { useEffect, useState } from "react"

type Phase = 'entering' | 'visible' | 'exiting'

export function ExpandedView({
    assets,
    assetIdx,
    originRect,
    onDismiss,
    onNavigate,
}: {
    assets: AssetMetadata[],
    assetIdx: number,
    originRect: DOMRect | null,
    onDismiss: () => void,
    onNavigate: (idx: number) => void,
}) {
    const [phase, setPhase] = useState<Phase>('entering')

    // Trigger enter animation after first paint
    useEffect(() => {
        let raf2: number
        const raf1 = requestAnimationFrame(() => {
            raf2 = requestAnimationFrame(() => setPhase('visible'))
        })
        return () => { cancelAnimationFrame(raf1); cancelAnimationFrame(raf2) }
    }, [])

    // Body scroll lock
    useEffect(() => {
        const prev = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        return () => { document.body.style.overflow = prev }
    }, [])

    // Keyboard navigation
    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            switch (e.key) {
                case 'Escape': dismiss(); break
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

    function dismiss() {
        setPhase('exiting')
        setTimeout(onDismiss, 350)
    }

    const asset = assets[assetIdx]
    const ar = assetWidth(asset) / assetHeight(asset)
    const vw = window.innerWidth
    const vh = window.innerHeight
    const finalWidth = Math.min(vw, vh * ar)
    const finalHeight = finalWidth / ar

    // FLIP: compute transform to start at the gallery tile position
    function imageTransform(): string {
        if (phase === 'visible') {
            return 'translate(-50%, -50%)'
        }
        if (originRect) {
            const dx = (originRect.left + originRect.width / 2) - vw / 2
            const dy = (originRect.top + originRect.height / 2) - vh / 2
            const scale = originRect.width / finalWidth
            return `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(${scale})`
        }
        return 'translate(-50%, -50%)'
    }

    const overlayOpacity = phase === 'visible' ? 0.85 : 0
    const imgOpacity = phase === 'exiting' ? 0 : 1
    // No transition on entering (must paint first), animate on visible/exiting
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
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 50,
                backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})`,
                transition: 'background-color 0.35s ease',
                cursor: 'zoom-out',
            }}
            onClick={dismiss}
        >
            {/* Cached thumbnail: visible immediately during the FLIP animation */}
            <img
                src={imageSrc({ fileName: asset.fileName, width: 480 })}
                alt=""
                aria-hidden
                style={sharedImgStyle}
            />
            {/* Full-res: loads in background, renders on top once ready */}
            <img
                src={imageSrc({ fileName: asset.fileName, width: 1920 })}
                alt={assetAlt(asset)}
                style={{ ...sharedImgStyle, pointerEvents: 'auto', cursor: 'zoom-out' }}
                onClick={e => e.stopPropagation()}
            />
        </div>
    )
}
