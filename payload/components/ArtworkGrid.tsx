'use client'

import { useListQuery } from '@payloadcms/ui'
import Link from 'next/link'
import type { Where } from 'payload'

import { MEDIUMS } from '../collections/mediums'

// Re-skin (2026-07-27): the playtest judged the stock admin "not image-native",
// and the follow-up charge is to make it feel like Crow, the CMS it replaces.
// Crow's console is two things — a red comma-separated filter row, and a dense
// four-column wall of pictures at their natural aspect ratio with a tiny red
// caption. This renders both from the list Payload has already fetched.
//
// It is mounted as `beforeListTable`, which is the cheap part: `useListQuery()`
// hands back the documents the default list view has *already* fetched, and
// `refineListData()` is the same public entry point Payload's own Filters
// control uses. Search, sorting, pagination and the column/filter controls all
// keep working untouched — nothing about the query layer is reimplemented here.
//
// Cost, honestly: this file is presentation we own forever. See
// SPIKE-image-native-admin.md and RESKIN-crow-admin.md for the tiered count.

type Size = { url?: string | null, width?: number | null }

type ArtworkDoc = {
    id: number | string,
    title?: string | null,
    year?: number | null,
    medium?: string | null,
    material?: string | null,
    _status?: string | null,
    showOnSite?: boolean | null,
    sizes?: Record<string, Size | undefined> | null,
}

// Crow's header is `all, ceramic, drawing, … // Upload // Json`. The mediums are
// the code-defined vocabulary; `drafts` and `hidden` are the two states Crow
// expressed through its `kind` column and Payload models properly.
const FILTERS: { label: string, where: Where }[] = [
    { label: 'all', where: {} },
    ...MEDIUMS.map(medium => ({ label: medium, where: { medium: { equals: medium } } })),
    { label: 'drafts', where: { _status: { equals: 'draft' } } },
    { label: 'hidden', where: { showOnSite: { equals: false } } },
]

export function ArtworkGrid() {
    const { data, query, refineListData } = useListQuery()
    const docs = (data?.docs ?? []) as ArtworkDoc[]
    const active = FILTERS.findIndex(filter =>
        JSON.stringify(filter.where) === JSON.stringify(query.where ?? {}))

    return (
        <div className="crow">
            <nav className="crow__nav">
                {FILTERS.map((filter, index) => (
                    <span key={filter.label}>
                        <button
                            type="button"
                            className={index === active ? 'crow__filter crow__filter--on' : 'crow__filter'}
                            // `page: 1` matters: refining while on page 3 of 632 can
                            // land on an empty page of a 12-result filter.
                            onClick={() => refineListData({ page: 1, where: filter.where })}
                        >
                            {filter.label}
                        </button>
                        {index === FILTERS.length - 1 ? '' : ','}&nbsp;
                    </span>
                ))}
            </nav>
            {docs.length > 0 && (
                <div className="crow__grid">
                    {columnsOf(docs, 4).map((column, index) => (
                        <div key={index} className="crow__column">
                            {column.map(doc => <ArtworkCard key={doc.id} doc={doc} />)}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

function ArtworkCard({ doc }: { doc: ArtworkDoc }) {
    const thumbnail = thumbnailFor(doc)
    return (
        <Link href={`/admin/collections/artworks/${doc.id}`} className="crow__card">
            <div className="crow__frame">
                {thumbnail
                    ? <img src={thumbnail} alt={doc.title ?? ''} loading="lazy" />
                    : <span className="crow__missing">no image</span>}
                {/* Draft/publish was the one thing the playtest rated a win, and
                    it is invisible in every image-native view Payload ships. */}
                {doc._status === 'draft' && <span className="crow__badge">draft</span>}
                {doc.showOnSite === false && (
                    <span className="crow__badge crow__badge--muted">hidden</span>
                )}
            </div>
            <span className="crow__caption">{describe(doc)}</span>
        </Link>
    )
}

// Crow's caption verbatim (crow-cms ConsoleGrid `assetDescription`):
// "Title (year, material)".
function describe(doc: ArtworkDoc): string {
    const details = [doc.year, doc.material].filter(Boolean)
    const suffix = details.length > 0 ? ` (${details.join(', ')})` : ''
    return `${doc.title || 'Untitled'}${suffix}`
}

// Round-robin, not CSS columns: Crow distributes `index % count` so reading
// order runs across the row, and CSS `column-count` would run it down instead.
function columnsOf(docs: ArtworkDoc[], count: number): ArtworkDoc[][] {
    const columns: ArtworkDoc[][] = Array.from({ length: count }, () => [])
    docs.forEach((doc, index) => columns[index % count].push(doc))
    return columns
}

// The admin is served from the same origin as the bucket-backed site, so the
// variant URLs on the document are used directly — same source the site reads.
// w480 is the smallest variant that still looks like a picture at card size;
// w320 is the fallback for the handful of originals narrower than 480.
function thumbnailFor(doc: ArtworkDoc): string | undefined {
    const sizes = doc.sizes ?? {}
    return sizes.w480?.url ?? sizes.w320?.url ?? undefined
}
