import { assetsForQuery, sortAssets, AssetMetadata } from "@/shared/assets"
import { ClientsideDynamicPage, SlideData } from "./DynamicLayout"
import { getAllAssetMetadata } from "@/shared/metadataStore"
import { allSections, Section } from "@/shared/sections"

export default async function Page() {
    const unsorted = await getAllAssetMetadata()
    const assets = sortAssets(unsorted)
    const slides = buildSlides(assets, allSections())
    return <ClientsideDynamicPage slides={slides} />
}

function buildSlides(allAssets: AssetMetadata[], sections: Section[]): SlideData[] {
    return sections
        .map(section => slideDataForSection(allAssets, section))
        .filter(slide => slide.assets.length > 0)
}

function slideDataForSection(allAssets: AssetMetadata[], {
    path, title, query,
    slideAltPath, slideAndQuery, slideLinks,
}: Section): SlideData {
    let assets = assetsForQuery(allAssets, query)
    if (slideAndQuery !== undefined) {
        assets = assetsForQuery(assets, slideAndQuery)
    }
    const href = slideAltPath !== undefined
        ? `/${slideAltPath}`
        : `/${path}`
    return {
        href,
        title,
        assets,
        includeLinks: slideLinks === true,
    }
}

