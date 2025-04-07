import { assetsForQuery, not, and, sortAssets } from "@/shared/assets"
import { ClientsideDynamicPage } from "./DynamicLayout"
import { getAllAssetMetadata } from "@/shared/metadataStore"

export default async function Page() {
    const unsorted = await getAllAssetMetadata()
    const assets = sortAssets(unsorted)
    const selfportraits = assetsForQuery(assets, 'selfportrait')
    const drawings = [
        ...assetsForQuery(assets, and('drawing', 'favorite', not('selfportrait'))),
        ...assetsForQuery(assets, and('drawing', not('favorite'), not('selfportrait'))),
    ]
    const illustrations = [
        ...assetsForQuery(assets, and('illustration', 'favorite', not('selfportrait'))),
        ...assetsForQuery(assets, and('illustration', not('favorite'), not('selfportrait'))),
    ]
    const paintings = [
        ...assetsForQuery(assets, and('painting', 'favorite', not('selfportrait'))),
        ...assetsForQuery(assets, and('painting', not('favorite'), not('selfportrait'))),
    ]
    const posters = [
        ...assetsForQuery(assets, and('poster', not('secondary'))),
        ...assetsForQuery(assets, and('painting', 'secondary')),
    ]
    const collages = [
        ...assetsForQuery(assets, and('collage', 'favorite')),
        ...assetsForQuery(assets, and('collage', not('favorite'))),
    ]
    const tattoos = assetsForQuery(assets, 'tattoo')
    return <ClientsideDynamicPage slides={[
        selfportraits,
        drawings,
        illustrations,
        paintings,
        posters,
        collages,
        tattoos,
    ]} />
}

