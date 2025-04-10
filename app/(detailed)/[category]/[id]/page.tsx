import {
    assetDescription,
    assetsForQuery,
} from "@/shared/assets"
import { getAllAssetMetadata, getAssetMetadata } from "@/shared/metadataStore"
import { AssetImage } from "@/shared/AssetImage"
import { isAuthenticated } from "@/shared/auth"
import { hrefForConsole } from "@/shared/href"
import Link from "next/link"
import { allSections } from "@/shared/sections"
import { ogImagesForAsset } from "../utils"

export async function generateStaticParams() {
    const assets = await getAllAssetMetadata()
    const sections = allSections()
    return sections.map(
        section => assetsForQuery(assets, section.query)
            .map(asset => ({
                category: section.path,
                id: asset.id,
            }))
    ).flat()
}

type Props = {
    params: Promise<{ category: string, id: string }>,
}
export async function generateMetadata(props: Props) {
    const params = await props.params

    const {
        id
    } = params

    const asset = await getAssetMetadata(id)
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
    const images = ogImagesForAsset(asset)
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
        id
    } = params
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
            })}>edit</Link>}
        </div>
    </div>
}