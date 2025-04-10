import { collectionForId } from "./collection"

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

export function hrefForCollection({ collectionId }: {
    collectionId: string,
}) {
    return `/${collectionId}`
}

export function hrefForYear({ year }: {
    year: number,
}) {
    return `/year/${year}`
}

export function hrefForTag({ tag }: {
    tag: string,
}) {
    return `/tag/${tag}`
}

export function hrefForMaterial({ material }: {
    material: string,
}) {
    return `/material/${material}`
}

export function hrefForConsole({
    filter, action, assetId
}: {
    filter?: string,
    action?: string,
    assetId?: string,
}): string {
    const searchParams = new URLSearchParams()
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

export function filterForPathname(pathname: string | undefined) {
    if (pathname === undefined) {
        return undefined
    } else if (pathname.startsWith('/tag/')) {
        const tag = pathname.substring('/tag/'.length)
        return tag
    }
    const id = pathname.substring(1)
    const collection = collectionForId(id)
    if (collection) {
        return typeof collection.query === 'string'
            ? collection.query
            : undefined
    } else {
        return undefined
    }
}