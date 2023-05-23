import { Asset, AssetKind } from "./assets"

export function assetsForKind(assets: Asset[], kind: AssetKind) {
    return assets.filter((asset) => asset.kind === kind)
}