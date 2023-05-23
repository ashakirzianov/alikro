import { assets } from "@/shared/assets"
import {
    assetAlt, assetDescription, assetHeight, assetSegment, assetSrc, assetWidth, findAssetForSegment,
 } from "@/shared/assets"
import { findDuplicates } from "@/shared/utils"
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

type Props = {
    params: { name: string },
}
export async function generateMetadata({ params: {name} }: Props) {
    let asset = findAssetForSegment(assets, name)
    const title = asset?.title ?? 'Picture'
    const description = asset ? assetDescription(asset) : 'My work'
    return {
      title, description,
      openGraph: {
        title, description,
      },
      twitter: {
        title, description,
      },
    };
}

export default function Page({ params: { name } }: Props) {
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