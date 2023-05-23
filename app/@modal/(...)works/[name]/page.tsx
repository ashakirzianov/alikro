'use client'
import { assets } from "@/shared/assets"
import { assetAlt, assetHeight, assetSrc, assetWidth, urlSegmentToName } from "@/shared/utils"
import { Modal } from "@/shared/Modal"
import Image from "next/image"
import { useRouter } from "next/navigation"
import React from "react"


export default function Page({ params: { name } }: {
    params: { name: string },
}) {
    let router = useRouter()
    let dismiss = () => router.back()
    let assetName = urlSegmentToName(name)
    let asset = assets.find((asset) => asset.name === assetName)
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