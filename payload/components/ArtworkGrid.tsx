'use client'

import { useListQuery } from '@payloadcms/ui'
import Link from 'next/link'

// Spike (2026-07-27): the playtest judged the stock admin "not image-native" —
// 630 artworks presented as rows of titles. This renders the same list as a
// gallery of pictures.
//
// It is mounted as `beforeListTable`, which is the cheap part: `useListQuery()`
// hands back the documents the default list view has *already* fetched, so
// search, filters, sorting, pagination and the column/filter controls all keep
// working untouched. Nothing about the query layer is reimplemented here — this
// component only decides how the rows are drawn.
//
// Cost, honestly: this file, plus one `beforeListTable` line and one CSS block
// in Artworks.ts. Everything below the data access is hand-written presentation
// that Payload does not ship, and that we would own across its weekly releases.

type Size = { url?: string | null, width?: number | null }

type ArtworkDoc = {
    id: number | string,
    title?: string | null,
    year?: number | null,
    medium?: string | null,
    _status?: string | null,
    showOnSite?: boolean | null,
    sizes?: Record<string, Size | undefined> | null,
}

export function ArtworkGrid() {
    const { data } = useListQuery()
    const docs = (data?.docs ?? []) as ArtworkDoc[]

    if (docs.length === 0) {
        return null
    }

    return (
        <div className="artwork-grid">
            {docs.map(doc => (
                <Link
                    key={doc.id}
                    href={`/admin/collections/artworks/${doc.id}`}
                    className="artwork-grid__card"
                >
                    <div className="artwork-grid__frame">
                        {thumbnailFor(doc)
                            ? <img
                                src={thumbnailFor(doc)}
                                alt={doc.title ?? ''}
                                loading="lazy"
                            />
                            : <span className="artwork-grid__missing">no image</span>}
                        {doc._status === 'draft' && (
                            <span className="artwork-grid__badge">draft</span>
                        )}
                        {doc.showOnSite === false && (
                            <span className="artwork-grid__badge artwork-grid__badge--muted">
                                hidden
                            </span>
                        )}
                    </div>
                    <div className="artwork-grid__meta">
                        <span className="artwork-grid__title">
                            {doc.title || 'Untitled'}
                        </span>
                        <span className="artwork-grid__sub">
                            {[doc.medium, doc.year].filter(Boolean).join(' · ')}
                        </span>
                    </div>
                </Link>
            ))}
        </div>
    )
}

// The admin is served from the same origin as the bucket-backed site, so the
// variant URLs on the document are used directly — same source the site reads.
// w480 is the smallest variant that still looks like a picture at card size;
// w320 is the fallback for the handful of originals narrower than 480.
function thumbnailFor(doc: ArtworkDoc): string | undefined {
    const sizes = doc.sizes ?? {}
    return sizes.w480?.url ?? sizes.w320?.url ?? undefined
}
