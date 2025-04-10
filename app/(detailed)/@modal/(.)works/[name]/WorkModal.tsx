'use client'
import { AssetMetadata } from "@/shared/assets"
import { Modal } from "@/shared/Modal"
import { AssetImage } from "@/shared/AssetImage"
import { useRouter } from "next/navigation"
import React, { useEffect } from "react"
import { hrefForAsset, hrefForSection, hrefForConsole } from "@/shared/href"
import Link from "next/link"

export function WorkModal({
    assets, assetId, section, authenticated,
}: {
    assetId: string,
    assets: AssetMetadata[],
    section: string,
    authenticated?: boolean,
}) {
    const currentIndex = assets.findIndex(a => a.id === assetId)
    const asset = assets[currentIndex]
    const nextIndex = (currentIndex + 1) % assets.length
    const prevIndex = (currentIndex - 1 + assets.length) % assets.length

    const nextLink = nextIndex >= 0 && nextIndex < assets.length
        ? hrefForAsset(assets[nextIndex])
        : undefined
    const prevLink = prevIndex >= 0 && prevIndex < assets.length
        ? hrefForAsset(assets[prevIndex])
        : undefined
    const dismissLink = hrefForSection(section)
    const editLink = hrefForConsole({
        section,
        assetId: assetId,
    })

    const router = useRouter()
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                if (nextLink) {
                    router.push(nextLink)
                }
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                if (prevLink) {
                    router.push(prevLink)
                }
            } else if (e.key === 'Escape') {
                if (dismissLink) {
                    router.push(dismissLink)
                }
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [nextLink, prevLink, dismissLink, router])

    return <Modal
        onDismiss={() => router.push(dismissLink)}
    >
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
                {prevLink && <Link
                    href={prevLink}
                    className="p-2 m-4 bg-black bg-opacity-30 hover:bg-opacity-50 text-white rounded-full"
                    aria-label="Previous work"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </Link>}

                {nextLink && <Link
                    href={nextLink}
                    className="p-2 m-4 bg-black bg-opacity-30 hover:bg-opacity-50 text-white rounded-full"
                    aria-label="Next work"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </Link>}
            </div>

            {/* Close button */}
            <Link
                href={dismissLink}
                className="absolute top-4 right-4 p-2 bg-black bg-opacity-30 hover:bg-opacity-50 text-white rounded-full"
                aria-label="Close modal"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </Link>

            {/* Edit button */}
            {authenticated && <Link
                href={editLink}
                className="absolute top-4 left-4 p-2 bg-black bg-opacity-30 hover:bg-opacity-50 text-white rounded-full"
                aria-label="Edit work"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-6 w-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                </svg>
            </Link>}
        </div>
    </Modal>
}