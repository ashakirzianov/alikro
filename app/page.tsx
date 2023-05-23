import { assetHref, assets } from "@/shared/assets"
import { findDuplicates } from "@/shared/utils"
import { Gallery } from "@/app/Gallery"

export default function Page() {
  throwOnDuplicates()
  return <Gallery assets={assets} />
}

function throwOnDuplicates() {
  let dups = findDuplicates(assets, (a, b) => assetHref(a) === assetHref(b))
  if (dups.length > 0) {
    throw new Error(`Duplicate assets found: ${dups.map((asset) => assetHref(asset)).join(', ')}`)
  }
}