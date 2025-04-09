import { JsonEditor } from "@/app/console/JsonEditor"
import { assetMetadataUpdate } from "@/shared/assets"
import { getAllAssetMetadata } from "@/shared/metadataStore"

export default async function Page() {
    const allAssets = await getAllAssetMetadata()

    const updates = allAssets.map(assetMetadataUpdate)
    const json = JSON.stringify(updates, null, 2)
    return <JsonEditor initialJson={json} />
}
