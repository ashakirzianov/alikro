import { assets, findAssetForSegment, assetDescription } from "@/shared/assets"
import React from "react"
import { WorkModal } from "./WorkModal"

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
    }
}

export default function Page({ params: { name } }: Props) {
    let asset = findAssetForSegment(assets, name)
    if (asset === undefined) {
        return 'Not found'
    }
    return <WorkModal asset={asset}/>
}