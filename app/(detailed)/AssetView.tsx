import { AssetImage } from "@/shared/AssetImage"
import { AssetMetadata } from "@/shared/assets"
import { filterForPathname, hrefForConsole, hrefForMaterial, hrefForYear } from "@/shared/href"
import Link from "next/link"

export function AssetView({
    asset, pathname, authenticated,
}: {
    asset: AssetMetadata,
    pathname: string,
    authenticated?: boolean,
}) {
    return <div className="flex flex-col items-center text-m text-accent">
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
        <div className="flex flex-row gap-1 p-2">
            {asset.title ?? 'Untitled'}
            {asset.year &&
                <span>
                    (<Link href={hrefForYear({ year: asset.year })} className="hover:underline">
                        {asset.year}
                    </Link>)
                </span>
            }
            {asset.material &&
                <span>
                    ,&nbsp;<Link href={hrefForMaterial({
                        material: asset.material,
                    })} className="hover:underline">
                        {asset.material}
                    </Link>
                </span>
            }
        </div>
        {authenticated && <Link href={hrefForConsole({
            assetId: asset.id,
            filter: filterForPathname(pathname),
        })} className="hover:underline">edit</Link>}
    </div>
}