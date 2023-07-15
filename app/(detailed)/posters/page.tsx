import { GalleryPage } from "@/app/Gallery"
import { Metadata } from "next"

const title = 'Posters'
const description = "'Alikro's posters."
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
    return <GalleryPage kind="poster" />
}