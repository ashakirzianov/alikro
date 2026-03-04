'use client'
import { AssetMetadata } from "@/shared/asset"
import { Modal } from "@/app/(detailed)/Modal"
import { AssetImage } from "@/app/AssetImage"
import { useRouter, useSearchParams } from "next/navigation"
import React, { Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import { flushSync } from "react-dom"
import { hrefForConsole, hrefForAssetModal, hrefForAsset, filterForPathname } from "@/shared/href"
import Link from "next/link"
import { useIsClient, useShowEditButton } from "@/shared/setting"

export function OptionalModal({
    assets, pathname,
}: {
    assets: AssetMetadata[],
    pathname: string,
}) {
    return <Suspense fallback={null}>
        <OptionalModalImpl
            assets={assets}
            pathname={pathname}
        />
    </Suspense>
}

function OptionalModalImpl({
    assets, pathname,
}: {
    assets: AssetMetadata[],
    pathname: string,
}) {
    const searchParams = useSearchParams()
    const show = searchParams.get('show')
    const [showEditButton] = useShowEditButton()
    const assetIdx = assets.findIndex(asset => asset.id === show)
    if (typeof show === 'string' && assetIdx !== -1) {
        return <WorkModalImpl
            assetIdx={assetIdx}
            assets={assets}
            pathname={pathname}
            showEditButton={showEditButton}
        />
    } else {
        return null
    }
}

// How many prev/next cells to pre-render on each side of the current asset.
// Higher values let users swipe through multiple images without waiting for a reset.
const CAROUSEL_BUFFER = 3

function WorkModalImpl({
    assets, assetIdx, pathname, showEditButton,
}: {
    assetIdx: number,
    assets: AssetMetadata[],
    pathname: string,
    showEditButton: boolean,
}) {
    // centerIdx is the locally tracked center — may briefly differ from assetIdx
    // while URL is updating after a swipe
    const [centerIdx, setCenterIdx] = useState(assetIdx)
    const scrollRef = useRef<HTMLDivElement>(null)
    const prevAssetIdxRef = useRef(assetIdx)
    // Keep a ref so the scrollend listener always sees the current centerIdx
    const centerIdxRef = useRef(centerIdx)
    centerIdxRef.current = centerIdx

    const n = assets.length
    const asset = assets[centerIdx]

    const nextIdx = (centerIdx + 1) % n
    const prevIdx = (centerIdx - 1 + n) % n
    const nextLink = hrefForAssetModal({ pathname, assetId: assets[nextIdx].id })
    const prevLink = hrefForAssetModal({ pathname, assetId: assets[prevIdx].id })
    const dismissLink = pathname
    const editLink = hrefForConsole({ filter: filterForPathname(pathname), assetId: asset.id })
    const currentAssetLink = hrefForAsset({ assetId: asset.id, pathname })

    const centerScrollLeft = (el: HTMLElement) => CAROUSEL_BUFFER * el.offsetWidth

    // Set initial scroll to center cell on mount
    useLayoutEffect(() => {
        const el = scrollRef.current
        if (el) el.scrollLeft = centerScrollLeft(el)
    }, [])

    // Sync with external navigation (browser back/forward)
    useLayoutEffect(() => {
        const prev = prevAssetIdxRef.current
        if (assetIdx === prev) return
        prevAssetIdxRef.current = assetIdx
        setCenterIdx(assetIdx)
        const el = scrollRef.current
        if (el) el.scrollLeft = centerScrollLeft(el)
    }, [assetIdx])

    const router = useRouter()

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
            const newIdx = (cur + delta + n * Math.abs(delta)) % n

            // Update cells before resetting scroll to avoid a flash
            flushSync(() => setCenterIdx(newIdx))
            prevAssetIdxRef.current = newIdx
            el!.scrollLeft = centerScrollLeft(el!)

            router.push(hrefForAssetModal({ pathname, assetId: assets[newIdx].id }), { scroll: false })
        }

        el.addEventListener('scrollend', handleScrollEnd)
        return () => el.removeEventListener('scrollend', handleScrollEnd)
    }, [assets, n, pathname, router])

    // Keyboard navigation — scroll the carousel so animation plays
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            const el = scrollRef.current
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                el?.scrollTo({ left: (CAROUSEL_BUFFER + 1) * el.offsetWidth, behavior: 'smooth' })
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                el?.scrollTo({ left: (CAROUSEL_BUFFER - 1) * el.offsetWidth, behavior: 'smooth' })
            } else if (e.key === 'Escape') {
                router.push(dismissLink, { scroll: false })
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [dismissLink, router])

    const dismiss = useCallback(() => router.push(dismissLink, { scroll: false }), [router, dismissLink])

    function stopPropagation(e: React.MouseEvent) { e.stopPropagation() }

    const slideStyle: React.CSSProperties = {
        flex: '0 0 100%',
        scrollSnapAlign: 'start',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    }
    const imageStyle: React.CSSProperties = {
        objectFit: 'contain',
        maxWidth: '100svw',
        maxHeight: '100svh',
    }

    // Build the cell array: BUFFER prev cells, center, BUFFER next cells
    const cells = Array.from({ length: CAROUSEL_BUFFER * 2 + 1 }, (_, i) => {
        const delta = i - CAROUSEL_BUFFER
        const idx = (centerIdx + delta + n * CAROUSEL_BUFFER) % n
        return { idx, delta }
    })

    return <Modal onDismiss={dismiss}>
        {/* Scroll-snap carousel */}
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
            }}
        >
            {cells.map(({ idx, delta }) => (
                <div key={delta} style={slideStyle}>
                    {delta === 0
                        ? <Link href={currentAssetLink} onClick={stopPropagation}>
                            <AssetImage asset={assets[idx]} sizes="100vw" style={imageStyle} />
                        </Link>
                        : <AssetImage asset={assets[idx]} sizes="100vw" style={imageStyle} />
                    }
                </div>
            ))}
        </div>

        {/* Navigation buttons — scroll the carousel instead of navigating directly
            so that the slide animation plays; scrollend handles the URL update */}
        <div className="absolute top-0 bottom-0 left-4 flex items-center justify-between" onClick={stopPropagation}>
            <RoundButton
                href={prevLink}
                label="Previous work"
                className="m-4"
                onClick={(e) => {
                    e.preventDefault()
                    const el = scrollRef.current
                    if (el) el.scrollTo({ left: (CAROUSEL_BUFFER - 1) * el.offsetWidth, behavior: 'smooth' })
                }}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="square" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
            </RoundButton>
        </div>

        <div className="absolute top-0 bottom-0 right-4 flex items-center justify-between" onClick={stopPropagation}>
            <RoundButton
                href={nextLink}
                label="Next work"
                className="m-4"
                onClick={(e) => {
                    e.preventDefault()
                    const el = scrollRef.current
                    if (el) el.scrollTo({ left: (CAROUSEL_BUFFER + 1) * el.offsetWidth, behavior: 'smooth' })
                }}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="square" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </RoundButton>
        </div>

        {/* Close button */}
        <RoundButton href={dismissLink} label="Close modal" className="absolute top-4 right-4" onClick={stopPropagation}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="square" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
        </RoundButton>

        {/* Edit button */}
        {showEditButton && <EditButton editLink={editLink} />}
    </Modal>
}

function RoundButton({ href, label, className, onClick, children }: {
    href: string,
    label: string,
    className?: string,
    onClick?: React.MouseEventHandler<HTMLAnchorElement>,
    children: React.ReactNode,
}) {
    return <Link
        href={href}
       
        className={`p-2 text-accent rounded-full transition-all duration-150 hover:scale-110 ${className ? ` ${className}` : ''}`}
        aria-label={label}
        onClick={onClick}
    >
        {children}
    </Link>
}

function EditButton({ editLink }: { editLink: string }) {
    const isClient = useIsClient()
    if (!isClient) {
        return null
    }
    return <RoundButton
        href={editLink}
        label="Edit work"
        className="absolute top-4 left-4"
       
        onClick={e => e.stopPropagation()}
    >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-6 w-6">
            <path strokeLinecap="square" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
        </svg>
    </RoundButton>
}