import { AssetPage } from "@/app/(detailed)/AssetsPage"
import { generateMetadataForAssetId } from "@/app/(detailed)/common"

export const dynamicParams = true
export async function generateStaticParams() {
    return []
}

type Props = {
    params: Promise<{ tag: string, id: string }>,
}
export async function generateMetadata(props: Props) {
    const { id } = await props.params
    return generateMetadataForAssetId(id)
}

export default async function Page(props: Props) {
    const { tag, id } = await props.params
    const pathname = `/tag/${tag}/${id}`
    return <AssetPage
        assetId={id}
        pathname={pathname}
    />
}