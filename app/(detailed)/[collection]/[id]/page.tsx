import { generateMetadataForAssetId } from "../../common"
import { AssetPage } from "../../AssetsPage"

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
    return <AssetPage
        assetId={id}
        pathname={pathname}
    />
}