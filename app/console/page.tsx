import { getAllAssetMetadata } from "@/shared/metadataStore"
import ConsolePage from "./ConsolePage"
import { sortAssets } from "@/shared/assets"
import { Authenticator, isAuthenticated } from "./Authenticator"

export default async function Page({ searchParams }: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    if (!isAuthenticated()) {
        return <Authenticator />
    }
    const resolved = await searchParams
    const unsorted = await getAllAssetMetadata()
    const assets = sortAssets(unsorted)
    return <ConsolePage
        assets={assets}
        searchParams={resolved}
    />
}