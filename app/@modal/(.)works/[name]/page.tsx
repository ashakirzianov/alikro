'use client'
import { assets, assetAlt, assetHeight, assetSrc, assetWidth, findAssetForSegment } from "@/shared/assets"
import { Modal } from "@/shared/Modal"
import Image from "next/image"
import { useRouter } from "next/navigation"
import React from "react"


export default function Page({ params: { name } }: {
    params: { name: string },
}) {
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