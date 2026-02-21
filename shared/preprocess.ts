import { AssetMetadata } from "./asset"

export function preproccessAssets(assets: AssetMetadata[]): AssetMetadata[] {
    return assets.filter(asset => asset.kind !== 'tattoo')
}