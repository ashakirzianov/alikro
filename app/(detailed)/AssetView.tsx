import { AssetImage } from "@/shared/AssetImage"
import { assetDescription, AssetMetadata } from "@/shared/assets"
import { filterForPathname, hrefForConsole } from "@/shared/href"
import Link from "next/link"

export function AssetView({
    asset, pathname, authenticated,
}: {
    asset: AssetMetadata,
    pathname: string,
    authenticated?: boolean,
}) {
    return <div className="flex flex-col items-center">
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
        <div className="flex flex-row gap-1 text-m text-accent p-2">
            <span>{assetDescription(asset)}</span>
            {authenticated && <Link href={hrefForConsole({
                assetId: asset.id,
                filter: filterForPathname(pathname),
            })}>edit</Link>}
        </div>
    </div>
}