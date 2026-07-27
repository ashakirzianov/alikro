import { collectionForId } from "./collection"

export function hrefForSlideshow() {
    return '/'
}

export function hrefForAbout() {
    return '/about'
}

export function hrefForAsset({ pathname, assetId }: {
    pathname?: string,
    assetId: string,
}) {
    return `${pathname ?? '/all'}/${assetId}`
}

export function hrefForAssetModal({ pathname, assetId, includeHash }: {
    pathname: string,
    assetId: string,
    includeHash?: boolean,
}) {
    return `${pathname}?show=${assetId}${includeHash ? '#' + assetId : ''}`
}

export function hrefForAll({ by }: {
    by?: 'collection' | 'tag' | 'year' | 'material',
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

// The "edit" affordance on a work. Under the A/B this has to follow whichever
// CMS actually served the record: `hrefForConsole` always points at Crow via
// NEXT_PUBLIC_CROW_CMS, so on the Payload path it sent you to the wrong CMS —
// and to a console that does not have the record you were looking at.
//
// The record itself carries the answer (`cmsEditPath`, set only by the embedded
// CMS), so no client-visible copy of CONTENT_SOURCE is needed and the two
// switches cannot drift apart.
export function hrefForEdit({ asset, pathname }: {
    asset: { id: string, cmsEditPath?: string },
    pathname?: string,
}): string {
    return asset.cmsEditPath ?? hrefForConsole({
        assetId: asset.id,
        filter: filterForPathname(pathname),
    })
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