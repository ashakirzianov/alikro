import {
    assetDescription,
    assetSrc,
} from "@/shared/assets"
import { getAllAssetMetadata, getAssetMetadata } from "@/shared/metadataStore"
import { findDuplicates } from "@/shared/utils"
import { AssetImage } from "@/shared/AssetImage"
import { isAuthenticated } from "@/shared/auth"
import { hrefForConsole } from "@/shared/href"
import Link from "next/link"

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
    if (!asset) {
        return {
            title: 'Not found',
            description: 'Not found',
            openGraph: {
                title: 'Not found',
                description: 'Not found',
            },
            twitter: {
                title: 'Not found',
                description: 'Not found',
            },
        }
    }
    const title = asset?.title ?? 'Picture'
    const description = asset ? assetDescription(asset) : 'My work'
    const images = [{
        url: assetSrc(asset),
        alt: title,
    }]
    return {
        title, description,
        openGraph: {
            title, description, images,
        },
        twitter: {
            title, description, images,
        },
    }
}

export default async function Page(props: Props) {
    const params = await props.params

    const {
        name
    } = params
    const auth = await isAuthenticated()

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
        <div className="flex flex-row gap-1 text-m text-accent p-2">
            <span>{assetDescription(asset)}</span>
            {auth && <Link href={hrefForConsole({
                assetId: asset.id,
            })}>edit</Link>}
        </div>
    </div>
}