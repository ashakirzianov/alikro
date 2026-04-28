import { AssetMetadata } from "@/shared/asset"
import { hrefForAbout, hrefForSlideshow } from "@/shared/href"
import { getAssetsForFilter, getKindFilters, getMaterialFilters, getSelectedFilters, getYearFilters } from "./filters"
import { collectionForId, getSelectedCollections } from "@/shared/collection"
import { getAssetsForCollection, getAssetsForTag } from "@/shared/metadataStore"

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
        case 'tag':
            return value ? tilesForTag(value) : []
        case 'year':
            return value ? tilesForYear(value) : []
        case 'material':
            return value ? tilesForMaterial(value) : []
        default:
            return tilesForCollection(filter)
    }
}

function isSelectedCollection(id: string): boolean {
    return getSelectedCollections().some(c => c.id === id)
}

async function tilesForCollection(id: string): Promise<GalleryTile[]> {
    if (isSelectedCollection(id)) {
        return tilesForSelected(id)
    }
    return tilesForKind(id)
}

async function tilesForKind(kind: string): Promise<GalleryTile[]> {
    const assets = await getAssetsForCollection(kind)
    if (assets.length === 0) {
        return []
    }
    const tiles: GalleryTile[] = assets.map(asset => ({
        kind: 'asset',
        asset,
    }))
    const navigation = [
        getKindNavigationTile(kind),
        getMainPageTile(),
        await getYearNavigationTile(undefined),
        getSelectedNavigationTile(undefined),
        await getMaterialNavigationTile(undefined),
        getAboutTile(),
    ]
    const combined = insertNavigationTiles(tiles, navigation)
    return combined
}

async function tilesForSelected(id: string): Promise<GalleryTile[]> {
    const assets = await getAssetsForCollection(id)
    if (assets.length === 0) {
        return []
    }
    const tiles: GalleryTile[] = assets.map(asset => ({
        kind: 'asset',
        asset,
    }))
    const navigation: GalleryTile[] = [
        getSelectedNavigationTile(id),
        getMainPageTile(),
        getKindNavigationTile(undefined),
        await getYearNavigationTile(undefined),
        await getMaterialNavigationTile(undefined),
        getAboutTile(),
    ]
    const combined = insertNavigationTiles(tiles, navigation)
    return combined
}

async function tilesForTag(tag: string): Promise<GalleryTile[]> {
    const assets = await getAssetsForTag(tag)
    if (assets.length === 0) {
        return []
    }
    const tiles: GalleryTile[] = assets.map(asset => ({
        kind: 'asset',
        asset,
    }))
    const navigation: GalleryTile[] = [
        getSelectedNavigationTile(tag),
        getMainPageTile(),
        getKindNavigationTile(undefined),
        await getYearNavigationTile(undefined),
        await getMaterialNavigationTile(undefined),
        getAboutTile(),
    ]
    const combined = insertNavigationTiles(tiles, navigation)
    return combined
}

async function tilesForYear(year: string): Promise<GalleryTile[]> {
    const assets = await getAssetsForFilter('year', year)
    if (assets.length === 0) {
        return []
    }
    const tiles: GalleryTile[] = assets.map(asset => ({
        kind: 'asset',
        asset,
    }))
    const header: GalleryTile = {
        kind: 'section',
        title: year,
    }
    const navigation = [
        // header,
        await getYearNavigationTile(year),
        getMainPageTile(),
        getKindNavigationTile(undefined),
        getSelectedNavigationTile(undefined),
        await getMaterialNavigationTile(undefined),
        getAboutTile(),
    ]
    const combined = insertNavigationTiles(tiles, navigation)
    return combined
}

async function tilesForMaterial(material: string): Promise<GalleryTile[]> {
    const assets = await getAssetsForFilter('material', material)
    if (assets.length === 0) {
        return []
    }
    const tiles: GalleryTile[] = assets.map(asset => ({
        kind: 'asset',
        asset,
    }))
    const header: GalleryTile = {
        kind: 'section',
        title: material,
    }
    const navigation = [
        // header,
        await getMaterialNavigationTile(material),
        getMainPageTile(),
        getKindNavigationTile(undefined),
        getSelectedNavigationTile(undefined),
        await getYearNavigationTile(undefined),
        getAboutTile(),
    ]
    const combined = insertNavigationTiles(tiles, navigation)
    return combined
}

function insertNavigationTiles(contentTiles: GalleryTile[], navigationTiles: GalleryTile[], count: number = 4) {
    const result: GalleryTile[] = []
    const intervals = [0, count - 2, count, count, count + 1]
    let navigationIdx = 0
    let contentInserted = 0
    for (let contentIdx = 0; contentIdx < contentTiles.length;) {
        const interval = intervals[navigationIdx] ?? count
        const assetTileToTheLeft = (result[result.length - 1]?.kind ?? 'asset') === 'asset'
        const assetTileToTheTop = (result[result.length - count]?.kind ?? 'asset') === 'asset'
        const assetCondition = (assetTileToTheLeft && assetTileToTheTop) || true
        if (contentInserted >= interval && navigationIdx < navigationTiles.length && assetCondition) {
            result.push(navigationTiles[navigationIdx])
            navigationIdx++
            contentInserted = 0
        } else {
            const contentTile = contentTiles[contentIdx]
            result.push(contentTile)
            contentIdx++
            contentInserted++
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

function getSelectedNavigationTile(selected: string | undefined): GalleryTile {
    const filters = getSelectedFilters()
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

function getAboutTile(): GalleryTile {
    // return {
    //     kind: 'navigation',
    //     links: [{
    //         title: 'about',
    //         href: hrefForAbout(),
    //         selected: false,
    //     }],
    // }
    return {
        kind: 'section',
        title: 'about',
        href: hrefForAbout(),
    }
}

type SectionData = {
    title: string,
    id?: string,
    href?: string,
}
type SectionDataFn = (year: number | undefined, idx: number) => SectionData
function makeTilesWithYearSections(assets: AssetMetadata[], sectionData: SectionDataFn): GalleryTile[] {
    const byYear = groupAssetsByYear(assets)
    const tiles: GalleryTile[] = []
    byYear.forEach((group, idx) => {
        const section = sectionData(group.year, idx)
        tiles.push({
            kind: 'section',
            title: section.title,
            id: section.id,
            href: section.href,
        })
        group.assets.forEach(asset => {
            tiles.push({
                kind: 'asset',
                asset,
            })
        })
    })
    return tiles
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