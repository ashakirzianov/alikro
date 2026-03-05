import { AssetQuery, not, tag } from "./query"

export type Collection = {
    id: string,
    title: string,
    description: string,
    query: AssetQuery,
    slideAndQuery?: AssetQuery,
    slideAltPath?: string,
    slideLinks?: boolean,
}

export function allCollections(): Collection[] {
    return collections
}

export function collectionForId(path: string): Collection | undefined {
    return collections.find(collection => collection.id === path)
}

const collections: Collection[] = [{
    id: 'all',
    title: 'Alikro, an artist.',
    description: 'All works by Alikro.',
    query: not('unpublished'),
    slideAndQuery: tag('self-portrait'),
    slideLinks: true,
}, {
    id: 'paintings',
    title: 'Paintings.',
    description: "Alikro's paintings.",
    query: 'painting',
    slideAndQuery: [not(tag('self-portrait'))],
}, {
    id: 'drawings',
    title: 'Drawings.',
    description: "Alikro's drawings.",
    query: 'drawing',
    slideAndQuery: [not(tag('self-portrait'))],
}, {
    id: 'ceramics',
    title: 'Ceramics.',
    description: "Alikro's ceramics.",
    query: 'ceramic',
}, {
    id: 'illustrations',
    title: 'Illustrations.',
    description: "Alikro's illustrations.",
    query: 'illustration',
    slideAndQuery: [not(tag('self-portrait'))],
}, {
    id: 'posters',
    title: 'Posters.',
    description: "Alikro's posters.",
    query: 'poster',
    slideAndQuery: [not(tag('self-portrait'))],
}, {
    id: 'collages',
    title: 'Collages.',
    description: "Alikro's collages.",
    query: 'collage',
    slideAndQuery: [not(tag('self-portrait'))],
}]