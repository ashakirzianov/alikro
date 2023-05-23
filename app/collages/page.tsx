import { GalleryPage } from "@/app/Gallery"
import { Metadata } from "next"

const title = 'Collages'
const description = "'Alikro's collages."
export const metadata: Metadata = {
  title, description,
  openGraph: {
    title, description,
  },
  twitter: {
    title, description,
  },
}

export default function Page() {
    return <GalleryPage kind="collage" />
}