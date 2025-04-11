import { AssetQuery, not } from "./assets"

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
    query: null,
    slideAndQuery: 'selfportrait',
    slideLinks: true,
}, {
    id: 'paintings',
    title: 'Paintings.',
    description: "Alikro's paintings.",
    query: 'painting',
    slideAndQuery: [not('selfportrait')],
}, {
    id: 'drawings',
    title: 'Drawings.',
    description: "Alikro's drawings.",
    query: 'drawing',
    slideAndQuery: [not('selfportrait')],
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
    slideAndQuery: [not('selfportrait')],
}, {
    id: 'posters',
    title: 'Posters.',
    description: "Alikro's posters.",
    query: 'poster',
    slideAndQuery: [not('selfportrait')],
}, {
    id: 'collages',
    title: 'Collages.',
    description: "Alikro's collages.",
    query: 'collage',
    slideAndQuery: [not('selfportrait')],
}, {
    id: 'tattoos',
    title: 'Tattoos.',
    description: "Alikro's tattoos.",
    query: 'tattoo',
}]