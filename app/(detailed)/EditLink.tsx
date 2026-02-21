'use client'
import { filterForPathname, hrefForConsole } from "@/shared/href"
import { useIsClient, useShowEditButton } from "@/shared/setting"
import Link from "next/link"

export function EditLink({ asset, pathname }: { asset: { id: string }, pathname: string }) {
    const isClient = useIsClient()
    const [showEditButton] = useShowEditButton()
    if (!showEditButton || !isClient) {
        return null
    }
    return <Link href={hrefForConsole({
        assetId: asset.id,
        filter: filterForPathname(pathname),
    })}
        className="hover:underline"
        target="_blank" rel="noopener noreferrer"
    >edit</Link>
}