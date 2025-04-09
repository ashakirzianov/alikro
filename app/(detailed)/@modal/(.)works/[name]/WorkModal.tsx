'use client'
import { AssetMetadata, assetsForPath } from "@/shared/assets"
import { Modal } from "@/shared/Modal"
import { AssetImage } from "@/shared/AssetImage"
import { useRouter, useSearchParams } from "next/navigation"
import React, { useCallback, useEffect, useMemo, useState } from "react"
import { hrefForAsset } from "@/shared/href"
import { allSections } from "@/shared/sections"

export function WorkModal({ asset, allAssets }: {
    asset: AssetMetadata,
    allAssets: AssetMetadata[],
}) {
    const searchParams = useSearchParams()
    const from = searchParams.get('from') ?? 'all'
    const search = searchParams.toString()
    const router = useRouter()
    const [dismissed, setDismissed] = useState(false)
    const dismiss = useCallback(function dismiss() {
        router.push(`/${from}`)
        setDismissed(true)
    }, [router, from])

    // Find next and previous assets
    const filteredAssets = useFilteredAssets(allAssets)
    const currentIndex = filteredAssets.findIndex(a => a.id === asset.id)

    const navigateToNextAsset = React.useCallback(() => {
        if (currentIndex === -1 || filteredAssets.length <= 1) return
        const nextIndex = (currentIndex + 1) % filteredAssets.length
        const nextAsset = filteredAssets[nextIndex]
        router.push(`${hrefForAsset(nextAsset)}?${search}`)
    }, [currentIndex, filteredAssets, router, search])

    const navigateToPrevAsset = React.useCallback(() => {
        if (currentIndex === -1 || filteredAssets.length <= 1) return
        const prevIndex = (currentIndex - 1 + filteredAssets.length) % filteredAssets.length
        const prevAsset = filteredAssets[prevIndex]
        router.push(`${hrefForAsset(prevAsset)}?${search}`)
    }, [currentIndex, filteredAssets, router, search])

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                navigateToNextAsset()
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                navigateToPrevAsset()
            } else if (e.key === 'Escape') {
                dismiss()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [navigateToNextAsset, navigateToPrevAsset, dismiss])

    if (dismissed) {
        return null
    }

    return <Modal onDismiss={dismiss}>
        <div className="relative" onClick={e => e.stopPropagation()}>
            <div>
                <AssetImage
                    asset={asset}
                    size="full"
                    style={{
                        objectFit: 'contain',
                        maxWidth: '100svw',
                        maxHeight: '100svh',
                        cursor: 'default'
                    }}
                />
            </div>

            {/* Navigation buttons */}
            <div className="absolute inset-0 flex items-center justify-between">
                <button
                    onClick={navigateToPrevAsset}
                    className="p-2 m-4 bg-black bg-opacity-30 hover:bg-opacity-50 text-white rounded-full"
                    aria-label="Previous work"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>

                <button
                    onClick={navigateToNextAsset}
                    className="p-2 m-4 bg-black bg-opacity-30 hover:bg-opacity-50 text-white rounded-full"
                    aria-label="Next work"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>

            {/* Close button */}
            <button
                onClick={dismiss}
                className="absolute top-4 right-4 p-2 bg-black bg-opacity-30 hover:bg-opacity-50 text-white rounded-full"
                aria-label="Close modal"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    </Modal>
}

function useFilteredAssets(allAssets: AssetMetadata[]) {
    const searchParams = useSearchParams()
    const from = searchParams.get('from') ?? 'all'

    const filteredAssets = useMemo(() => {
        if (from) {
            const fromAssets = assetsForPath(allAssets, allSections(), from)
            return fromAssets
        } else {
            return allAssets
        }
    }, [from, allAssets])
    return filteredAssets
}