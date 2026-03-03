import { OptionalModal } from "./WorkModal"
import { GalleryTile } from "./tiles"
import { GalleryWithNavigation } from "./GalleryWithNavigation"

export function Gallery({
    tiles, pathname,
}: {
    tiles: GalleryTile[],
    pathname: string,
}) {
    const assets = tiles
        .map(tile => tile.kind === 'asset' ? tile.asset : null)
        .filter((tile) => tile !== null)
    return (
        <>
            <OptionalModal
                assets={assets}
                pathname={pathname}
            />
            <GalleryWithNavigation
                tiles={tiles}
                pathname={pathname}
            />
        </>
    )
}