import {
    AssetMetadata,
} from "@/shared/asset"
import Link from "next/link"
import { AssetImage } from "@/app/AssetImage"
import { hrefForAssetModal } from "@/shared/href"
import { OptionalModal } from "./WorkModal"
import { AssetDescription } from "./AssetDescription"
import { clsx } from "clsx"

export type GallerySection = {
    title: string,
    id: string,
    assets: AssetMetadata[],
}
export type GalleryLink = {
    title: string,
    href: string,
    selected: boolean,
}
export function Gallery({
    sections, navigation, pathname,
}: {
    sections: GallerySection[],
    navigation: GalleryLink[],
    pathname: string,
}) {
    const { columns, assets } = buildColumns({
        sections, navigation, count: 4,
    })
    return (
        <>
            <OptionalModal
                assets={assets}
                pathname={pathname}
            />
            <div className="flex flex-row gap-2">
                {columns.map((column, index) => (
                    <div key={index} className="flex flex-col w-1/4 gap-0">
                        {column.map((tile) => (
                            <GalleryTile
                                key={tile.kind === 'asset' ? tile.asset.id : tile.kind === 'section' ? tile.id : JSON.stringify(tile.links)}
                                tile={tile}
                            />
                        ))}
                    </div>
                ))}
            </div>
        </>
    )
}

function buildColumns({ sections, navigation, count }: {
    sections: GallerySection[],
    navigation: GalleryLink[],
    count: number,
}) {
    const tiles: GalleryTile[] = []
    const assets: AssetMetadata[] = []
    for (const section of sections) {
        tiles.push({
            kind: 'section',
            title: section.title,
            id: section.id,
        })
        for (const asset of section.assets) {
            tiles.push({
                kind: 'asset',
                asset,
            })
            assets.push(asset)
        }
    }

    function insertTile(index: number, tile: GalleryTile) {
        if (index >= tiles.length) {
            tiles.push(tile)
        } else {
            tiles.splice(index, 0, tile)
        }
    }
    insertTile(count + 1, {
        kind: 'navigation',
        links: sections.map(section => ({
            title: section.title,
            href: `#${section.id}`,
            selected: false,
        })),
    })
    insertTile(3 * count, {
        kind: 'navigation',
        links: navigation,
    })

    const columns: GalleryTile[][] = Array.from({ length: count }, () => [])
    tiles.forEach((tile, index) => {
        const columnIndex = index % count
        columns[columnIndex].push(tile)
    })

    return { columns, assets }
}

type GalleryTile = {
    kind: 'asset',
    asset: AssetMetadata,
} | {
    kind: 'section',
    title: string,
    id: string,
} | {
    kind: 'navigation',
    links: GalleryLink[],
}

function GalleryTile({ tile }: { tile: GalleryTile }) {
    switch (tile.kind) {
        case 'asset':
            return <AssetTile asset={tile.asset} pathname="" />
        case 'section':
            return <SectionTile title={tile.title} id={tile.id} />
        case 'navigation':
            return <NavigationTile links={tile.links} />
    }
}

function AssetTile({ asset, pathname }: {
    asset: AssetMetadata,
    pathname: string,
}) {
    const href = hrefForAssetModal({
        pathname,
        assetId: asset.id,
    })
    return (
        <div className="flex flex-col break-inside-avoid-column">
            <Link href={href} className="block">
                <AssetImage asset={asset} sizes="25vw" />
            </Link>
            <span className="text-xs text-accent">
                <AssetDescription asset={asset} pathname={pathname} />
            </span>
        </div>
    )
}

function SectionTile({ title, id }: { title: string, id: string }) {
    return <div className="p-4 flex flex-col items-center" style={{
        fontSize: '5rem',
    }}>
        <h2 className="text-accent" id={id}>{title}</h2>
    </div>
}

function NavigationTile({ links }: {
    links: GalleryLink[],
}) {
    return (
        <nav className="flex flex-row flex-wrap gap-0 items-end px-4" style={{
            fontSize: '3rem',
            color: 'red',
        }}>
            {links.map((link, index) => {
                const last = index === links.length - 1
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