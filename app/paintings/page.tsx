import { assets } from "@/app/assets"
import { Gallery } from "@/app/Gallery"
import { assetsForKind } from "../../shared/utils"

export default function Page() {
    return <Gallery assets={assetsForKind(assets, 'painting')} />
}