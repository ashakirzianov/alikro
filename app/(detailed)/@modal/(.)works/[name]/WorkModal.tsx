'use client'
import { AssetMetadata } from "@/shared/assets"
import { Modal } from "@/shared/Modal"
import { AssetImage } from "@/shared/AssetImage"
import { useRouter } from "next/navigation"
import React from "react"

export function WorkModal({ asset }: {
    asset: AssetMetadata,
}) {
    const router = useRouter()
    const dismiss = () => router.back()
    return <Modal onDismiss={dismiss}>
        <div onClick={dismiss}>
            <AssetImage
                asset={asset}
                size="full"
                style={{
                    objectFit: 'contain',
                    maxWidth: '100svw',
                    maxHeight: '100svh',
                    cursor: 'default'
                }}
            />
        </div>
    </Modal>
}