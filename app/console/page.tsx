import { extractUniqueKinds, extractUniqueTags, sortAssets } from "@/shared/assets"
import { getAllAssetMetadata } from "@/shared/metadataStore"
import ConsoleGrid from "./ConsoleGrid"

export default async function Page() {
    const unsorted = await getAllAssetMetadata()
    const assets = sortAssets(unsorted)

    // Extract unique kinds and tags using the utility functions
    const kinds = extractUniqueKinds(assets)
    const tags = extractUniqueTags(assets)

    return (
        <div className="flex flex-col h-screen">
            <ConsoleGrid assets={assets} kinds={kinds} tags={tags} />
        </div>
    )
}