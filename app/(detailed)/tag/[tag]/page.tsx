import { generateMetadataForAssetId } from "../../common"
import { AssetsPage } from "../../AssetsPage"

type Props = {
    tag: string,
}
type Params = Promise<Props>

export async function generateStaticParams(): Promise<Props[]> {
    return []
}

export async function generateMetadata({
    params, searchParams,
}: {
    params: Params,
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>,
}) {
    const { show } = await searchParams
    if (typeof show === 'string') {
        return generateMetadataForAssetId(show as string)
    }
    const { tag } = await params
    const title = `Alikro | ${tag}`
    const description = `Alikro's works marked as '${tag}'`
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

export default async function Page({
    params, searchParams,
}: {
    params: Params,
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>,
}) {
    const { tag } = await params
    const { show } = await searchParams
    const pathname = `/tag/${tag}`
    const modalAssetId = typeof show === 'string' ? show : undefined

    return <AssetsPage
        query={tag}
        pathname={pathname}
        modalAssetId={modalAssetId}
    />
}