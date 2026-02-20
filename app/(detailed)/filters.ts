import { allCollections } from "@/shared/collection"
import { hrefForCollection, hrefForMaterial, hrefForTag, hrefForYear } from "@/shared/href"
import { parseMaterialString, specialCasesForMaterialElements } from "@/shared/materials"
import { getUniqueMaterials, getUniqueTags, getUniqueYears } from "@/shared/metadataStore"

export type FilterValue = {
    title: string,
    href: string,
}
export type Filters = {
    kind: FilterValue[],
    material: FilterValue[],
    year: FilterValue[],
    tag: FilterValue[],
}
export async function getFilters(): Promise<Filters> {
    const [uniqueMaterials, uniqueYears, uniqueTags] = await Promise.all([
        getUniqueMaterials(), getUniqueYears(), getUniqueTags(),
    ])
    const kind: FilterValue[] = getKindOptions()
    const material: FilterValue[] = processMaterials(uniqueMaterials).map(material => ({
        title: material ?? 'Unspecified',
        href: hrefForMaterial({ material }),
    }))
    const year: FilterValue[] = processYears(uniqueYears).map(year => ({
        title: year?.toString() ?? 'Unknown',
        href: hrefForYear({ year: year }),
    }))
    const tag: FilterValue[] = uniqueTags.map(tag => ({
        title: tag,
        href: hrefForTag({ tag }),
    }))
    return {
        kind, material, year, tag,
    }
}

function getKindOptions() {
    const kind: FilterValue[] = allCollections().map(collection => ({
        title: collection.id,
        href: hrefForCollection({ collectionId: collection.id }),
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
        const materialElements = specialCasesForMaterialElements(parseMaterialString(materialString))
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