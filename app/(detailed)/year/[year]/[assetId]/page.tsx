import { notFound } from "next/navigation"
import { Gallery } from "@/app/Gallery"
import { getAssetsForYear } from "@/shared/metadataStore"
import { generateMetadataForAssetId } from "@/app/(detailed)/common"

type Props = {
    year: string,
    assetId: string,
}
export async function generateStaticParams({ params: { year } }: {
    params: Omit<Props, 'assetId'>,
}): Promise<Props[]> {
    const parsedYear = parseInt(year)
    if (isNaN(parsedYear)) {
        return []
    }
    const assets = await getAssetsForYear(parsedYear)
    return assets
        .map(asset => ({
            year,
            assetId: asset.id,
        }))
}

export async function generateMetadata({ params }: { params: Promise<Props> }) {
    const { assetId } = await params
    return generateMetadataForAssetId(assetId)
}

export default async function Page({
    params,
}: {
    params: Promise<Props>,
}) {
    const { year } = await params
    const parsedYear = parseInt(year)
    if (isNaN(parsedYear)) {
        return notFound()
    }
    const pathname = `/year/${year}`
    const assets = await getAssetsForYear(parsedYear)
    return <Gallery
        assets={assets}
        pathname={pathname}
    />
}