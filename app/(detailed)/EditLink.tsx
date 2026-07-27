'use client'
import { hrefForEdit } from "@/shared/href"
import { useIsClient, useShowEditButton } from "@/shared/setting"
import Link from "next/link"

export function EditLink({ asset, pathname }: {
    asset: { id: string, cmsEditPath?: string },
    pathname: string,
}) {
    const isClient = useIsClient()
    const [showEditButton] = useShowEditButton()
    if (!showEditButton || !isClient) {
        return null
    }
    return <Link href={hrefForEdit({ asset, pathname })}
        className="hover:underline"
        target="_blank" rel="noopener noreferrer"
    >edit</Link>
}
