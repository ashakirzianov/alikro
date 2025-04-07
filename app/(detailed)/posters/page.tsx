import { GalleryPage } from "@/app/Gallery"
import { sortAssets } from "@/shared/assets"
import { getAllAssetMetadata } from "@/shared/metadataStore"
import { Metadata } from "next"

const title = 'Posters'
const description = "'Alikro's posters."
export const metadata: Metadata = {
  title,
  description,

  openGraph: {
    title, description,
  },

  twitter: {
    title, description,
  }
}

export default async function Page() {
  const unsorted = await getAllAssetMetadata()
  const assets = sortAssets(unsorted)
  return <GalleryPage assets={assets} kind="poster" />
}