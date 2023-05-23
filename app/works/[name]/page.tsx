import { assets } from "@/shared/assets"
import {
    assetAlt, assetDescription, assetHeight, assetSegment, assetSrc, assetWidth, 
    findAssetForSegment,
    findDuplicates,
 } from "@/shared/utils"
import Image from "next/image"

export async function generateStaticParams() {
    let segments = assets.map((asset) => assetSegment(asset))
    let dups = findDuplicates(segments, (a, b) => a === b)
    if (dups.length > 0) {
        console.error(`Duplicate asset segments: ${dups.join(', ')}`)
    }
    return segments.map((segment) => ({
        name: segment,
    }))
}

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