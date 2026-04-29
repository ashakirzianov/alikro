import { AssetMetadata } from "@/shared/asset"
import { getAssetsForSlideshow } from "@/shared/metadataStore"
import { allSlides, Slide } from "@/shared/slide"
import { SlideData, ClientsideSlideshow } from "./Slideshow"
import { assetsForQuery } from "@/shared/query"

export default async function Page() {
    const assets = await getAssetsForSlideshow()
    const slides = buildSlides(assets, allSlides())
    return <ClientsideSlideshow slides={slides} />
}

const MIN_ASSETS_PER_SLIDE = 10
function buildSlides(allAssets: AssetMetadata[], slides: Slide[]): SlideData[] {
    return slides
        .map(slide => slideDataForSlide(allAssets, slide))
        .filter(slide => slide.assets.length >= MIN_ASSETS_PER_SLIDE)
}

function slideDataForSlide(allAssets: AssetMetadata[], slide: Slide): SlideData {
    const assets = assetsForQuery(allAssets, slide.query)
    return {
        href: slide.href,
        title: slide.title,
        assets,
        includeLinks: slide.includeLinks === true,
    }
}
