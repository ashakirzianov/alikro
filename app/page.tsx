import { assets } from "@/shared/assets"
import { Gallery } from "@/app/Gallery"
import { assetHref, findDuplicates } from "@/shared/utils"

export default function Page() {
  return <Gallery assets={assets} />
}