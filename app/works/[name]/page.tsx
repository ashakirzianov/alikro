import { assets } from "@/shared/assets"
import { assetAlt, assetHeight, assetSrc, assetWidth, urlSegmentToName } from "@/shared/utils"
import Image from "next/image"

export default function Page({ params: { name } }: {
    params: { name: string },
}) {
    let assetName = urlSegmentToName(name)
    let asset = assets.find((asset) => asset.name === assetName)
    if (asset === undefined) {
        return 'Not found'
    }
    return <div>
        <Image
            style={{
                maxHeight: '100vh',
            }}
            src={assetSrc(asset)}
            alt={assetAlt(asset)}
            width={assetWidth(asset)}
            height={assetHeight(asset)}
        />
    </div>
}