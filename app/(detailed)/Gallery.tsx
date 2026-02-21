'use client'
import { AssetMetadata } from "@/shared/asset"
import { AssetImage } from "@/app/AssetImage"
import { AssetDescription } from "./AssetDescription"
import { ExpandedView } from "./ExpandedView"
import { useState } from "react"

export function Gallery({
    assets, pathname,
}: {
    assets: AssetMetadata[],
    pathname: string,
}) {
    const [expandedIdx, setExpandedIdx] = useState<number | null>(null)
    const [originRect, setOriginRect] = useState<DOMRect | null>(null)

    function buildColumns(assets: AssetMetadata[], num: number) {
        const columns: AssetMetadata[][] = Array(num).fill(null).map(() => [])
        assets.forEach((asset, index) => {
            const columnIndex = index % num
            columns[columnIndex].push(asset)
        })
        return columns
    }
    const columns = buildColumns(assets, 4)

    function handleTileClick(assetIdx: number, rect: DOMRect) {
        setOriginRect(rect)
        setExpandedIdx(assetIdx)
    }

    return (
        <>
            {expandedIdx !== null && (
                <ExpandedView
                    assets={assets}
                    assetIdx={expandedIdx}
                    originRect={originRect}
                    onDismiss={() => setExpandedIdx(null)}
                    onNavigate={setExpandedIdx}
                />
            )}
            <div className="flex flex-row gap-2">
                {columns.map((column, colIndex) => (
                    <div key={colIndex} className="flex flex-col w-1/4 gap-0">
                        {column.map((asset) => (
                            <Tile
                                key={asset.fileName}
                                asset={asset}
                                pathname={pathname}
                                onExpand={(rect) => handleTileClick(
                                    assets.findIndex(a => a.id === asset.id),
                                    rect,
                                )}
                            />
                        ))}
                    </div>
                ))}
            </div>
        </>
    )
}

function Tile({ asset, pathname, onExpand }: {
    asset: AssetMetadata,
    pathname: string,
    onExpand: (rect: DOMRect) => void,
}) {
    function handleClick(e: React.MouseEvent<HTMLDivElement>) {
        const img = e.currentTarget.querySelector('img')
        if (img) {
            onExpand(img.getBoundingClientRect())
        }
    }

    return (
        <div
            className="flex flex-col break-inside-avoid-column cursor-pointer"
            onClick={handleClick}
        >
            <AssetImage asset={asset} sizes="25vw" />
            <span className="text-xs text-accent">
                <AssetDescription asset={asset} pathname={pathname} />
            </span>
        </div>
    )
}
