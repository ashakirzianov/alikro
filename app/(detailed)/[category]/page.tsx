import { Gallery } from "@/app/Gallery"
import { assetsForQuery, sortAssets } from "@/shared/assets"
import { isAuthenticated } from "@/shared/auth"
import { getAllAssetMetadata, getAssetMetadata } from "@/shared/metadataStore"
import { allSections, sectionForPath } from "@/shared/sections"
import { ogImagesForAsset } from "./utils"

type Props = {
    category: string,
}
type Params = Promise<Props>

export async function generateStaticParams(): Promise<Props[]> {
    const sections = allSections()
    return sections.map(section => ({
        category: section.path,
    }))
}

export async function generateMetadata({
    params, searchParams,
}: {
    params: Params,
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>,
}) {
    const { category } = await params
    let title = 'Not found'
    let description = 'Not found'
    const section = sectionForPath(category)
    if (section !== undefined) {
        title = section.title
        description = section.description
    }
    const { show } = await searchParams
    const modalAssetId = typeof show === 'string' ? show : undefined
    const asset = modalAssetId
        ? await getAssetMetadata(modalAssetId)
        : undefined
    const images = asset ? ogImagesForAsset(asset) : undefined
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

export default async function Page({
    params, searchParams,
}: {
    params: Promise<{ category: string }>
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>,
}) {
    const { category } = await params
    const section = sectionForPath(category)
    if (section === undefined) {
        return null
    }
    const { show } = await searchParams
    let modalAssetId = typeof show === 'string' ? show : undefined
    const unsorted = await getAllAssetMetadata()
    const assets = sortAssets(unsorted)
    const filtered = assetsForQuery(assets, section.query)
    modalAssetId = filtered.some(asset => asset.id === modalAssetId)
        ? modalAssetId
        : undefined

    const pathname = `/${category}`
    const authenticated = await isAuthenticated()

    return <Gallery
        assets={filtered}
        pathname={pathname}
        modalAssetId={modalAssetId}
        authenticated={authenticated}
    />
}