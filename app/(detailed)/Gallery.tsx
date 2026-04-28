import { OptionalModal } from "./WorkModal"
import { GalleryTile } from "./tiles"
import { GalleryWithNavigation } from "./GalleryWithNavigation"
import { getSelectedCollections } from "@/shared/collection"
import { hrefForCollection } from "@/shared/href"

export function Gallery({
    tiles, pathname,
}: {
    tiles: GalleryTile[],
    pathname: string,
}) {
    const assets = tiles
        .map(tile => tile.kind === 'asset' ? tile.asset : null)
        .filter((tile) => tile !== null)
    const tags = getSelectedCollections().map(c => ({
        title: c.title,
        href: hrefForCollection({ collectionId: c.id }),
    }))
    return (
        <>
            <OptionalModal
                key='modal'
                assets={assets}
                pathname={pathname}
                tags={tags}
            />
            <GalleryWithNavigation
                key='gallery'
                tiles={tiles}
                pathname={pathname}
            />
        </>
    )
}