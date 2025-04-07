import {
    assetDescription,
} from "@/shared/assets"
import { getAllAssetMetadata, getAssetMetadata } from "@/shared/metadataStore"
import { findDuplicates } from "@/shared/utils"
import { AssetImage } from "@/shared/AssetImage"

export async function generateStaticParams() {
    const assets = await getAllAssetMetadata()
    const segments = assets.map(a => a.id)
    const dups = findDuplicates(segments, (a, b) => a === b)
    if (dups.length > 0) {
        console.error(`Duplicate asset segments: ${dups.join(', ')}`)
    }
    return segments.map((segment) => ({
        name: segment,
    }))
}

type Props = {
    params: Promise<{ name: string }>,
}
export async function generateMetadata(props: Props) {
    const params = await props.params

    const {
        name
    } = params

    const asset = await getAssetMetadata(name)
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
    }
}

export default async function Page(props: Props) {
    const params = await props.params

    const {
        name
    } = params

    const asset = await getAssetMetadata(name)
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
        <div className="flex text-m text-accent p-2">
            {assetDescription(asset)}
        </div>
    </div>
}