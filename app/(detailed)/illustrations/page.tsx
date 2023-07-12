import { GalleryPage } from "@/app/Gallery"
import { Metadata } from "next"

const title = 'Illustrations'
const description = "'Alikro's illustrations."
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
    return <GalleryPage kind="illustration" />
}