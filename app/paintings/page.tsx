import { GalleryPage } from "@/app/Gallery"
import { Metadata } from "next"

const title = 'Paintings'
const description = "'Alikro's paintings."
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
    return <GalleryPage kind="painting" />
}