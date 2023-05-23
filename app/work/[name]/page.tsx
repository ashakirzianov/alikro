'use client'
import { assets } from "@/app/assets"
import { assetAlt, assetHeight, assetSrc, assetWidth, urlSegmentToName } from "@/app/utils"
import Image from "next/image"
import { useRouter } from "next/navigation"

export default function Page({ params: { name } }: {
    params: { name: string },
}) {
    let router = useRouter()
    let assetName = urlSegmentToName(name)
    let asset = assets.find((asset) => asset.name === assetName)
    if (asset === undefined) {
        return <div>Asset not found</div>
    }
    return <div>
        <Image
            src={assetSrc(asset)}
            alt={assetAlt(asset)}
            width={assetWidth(asset)}
            height={assetHeight(asset)}
            onClick={() => router.back()}
        />
    </div>
}