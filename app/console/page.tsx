import { extractUniqueKinds, extractUniqueTags, sortAssets } from "@/shared/assets"
import { getAllAssetMetadata } from "@/shared/metadataStore"
import ConsoleGrid from "./ConsoleGrid"
import { isAuthenticated, authenticate } from "@/shared/auth"
import { redirect } from "next/navigation"

export default async function Page() {
    const auth = await isAuthenticated()
    if (!auth) {
        return <Authenticator />
    }
    const unsorted = await getAllAssetMetadata()
    const assets = sortAssets(unsorted)

    // Extract unique kinds and tags using the utility functions
    const kinds = extractUniqueKinds(assets)
    const tags = extractUniqueTags(assets)

    return (
        <div className="flex flex-col h-screen">
            <ConsoleGrid assets={assets} kinds={kinds} tags={tags} />
        </div>
    )
}

async function Authenticator() {
    const handleSubmit = async (formData: FormData) => {
        'use server'
        const password = formData.get('password') as string
        const success = await authenticate(password)
        if (success) {
            // Revalidate the page to show the console
            redirect('/console')
        }
    }

    return (
        <form action={handleSubmit} className="flex flex-col items-center justify-center h-screen">
            <input
                type="password"
                name="password"
                placeholder="Enter password"
                className="mb-4 p-2 border border-accent rounded"
                autoComplete="current-password"
            />
            <button type="submit" className="p-2 border border-accent rounded bg-accent text-secondary hover:bg-secondary hover:text-accent">Authenticate</button>
        </form>
    )
}