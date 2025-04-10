import { assetDescription, assetsForPath, assetsForQuery, sortAssets } from "@/shared/assets"
import React from "react"
import { WorkModal } from "./WorkModal"
import { getAssetMetadata, getAllAssetMetadata } from "@/shared/metadataStore"
import { isAuthenticated } from "@/shared/auth"
import { allSections } from "@/shared/sections"

type Props = {
  params: Promise<{ name: string }>,
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>,
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

export default async function Page({ params, searchParams }: Props) {
  const { name } = await params
  const { from } = await searchParams
  const section = typeof from === 'string'
    ? from ?? 'all'
    : 'all'

  // Fetch the current asset and all assets for navigation
  const unsorted = await getAllAssetMetadata()
  const sorted = sortAssets(unsorted)
  // TODO: unify filtering logic
  const assets = assetsForPath(sorted, allSections(), section)
  const assetId = name
  const index = unsorted.findIndex(a => a.id === assetId)

  if (index === -1) {
    return 'not found'
  }
  const authenticated = await isAuthenticated()

  return <WorkModal
    assets={assets}
    assetId={assetId}
    section={section}
    authenticated={authenticated} />
}