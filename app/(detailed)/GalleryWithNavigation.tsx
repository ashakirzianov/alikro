import Link from "next/link"
import { AssetImage } from "@/app/AssetImage"
import { hrefForAssetModal } from "@/shared/href"
import { AssetDescription } from "./AssetDescription"
import { clsx } from "clsx"
import { GalleryTile, GalleryTileAsset, GalleryTileNavigation, GalleryTileSection } from "./tiles"

export function GalleryWithNavigation({
    tiles, pathname,
}: {
    tiles: GalleryTile[],
    pathname: string,
}) {
    const columns = buildColumns({
        tiles, count: 4,
    })
    return (
        <div className="flex flex-row gap-2">
            {columns.map((column, index) => (
                <div key={index} className="flex flex-col w-1/4 gap-0">
                    {column.map((tile) => (
                        <GalleryTileView
                            key={tile.kind === 'asset' ? tile.asset.id : tile.kind === 'section' ? tile.id : JSON.stringify(tile.links)}
                            tile={tile}
                            pathname={pathname}
                        />
                    ))}
                </div>
            ))}
        </div>
    )
}

function buildColumns({ tiles, count }: {
    tiles: GalleryTile[],
    count: number,
}) {

    const columns: GalleryTile[][] = Array.from({ length: count }, () => [])
    tiles.forEach((tile, index) => {
        const columnIndex = index % count
        columns[columnIndex].push(tile)
    })

    return columns
}

function GalleryTileView({ tile, pathname }: { tile: GalleryTile, pathname: string }) {
    switch (tile.kind) {
        case 'asset':
            return <AssetTileView tile={tile} pathname={pathname} />
        case 'section':
            return <SectionTileView tile={tile} />
        case 'navigation':
            return <NavigationTileView tile={tile} />
    }
}

function AssetTileView({ tile, pathname }: {
    tile: GalleryTileAsset,
    pathname: string,
}) {
    const href = hrefForAssetModal({
        pathname,
        assetId: tile.asset.id,
    })
    return (
        <div className="flex flex-col break-inside-avoid-column">
            <Link href={href} className="block">
                <AssetImage asset={tile.asset} sizes="25vw" />
            </Link>
            <span className="text-xs text-accent">
                <AssetDescription asset={tile.asset} pathname={pathname} />
            </span>
        </div>
    )
}

function SectionTileView({ tile }: { tile: GalleryTileSection }) {
    return <div className="p-4 flex flex-col items-center" style={{
        fontSize: '5rem',
    }}>
        <h2 className="text-accent" id={tile.id}>{tile.title}</h2>
    </div>
}

function NavigationTileView({ tile }: {
    tile: GalleryTileNavigation,
}) {
    return (
        <nav className="flex flex-row flex-wrap gap-0 items-end px-4" style={{
            fontSize: '3rem',
            color: 'red',
        }}>
            {tile.links.map((link, index) => {
                const last = index === tile.links.length - 1
                return <span key={index}>
                    <Link
                        key={index}
                        scroll={true}
                        href={link.href}
                        className={clsx(
                            // "text-sm",
                            link.selected ? "text-primary" : "text-accent",
                            // !last && "after:content-['//'] after:mx-2 after:text-accent",
                        )}
                    >
                        {link.title}
                    </Link>
                    {!last && <span>,&nbsp;</span>}
                </span>
            })}
        </nav>
    )
}