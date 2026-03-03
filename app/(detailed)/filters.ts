import { allCollections } from "@/shared/collection"
import { hrefForCollection, hrefForMaterial, hrefForTag, hrefForYear } from "@/shared/href"
import { parseMaterialString } from "@/shared/material"
import { getAssetsForCollection, getAssetsForMaterial, getAssetsForTag, getAssetsForYear, getUniqueMaterials, getUniqueYears } from "@/shared/metadataStore"
import { getAllTagsMetadata } from "@/shared/tag"

export type FilterLink = {
    title: string,
    href: string,
    value: string,
}
export type Filters = {
    kind: FilterLink[],
    material: FilterLink[],
    year: FilterLink[],
    tag: FilterLink[],
}
export async function getFilters(): Promise<Filters> {
    const [uniqueMaterials, uniqueYears] = await Promise.all([
        getUniqueMaterials(), getUniqueYears(),
    ])
    const kind: FilterLink[] = getKindOptions()
    const material: FilterLink[] = processMaterials(uniqueMaterials).map(material => ({
        title: material ?? 'Unspecified',
        href: hrefForMaterial({ material }),
        value: material ?? 'Unspecified',
    }))
    const year: FilterLink[] = processYears(uniqueYears).map(year => ({
        title: year?.toString() ?? 'Unknown',
        href: hrefForYear({ year: year }),
        value: year?.toString() ?? 'Unknown',
    }))

    const tagsMetadata = getAllTagsMetadata()
    const tag: FilterLink[] = tagsMetadata.map(tag => ({
        title: tag.title,
        href: hrefForTag({ tag: tag.tag }),
        value: tag.tag,
    }))
    return {
        kind, material, year, tag,
    }
}

export async function getAssetsForFilter(filterKey: keyof Filters, filterValue: string) {
    switch (filterKey) {
        case 'kind': {
            const collections = allCollections()
            const collection = collections.find(c => c.id === filterValue)
            if (!collection) {
                return []
            }
            return getAssetsForCollection(collection.id)
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
        case 'tag': {
            return getAssetsForTag(filterValue)
        }
        default:
            return []
    }
}

export function filterKey(filter: string): keyof Filters | undefined {
    switch (filter) {
        case 'all':
            return 'kind'
        case 'material':
        case 'year':
        case 'tag':
        case 'kind':
            return filter
        default: return undefined
    }
}

function getKindOptions() {
    const kind: FilterLink[] = allCollections().map(collection => ({
        title: collection.id,
        href: hrefForCollection({ collectionId: collection.id }),
        value: collection.id,
    }))
    kind.shift() // remove 'all' collection
    return kind
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