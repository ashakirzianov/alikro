import { GalleryPage } from "@/app/Gallery"
import { Metadata } from "next"

const title = 'Drawings'
const description = "'Alikro's drawings."
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
    return <GalleryPage kind="drawing" />
}