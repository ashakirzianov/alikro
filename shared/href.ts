import { sectionForPath } from "./sections"

export function hrefForAsset({ pathname, assetId }: {
    pathname?: string,
    assetId: string,
}) {
    return `${pathname ?? '/all'}/${assetId}`
}

export function hrefForAssetModal({ pathname, assetId }: {
    pathname: string,
    assetId: string,
}) {
    return `${pathname}?show=${assetId}`
}

export function hrefForSection(category: string) {
    return `/${category}`
}

export function hrefForConsole({
    pathname, action, assetId
}: {
    pathname?: string,
    action?: string,
    assetId?: string,
}): string {
    const searchParams = new URLSearchParams()
    const filter = filterForPathname(pathname)
    if (filter) {
        searchParams.set('filter', filter)
    }
    if (assetId) {
        searchParams.set('aside', `edit:${assetId}`)
    } else if (action) {
        searchParams.set('aside', action)
    }
    return searchParams.size === 0
        ? '/console'
        : `/console?${searchParams.toString()}`
}

function filterForPathname(pathname: string | undefined) {
    if (pathname === undefined) {
        return undefined
    }
    const path = pathname.substring(1)
    const section = sectionForPath(path)
    if (section) {
        return section.section
    } else {
        return undefined
    }
}