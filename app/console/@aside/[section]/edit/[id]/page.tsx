import { getAllAssetMetadata } from "@/shared/metadataStore"
import { getAssetsOrderRange } from "@/app/console/common"
import { extractUniqueKinds, extractUniqueTags } from "@/shared/assets"
import AssetEditor from "@/app/console/AssetEditor"

export default async function Page({ params }: {
    params: Promise<{ id: string }>,
}) {
    const { id } = await params
    const unsorted = await getAllAssetMetadata()
    const asset = unsorted.find(a => a.id === id)
    if (!asset) {
        return null
    }
    const orderRange = getAssetsOrderRange(unsorted)
    const kinds = extractUniqueKinds(unsorted)
    const tags = extractUniqueTags(unsorted)
    return <AssetEditor
        asset={asset}
        orderRange={orderRange}
        kinds={kinds}
        tags={tags}
    />
}

