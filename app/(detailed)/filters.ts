import { getKindCollections, getSelectedCollections } from "@/shared/collection"
import { hrefForCollection, hrefForMaterial, hrefForTag, hrefForYear } from "@/shared/href"
import { parseMaterialString } from "@/shared/material"
import { getAssetsForCollection, getAssetsForMaterial, getAssetsForTag, getAssetsForYear, getUniqueMaterials, getUniqueTags, getUniqueYears } from "@/shared/metadataStore"

export type FilterLink = {
    title: string,
    href: string,
    value: string,
}
export type Filters = {
    collection: FilterLink[],
    tag: FilterLink[],
    material: FilterLink[],
    year: FilterLink[],
}
export async function getFilters(): Promise<Filters> {
    const [tag, material, year] = await Promise.all([
        getTagFilters(), getMaterialFilters(), getYearFilters(),
    ])
    const collection: FilterLink[] = getCollectionFilters()
    return {
        collection, tag, material, year,
    }
}

export function getCollectionFilters(): FilterLink[] {
    return [...getKindCollections(), ...getSelectedCollections()].map(collection => ({
        title: collection.title,
        href: hrefForCollection({ collectionId: collection.id }),
        value: collection.id,
    }))
}

export async function getTagFilters(): Promise<FilterLink[]> {
    const uniqueTags = await getUniqueTags()
    return uniqueTags.map(tag => ({
        title: tag,
        href: hrefForTag({ tag }),
        value: tag,
    }))
}

export async function getMaterialFilters(): Promise<FilterLink[]> {
    const uniqueMaterials = await getUniqueMaterials()
    return processMaterials(uniqueMaterials).map(material => ({
        title: material ?? 'Unspecified',
        href: hrefForMaterial({ material }),
        value: material ?? 'Unspecified',
    }))
}

export async function getYearFilters(): Promise<FilterLink[]> {
    const uniqueYears = await getUniqueYears()
    return processYears(uniqueYears).map(year => ({
        title: year?.toString() ?? 'Unknown',
        href: hrefForYear({ year: year }),
        value: year?.toString() ?? 'Unknown',
    }))
}

export async function getAssetsForFilter(filterKey: keyof Filters, filterValue: string) {
    switch (filterKey) {
        case 'collection': {
            return getAssetsForCollection(filterValue)
        }
        case 'tag': {
            return getAssetsForTag(filterValue)
        }
        case 'material': {
            return getAssetsForMaterial(filterValue)
        }
        case 'year': {
            const year = parseInt(filterValue)
            if (isNaN(year)) {
                return []
            }
            return getAssetsForYear(year)
        }
        default:
            return []
    }
}

function processMaterials(materials: Array<string | undefined>): Array<string | undefined> {
    const materialSet = new Set<string | undefined>()
    materials.forEach(materialString => {
        if (materialString === undefined) {
            materialSet.add(materialString)
            return
        }
        const materialElements = parseMaterialString(materialString)
        for (const materialElement of materialElements) {
            if (!materialElement.passive) {
                if (materialElement.on) {
                    materialSet.add(`on ${materialElement.content}`)
                } else {
                    materialSet.add(materialElement.content)
                }
            }
        }
    })
    const array = Array.from(materialSet)
    array.sort((a, b) => {
        if (a === undefined || a.startsWith('on ')) return 1
        if (b === undefined || b.startsWith('on ')) return -1
        return a.localeCompare(b)
    })
    return array
}

function processYears(years: Array<number | undefined>): Array<number | undefined> {
    // Sort years, undefined goes last
    years.sort((a, b) => (b ?? 0) - (a ?? 0))
    return years
}
