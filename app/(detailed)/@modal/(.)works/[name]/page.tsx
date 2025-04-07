import { assetDescription } from "@/shared/assets"
import React from "react"
import { WorkModal } from "./WorkModal"
import { getAssetMetadata } from "@/shared/metadataStore"

type Props = {
  params: Promise<{ name: string }>,
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

export default async function Page(props: Props) {
  const params = await props.params

  const {
    name
  } = params

  const asset = await getAssetMetadata(name)
  if (asset === undefined) {
    return 'Not found'
  }
  return <WorkModal asset={asset} />
}