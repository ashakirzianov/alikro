import { seed } from "./metadataStore"
import { getAssetMetadataForSeed } from "./seedData"

export async function seedAssetMetadata() {
    return seed(getAssetMetadataForSeed(), false)
}