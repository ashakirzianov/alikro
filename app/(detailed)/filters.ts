import { allCollections } from "@/shared/collection"
import { hrefForCollection, hrefForMaterial, hrefForTag, hrefForYear } from "@/shared/href"
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
    const kind: FilterValue[] = allCollections().map(collection => ({
        title: collection.id,
        href: hrefForCollection({ collectionId: collection.id }),
    }))
    kind.shift() // remove 'all' collection
    const material: FilterValue[] = uniqueMaterials.map(material => ({
        title: material ?? 'Unspecified',
        href: hrefForMaterial({ material }),
    }))
    const year: FilterValue[] = uniqueYears.map(year => ({
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