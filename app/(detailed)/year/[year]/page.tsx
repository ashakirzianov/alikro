import { notFound } from "next/navigation"
import { metadataForCollection } from "../../common"
import { Gallery } from "@/app/Gallery"
import { getAssetsForYear, getUniquePropertyValues } from "@/shared/metadataStore"

type Props = {
    year: string,
}
export async function generateStaticParams(): Promise<Props[]> {
    const years = await getUniquePropertyValues('year')
    return years
        .map(year => ({
            year: year.toString(),
        }))
}

export async function generateMetadata({ params }: { params: Promise<Props> }) {
    const { year } = await params
    const title = `Alikro | ${year}`
    const description = `Alikro's works made in '${year}'`
    return metadataForCollection({
        title, description,
        pathname: `/year/${year}`,
    })
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