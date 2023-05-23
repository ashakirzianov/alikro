'use client'
import { assets, assetAlt, assetHeight, assetSrc, assetWidth, findAssetForSegment, assetDescription } from "@/shared/assets"
import { Modal } from "@/shared/Modal"
import Image from "next/image"
import { useRouter } from "next/navigation"
import React from "react"

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
    let router = useRouter()
    let dismiss = () => router.back()
    let asset = findAssetForSegment(assets, name)
    if (asset === undefined) {
        return 'Not found'
    }
    return <Modal onDismiss={dismiss}>
        <Image
            src={assetSrc(asset)}
            alt={assetAlt(asset)}
            width={assetWidth(asset)}
            height={assetHeight(asset)}
            onClick={dismiss}
        />
    </Modal>
}