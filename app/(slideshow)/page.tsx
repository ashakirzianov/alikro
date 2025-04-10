import { assetsForQuery, sortAssets, AssetMetadata } from "@/shared/assets"
import { ClientsideDynamicPage, SlideData } from "./DynamicLayout"
import { getAllAssetMetadata } from "@/shared/metadataStore"
import { allCollections, Collection } from "@/shared/collection"

export default async function Page() {
    const unsorted = await getAllAssetMetadata()
    const assets = sortAssets(unsorted)
    const slides = buildSlides(assets, allCollections())
    return <ClientsideDynamicPage slides={slides} />
}

const MIN_ASSETS_PER_SLIDE = 10
function buildSlides(allAssets: AssetMetadata[], collections: Collection[]): SlideData[] {
    return collections
        .map(collection => slideDataForSection(allAssets, collection))
        .filter(slide => slide.assets.length >= MIN_ASSETS_PER_SLIDE)
}

function slideDataForSection(allAssets: AssetMetadata[], {
    id: path, title, query,
    slideAltPath, slideAndQuery, slideLinks,
}: Collection): SlideData {
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

