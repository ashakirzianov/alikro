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
            {columns.map((column, columnIdx) => (
                <div key={columnIdx} className="flex flex-col w-1/4 gap-1">
                    {column.map((tile, tileIdx) => (
                        <GalleryTileView
                            key={tileIdx}
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
    const content = tile.href ? <Link href={tile.href} className="hover:text-secondary hover:bg-accent">{tile.title}</Link>
        : tile.title
    return <div className="p-4 flex flex-col items-center justify-center text-center border-accent border-0">
        <h2 className="text-accent text-lg sm:text-6xl" id={tile.id}>{content}</h2>
    </div>
}

function NavigationTileView({ tile }: {
    tile: GalleryTileNavigation,
}) {
    return (
        <nav className="flex flex-col flex-wrap gap-0 items-end px-4 border-accent border-4 py-1">
            {tile.links.map((link, index) => {
                const last = index === tile.links.length - 1
                return <span key={index}>
                    <Link
                        key={index}
                        scroll={true}
                        href={link.href}
                        className={clsx(
                            'text-lg sm:text-6xl', {
                            'text-secondary bg-accent': link.selected,
                            'text-accent hover:text-secondary hover:bg-accent': !link.selected,
                        })}
                    >
                        {link.title}
                    </Link>
                    {/* {!last && <span>,&nbsp;</span>} */}
                </span>
            })}
        </nav>
    )
}