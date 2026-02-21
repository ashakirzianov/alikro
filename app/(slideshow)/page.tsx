import { AssetMetadata } from "@/shared/asset"
import { getAssetsForSlideshow } from "@/shared/metadataStore"
import { allCollections, Collection } from "@/shared/collection"
import { SlideData, ClientsideSlideshow } from "./Slideshow"
import { assetsForQuery } from "@/shared/query"

export default async function Page() {
    const assets = await getAssetsForSlideshow()
    const slides = buildSlides(assets, allCollections())
    return <ClientsideSlideshow slides={slides} />
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

