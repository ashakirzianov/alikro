import { Gallery } from "@/app/Gallery"
import { assetsForQuery, sortAssets } from "@/shared/assets"
import { getAllAssetMetadata } from "@/shared/metadataStore"
import { allSections, sectionForPath } from "@/shared/sections"

type Props = {
    category: string,
}
type Params = Promise<Props>

export async function generateStaticParams(): Promise<Props[]> {
    const sections = allSections()
    return sections.map(section => ({
        category: section.path,
    }))
}

export async function generateMetadata({ params }: { params: Params }) {
    const { category } = await params
    let title = 'Not found'
    let description = 'Not found'
    const section = sectionForPath(category)
    if (section !== undefined) {
        title = section.title
        description = section.description
    }
    return {
        title, description,
        openGraph: {
            title, description,
        },
        twitter: {
            title, description,
        },
    }
}

export default async function Page({
    params,
}: {
    params: Promise<{ category: string }>
}) {
    const { category } = await params
    const section = sectionForPath(category)
    if (section === undefined) {
        return null
    }
    const unsorted = await getAllAssetMetadata()
    const assets = sortAssets(unsorted)
    const filtered = assetsForQuery(assets, section.query)
    return <Gallery assets={filtered} path={section.path} />
}