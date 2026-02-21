import { collectionForId } from "./collection"

export function hrefForSlideshow() {
    return '/'
}

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

export function hrefForAll({ by }: {
    by?: 'kind' | 'year' | 'material' | 'tag',
}) {
    return by ? `/all?by=${by}` : '/all'
}

export function hrefForCollection({ collectionId }: {
    collectionId: string,
}) {
    return `/${collectionId}`
}

export function hrefForYear({ year }: {
    year: number | undefined,
}) {
    return `/year/${year ?? 'unknown'}`
}

export function hrefForTag({ tag }: {
    tag: string,
}) {
    return `/tag/${encodeURIComponent(tag)}`
}

export function hrefForMaterial({ material }: {
    material: string | undefined,
}) {
    return `/material/${encodeURIComponent(material ?? 'unspecified')}`
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
    const path = searchParams.size === 0
        ? '/alikro'
        : `/alikro?${searchParams.toString()}`
    return `${process.env.NEXT_PUBLIC_CROW_CMS}/projects${path}`
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