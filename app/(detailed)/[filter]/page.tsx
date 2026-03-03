import { notFound } from "next/navigation"
import { Gallery, GallerySection } from "@/app/(detailed)/GalleryWithNavigation"
import { filterKey, Filters, getAssetsForFilter, getFilters } from "../filters"

type Props = {
    filter: string,
}
type Input = {
    params: Promise<Props>
}

export async function generateStaticParams(): Promise<Props[]> {
    return ['all', 'material', 'year', 'tag'].map(filter => ({
        filter,
    }))
}

export default async function Page({
    params,
}: Input) {
    const { filter } = await params
    const pathname = `/${filter}`

    const actualFilter = filterKey(filter)
    if (actualFilter === undefined) {
        return notFound()
    }

    const filters = await getFilters()
    const navigation = Object.keys(filters).map(f => ({
        title: `by ${f}`,
        href: `/${f}`,
        selected: f === filter,
    }))

    const sections = await sectionsForFilter(actualFilter, filters)
    if (sections.length === 0) {
        return notFound()
    }

    return <Gallery
        sections={sections}
        navigation={navigation}
        pathname={pathname}
    />
}

async function sectionsForFilter(filterKey: keyof Filters, filters: Filters): Promise<GallerySection[]> {
    const filterValues = filters[filterKey]
    if (filterValues === undefined) {
        return []
    }
    const sections: GallerySection[] = []
    for (const { title, value } of filterValues) {
        const assets = await getAssetsForFilter(filterKey, value)
        if (assets.length > 0) {
            sections.push({
                id: value,
                title: title,
                assets,
            })
        }
    }
    return sections
}