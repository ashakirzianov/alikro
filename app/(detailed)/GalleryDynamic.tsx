'use client'
import { AssetImage } from "@/app/AssetImage"
import { useAspectRatio } from "@/shared/aspect"
import { assetHeight, AssetMetadata, assetWidth } from "@/shared/asset"
import { hrefForAsset } from "@/shared/href"
import { useIsClient } from "@/shared/setting"
import Link from "next/link"
import { useEffect, useState } from "react"
import { AssetDescription } from "./AssetDescription"

export function GalleryDynamic({
    assets, fractions, pathname,
}: {
    assets: AssetMetadata[],
    fractions: readonly number[],
    pathname: string,
}) {
    const aspect = useAspectRatio()
    const { lines, length } = computeLines({
        assets,
        fractions,
    })
    const [scroll, setScroll] = useState(0)
    useEffect(() => {
        let ticking = false
        function handleScroll() {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    setScroll(window.scrollY)
                    ticking = false
                })
                ticking = true
            }
        }
        window.addEventListener('scroll', handleScroll)
        return () => {
            window.removeEventListener('scroll', handleScroll)
        }
    }, [])
    const isClient = useIsClient()
    if (!isClient) {
        return null
    }
    console.log({ length })
    return <div>
        <div style={{
            position: 'sticky',
            top: 0,
            display: 'flex',
            flexDirection: 'column',
        }}>
            {lines.map((line, index) => {
                const direction = index % 2 === 0 ? 'left' : 'right'
                return <AssetLine
                    key={index}
                    pathname={pathname}
                    assets={line}
                    scroll={scroll}
                    fraction={fractions[index]}
                    direction={direction}
                />
            })}
        </div>
        <div style={{ height: `${(length - aspect) * 100 - 10}svh` }} />
    </div>
}

function AssetLine({
    pathname, assets, scroll, fraction, direction,
}: {
    pathname: string,
    assets: AssetMetadata[],
    scroll: number,
    fraction: number
    direction?: 'left' | 'right',
}) {
    if (direction === 'right') {
        assets = [...assets].reverse()
    }
    const height = `${fraction}svh`
    return <div>
        <div className="flex flex-row flex-nowrap" style={{
            justifyContent: direction === 'right' ? 'flex-end' : 'flex-start',
            height,
            position: 'relative',
            left: direction === 'right' ? scroll : -scroll,
        }}>
            {assets.map((asset) => {
                return <div key={asset.id} style={{
                    aspectRatio: `${assetWidth(asset)} / ${assetHeight(asset)}`,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                }}
                >
                    <Link href={hrefForAsset({
                        assetId: asset.id,
                        pathname,
                    })}>
                        <AssetImage asset={asset} sizes={`${10}vw`} style={{
                            width: '100%',
                            // height: '80%',
                        }} />
                    </Link>
                    <span className="text-lg">
                        <AssetDescription asset={asset} pathname={pathname} />
                    </span>
                </div>
            })}
        </div>
    </div >
}

function computeLines({ assets, fractions }: {
    assets: AssetMetadata[],
    fractions: readonly number[],
}) {
    const lines: AssetMetadata[][] = fractions.map(() => [])
    const totalFraction = fractions.reduce((a, b) => a + b, 0)
    const currentLengths = fractions.map(() => 0)
    const reversed = [...assets].reverse()
    let asset = reversed.pop()
    while (asset) {
        const shortestIdx = currentLengths.reduce((minIndex, length, index, arr) => length < arr[minIndex] ? index : minIndex, 0)
        lines[shortestIdx].push(asset)
        currentLengths[shortestIdx] += assetWidth(asset) * fractions[shortestIdx]
        asset = reversed.pop()
    }
    const shortestIdx = currentLengths.reduce((minIndex, length, index, arr) => length < arr[minIndex] ? index : minIndex, 0)
    const fraction = fractions[shortestIdx] / totalFraction
    const length = lines[shortestIdx].reduce((sum, asset) => sum + assetWidth(asset) / assetHeight(asset), 0) * fraction
    console.log({ currentLengths, shortestIdx, length })
    return {
        lines,
        length,
    }
}