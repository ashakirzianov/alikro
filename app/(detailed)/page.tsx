import { assetHref, all } from "@/shared/assets"
import { findDuplicates } from "@/shared/utils"
import { Gallery } from "@/app/Gallery"

export default function Page() {
  throwOnDuplicates()
  return <Gallery assets={all()} />
}

function throwOnDuplicates() {
  let dups = findDuplicates(all(), (a, b) => assetHref(a) === assetHref(b))
  if (dups.length > 0) {
    throw new Error(`Duplicate assets found: ${dups.map((asset) => assetHref(asset)).join(', ')}`)
  }
}