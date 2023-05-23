import { GalleryPage } from "@/app/Gallery"
import { Metadata } from "next"

const title = 'Tattoos'
const description = "'Alikro's tattoss."
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
    return <GalleryPage kind="tattoo" />
}