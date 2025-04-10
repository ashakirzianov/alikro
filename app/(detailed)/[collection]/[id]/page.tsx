import {
    assetDescription,
} from "@/shared/assets"
import { getAssetMetadata } from "@/shared/metadataStore"
import { AssetImage } from "@/shared/AssetImage"
import { isAuthenticated } from "@/shared/auth"
import { filterForPathname, hrefForConsole } from "@/shared/href"
import Link from "next/link"
import { generateMetadataForAssetId } from "../../common"

export const dynamicParams = true
export async function generateStaticParams() {
    return []
}

type Props = {
    params: Promise<{ collection: string, id: string }>,
}
export async function generateMetadata(props: Props) {
    const { id } = await props.params
    return generateMetadataForAssetId(id)
}

export default async function Page(props: Props) {
    const params = await props.params

    const { collection, id } = params
    const pathname = `/${collection}/${id}`
    const auth = await isAuthenticated()

    const asset = await getAssetMetadata(id)
    if (asset === undefined) {
        return 'Not found'
    }
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
            {auth && <Link href={hrefForConsole({
                assetId: asset.id,
                filter: filterForPathname(pathname),
            })}>edit</Link>}
        </div>
    </div>
}