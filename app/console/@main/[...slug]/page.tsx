import { assetsForQuery, sortAssets } from "@/shared/assets"
import { getAllAssetMetadata } from "@/shared/metadataStore"
import { redirect } from "next/navigation"
import { parseConsoleSlug } from "@/app/console/common"
import { ConsoleGrid } from '@/app/console/ConsoleGrid'

export default async function Page({ params }: {
    params: Promise<{ slug: string[] }>
}) {
    const { slug } = await params
    const { section, id } = parseConsoleSlug(slug)
    if (section === undefined) {
        redirect('/console/all')
    }
    const unsorted = await getAllAssetMetadata()
    const unfiltered = sortAssets(unsorted)
    const query = section === 'all' ? null : section
    const assets = assetsForQuery(unfiltered, query)

    return <ConsoleGrid
        section={section}
        assets={assets}
        selectedAssetId={id}
    />

}