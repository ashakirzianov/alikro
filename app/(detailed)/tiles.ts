import { AssetMetadata } from "@/shared/asset"
import { allCollections } from "@/shared/collection"
import { hrefForCollection, hrefForSlideshow, hrefForYear } from "@/shared/href"
import { getAllAssetMetadata, getUniqueTags } from "@/shared/metadataStore"
import { get } from "http"
import { getAssetsForFilter, getKindFilters, getMaterialFilters, getTagFilters, getYearFilters } from "./filters"
import { getTagMetadata } from "@/shared/tag"

export type GalleryTile = GalleryTileAsset | GalleryTileSection | GalleryTileNavigation

export type GalleryTileAsset = {
    kind: 'asset',
    asset: AssetMetadata,
}
export type GalleryTileSection = {
    kind: 'section',
    title: string,
    id?: string,
    href?: string,
}
export type GalleryTileNavigation = {
    kind: 'navigation',
    links: GalleryLink[],
}
export type GalleryLink = {
    title: string,
    href: string,
    selected: boolean,
}

export async function getTiles(filter: string, value: string | undefined): Promise<GalleryTile[]> {
    switch (filter) {
        case 'all':
            return tilesForAll()
        case 'tag':
            return value ? tilesForTag(value) : []
        case 'year':
            return value ? tilesForYear(value) : []
        case 'material':
            return value ? tilesForMaterial(value) : []
        default:
            return tilesForKind(filter)
    }
}

async function tilesForAll(): Promise<GalleryTile[]> {
    const assets = await getAllAssetMetadata()
    const byYear = groupAssetsByYear(assets)
    const tiles: GalleryTile[] = []
    byYear.forEach((group, idx) => {
        // const title = idx === 0 ? `all works from ${group.year}` : (group.year?.toString() ?? 'unknown')
        const title = `${group.year ?? 'unknown'}`
        tiles.push({
            kind: 'section',
            title,
            id: `year-${group.year ?? 'unknown'}`,
            href: hrefForYear({ year: group.year }),
        })
        group.assets.forEach(asset => {
            tiles.push({
                kind: 'asset',
                asset,
            })
        })
    })
    const navigation = [
        getMainPageTile(),
        getKindNavigationTile(undefined),
        getTagNavigationTile(undefined),
        // await getYearNavigationTile(undefined),
        await getMaterialNavigationTile(undefined)
    ]
    const combined = insertNavigationTiles(tiles, navigation)
    return combined
}

async function tilesForKind(kind: string): Promise<GalleryTile[]> {
    const assets = await getAssetsForFilter('kind', kind)
    const byYear = groupAssetsByYear(assets)
    const tiles: GalleryTile[] = []
    byYear.forEach((group, idx) => {
        const title = idx === 0 ? `${kind} from ${group.year}` : (group.year?.toString() ?? 'unknown')
        tiles.push({
            kind: 'section',
            title,
        })
        group.assets.forEach(asset => {
            tiles.push({
                kind: 'asset',
                asset,
            })
        })
    })
    const navigation = [
        getMainPageTile(),
        getKindNavigationTile(kind),
        getTagNavigationTile(undefined),
        await getMaterialNavigationTile(undefined)
    ]
    const combined = insertNavigationTiles(tiles, navigation)
    return combined
}

async function tilesForTag(tag: string): Promise<GalleryTile[]> {
    const { title } = getTagMetadata(tag) ?? {}
    if (!title) {
        return []
    }
    const assets = await getAssetsForFilter('tag', tag)
    const assetTiles: GalleryTile[] = assets.map(asset => ({
        kind: 'asset',
        asset,
    }))
    const tiles: GalleryTile[] = [{
        kind: 'section',
        title,
    }, ...assetTiles]
    const navigation = [
        getMainPageTile(),
        getTagNavigationTile(tag),
        await getYearNavigationTile(undefined),
        getKindNavigationTile(undefined),
        await getMaterialNavigationTile(undefined)
    ]
    const combined = insertNavigationTiles(tiles, navigation)
    return combined
}

async function tilesForYear(year: string): Promise<GalleryTile[]> {
    const assets = await getAssetsForFilter('year', year)
    if (assets.length === 0) {
        return []
    }
    const assetTiles: GalleryTile[] = assets.map(asset => ({
        kind: 'asset',
        asset,
    }))
    const tiles: GalleryTile[] = [{
        kind: 'section',
        title: year,
    }, ...assetTiles]
    const navigation = [
        getMainPageTile(),
        await getYearNavigationTile(year),
        getKindNavigationTile(undefined),
        getTagNavigationTile(undefined),
        await getMaterialNavigationTile(undefined)
    ]
    const combined = insertNavigationTiles(tiles, navigation)
    return combined
}

async function tilesForMaterial(material: string): Promise<GalleryTile[]> {
    const assets = await getAssetsForFilter('material', material)
    if (assets.length === 0) {
        return []
    }
    const assetTiles: GalleryTile[] = assets.map(asset => ({
        kind: 'asset',
        asset,
    }))
    const tiles: GalleryTile[] = [{
        kind: 'section',
        title: material,
    }, ...assetTiles]
    const navigation = [
        getMainPageTile(),
        await getMaterialNavigationTile(material),
        getKindNavigationTile(undefined),
        getTagNavigationTile(undefined),
        await getYearNavigationTile(undefined),
    ]
    const combined = insertNavigationTiles(tiles, navigation)
    return combined
}

function insertNavigationTiles(contentTiles: GalleryTile[], navigationTiles: GalleryTile[], count: number = 4) {
    const result: GalleryTile[] = []
    const intervals = [count - 1, count, count, count + 1]
    let navigationIdx = 0
    let contentInserted = 0
    for (const contentTile of contentTiles) {
        result.push(contentTile)
        contentInserted++
        const interval = intervals[navigationIdx] ?? count
        const assetTileToTheLeft = contentTile.kind === 'asset'
        const assetTileToTheTop = (result[result.length - count]?.kind ?? 'asset') === 'asset'
        const assetCondition = assetTileToTheLeft && assetTileToTheTop || true
        if (contentInserted >= interval && navigationIdx < navigationTiles.length && assetCondition) {
            result.push(navigationTiles[navigationIdx])
            navigationIdx++
            contentInserted = 0
        }
    }
    for (; navigationIdx < navigationTiles.length; navigationIdx++) {
        result.push(navigationTiles[navigationIdx])
    }
    return result
}

function getMainPageTile(): GalleryTile {
    return {
        kind: 'section',
        title: 'Alikro',
        href: hrefForSlideshow(),
    }
}

function getKindNavigationTile(selected: string | undefined): GalleryTile {
    const filters = getKindFilters()
    return {
        kind: 'navigation',
        links: filters.map(filter => ({
            title: filter.title,
            href: filter.href,
            selected: filter.value === selected,
        })),
    }
}

function getTagNavigationTile(selected: string | undefined): GalleryTile {
    const filters = getTagFilters()
    return {
        kind: 'navigation',
        links: filters.map(filter => ({
            title: filter.title,
            href: filter.href,
            selected: filter.value === selected,
        })),
    }
}

async function getYearNavigationTile(selected: string | undefined): Promise<GalleryTile> {
    const filters = await getYearFilters()
    return {
        kind: 'navigation',
        links: filters.map(filter => ({
            title: filter.title,
            href: filter.href,
            selected: filter.value === selected,
        })),
    }
}

async function getMaterialNavigationTile(selected: string | undefined): Promise<GalleryTile> {
    const filters = await getMaterialFilters()
    return {
        kind: 'navigation',
        links: filters.map(filter => ({
            title: filter.title,
            href: filter.href,
            selected: filter.value === selected,
        })),
    }
}

function groupAssetsByYear(assets: AssetMetadata[]) {
    const byYear: Record<number, AssetMetadata[]> = {
    }
    assets.forEach(asset => {
        const year = asset.year
        const key: number = year !== undefined ? year : 0
        if (byYear[key] === undefined) {
            byYear[key] = []
        }
        byYear[key].push(asset)
    })
    const entries = Object.entries(byYear)
    entries.sort((a, b) => {
        return Number(b[0]) - Number(a[0])
    })
    return entries.map(([year, assets]) => {
        const yearNumber = Number(year)
        return {
            year: yearNumber !== 0 ? yearNumber : undefined,
            assets,
        }
    })
}