import { notFound } from "next/navigation"
import { getTiles } from "@/app/(detailed)/tiles"
import { Gallery } from "@/app/(detailed)/Gallery"
import { generateMetadataForCollectionId } from "@/app/(detailed)/metadata"
import { allCollections } from "@/shared/collection"

type Props = {
    filter: string,
}

export async function generateStaticParams(): Promise<Props[]> {
    const filters = allCollections().map(collection => collection.id)
    return [...filters, 'tag'].map(filter => ({
        filter,
    }))
}

export async function generateMetadata({
    params,
}: {
    params: Promise<Props>,
}) {
    const { filter } = await params
    return generateMetadataForCollectionId(filter)
}

export default async function Page({
    params,
}: {
    params: Promise<Props>,
}) {
    const { filter } = await params
    const pathname = `/${filter}`

    const tiles = await getTiles(filter, undefined)
    if (tiles.length === 0) {
        notFound()
    }

    return <Gallery
        tiles={tiles}
        pathname={pathname}
    />
}