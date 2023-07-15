'use client'
import { assetAlt, assetHeight, assetSrc, assetWidth, Asset } from "@/shared/assets"
import { Modal } from "@/shared/Modal"
import Image from "next/image"
import { useRouter } from "next/navigation"
import React from "react"

export function WorkModal({ asset }: {
    asset: Asset,
}) {
    let router = useRouter()
    let dismiss = () => router.back()
    return <Modal onDismiss={dismiss}>
        <Image
            src={assetSrc(asset)}
            alt={assetAlt(asset)}
            width={assetWidth(asset)}
            height={assetHeight(asset)}
            onClick={dismiss}
            style={{
                objectFit: 'contain',
                maxWidth: '100svw',
                maxHeight: '100svh',
                cursor: 'default',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                MozUserSelect: 'none',
                msUserSelect: 'none',
            }}
        />
    </Modal>
}