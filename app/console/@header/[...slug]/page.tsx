import { parseConsoleSlug } from "../../common"
import { redirect } from 'next/navigation'
import { getAllAssetMetadata } from "@/shared/metadataStore"
import { extractUniqueKinds, extractUniqueTags } from "@/shared/assets"
import ConsoleHeader from "@/app/console/ConsoleHeader"
import { hrefForConsole } from "@/shared/href"

export default async function Page({ params }: {
    params: Promise<{ slug: string[] }>,
}) {
    const { slug } = await params
    const { section, action } = parseConsoleSlug(slug)
    if (section === undefined) {
        redirect(hrefForConsole('all'))
    }

    const unsorted = await getAllAssetMetadata()
    const kinds = extractUniqueKinds(unsorted)
    const tags = extractUniqueTags(unsorted)

    return <ConsoleHeader
        kinds={kinds}
        tags={tags}
        selectedSection={section}
        selectedAction={action}
    />
}