import { AllWorksPage } from "@/app/Gallery"
import { Metadata } from "next"

const title = 'All'
const description = "All works by Alikro."
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
    return <AllWorksPage />
}