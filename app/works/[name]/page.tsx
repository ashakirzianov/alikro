import { assets } from "@/shared/assets"
import {
    assetAlt, assetDescription, assetHeight, assetSrc, assetWidth, 
    findAssetForSegment,
 } from "@/shared/utils"
import Image from "next/image"

export default function Page({ params: { name } }: {
    params: { name: string },
}) {
    let asset = findAssetForSegment(assets, name)
    if (asset === undefined) {
        return 'Not found'
    }
    return <div className="flex flex-col justify-center">
        <Image
            style={{
                maxHeight: '100vh',
            }}
            src={assetSrc(asset)}
            alt={assetAlt(asset)}
            width={assetWidth(asset)}
            height={assetHeight(asset)}
        />
        <div className="flex text-m text-accent self-center p-2">
                {assetDescription(asset)}
        </div>
    </div>
}