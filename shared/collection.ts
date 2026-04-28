import { AssetQuery, not } from "./query"

export type Collection = {
    id: string,
    title: string,
    description: string,
    query: AssetQuery,
}

export type CollectionGroup = Collection[]

export function allCollections(): Collection[] {
    return [allCollection, ...kindCollections]
}

export function getKindCollections(): CollectionGroup {
    return kindCollections
}

export function collectionForId(path: string): Collection | undefined {
    return allCollections().find(collection => collection.id === path)
}

const allCollection: Collection = {
    id: 'all',
    title: 'Alikro, an artist.',
    description: 'All works by Alikro.',
    query: not('unpublished'),
}

const kindCollections: CollectionGroup = [{
    id: 'paintings',
    title: 'Paintings.',
    description: "Alikro's paintings.",
    query: 'painting',
}, {
    id: 'drawings',
    title: 'Drawings.',
    description: "Alikro's drawings.",
    query: 'drawing',
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
}, {
    id: 'posters',
    title: 'Posters.',
    description: "Alikro's posters.",
    query: 'poster',
}, {
    id: 'collages',
    title: 'Collages.',
    description: "Alikro's collages.",
    query: 'collage',
}]
