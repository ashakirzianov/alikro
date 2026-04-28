import { AssetQuery, and, not, tag } from "./query"

export type Slide = {
    title: string,
    href: string,
    query: AssetQuery,
    includeLinks?: boolean,
}

export function allSlides(): Slide[] {
    return slides
}

const slides: Slide[] = [{
    title: 'Alikro, an artist.',
    href: '/all',
    query: and(not('unpublished'), tag('self-portrait')),
    includeLinks: true,
}, {
    title: 'Paintings.',
    href: '/paintings',
    query: and('painting', not(tag('self-portrait'))),
}, {
    title: 'Drawings.',
    href: '/drawings',
    query: and('drawing', not(tag('self-portrait'))),
}, {
    title: 'Ceramics.',
    href: '/ceramics',
    query: 'ceramic',
}, {
    title: 'Illustrations.',
    href: '/illustrations',
    query: and('illustration', not(tag('self-portrait'))),
}, {
    title: 'Posters.',
    href: '/posters',
    query: and('poster', not(tag('self-portrait'))),
}, {
    title: 'Collages.',
    href: '/collages',
    query: and('collage', not(tag('self-portrait'))),
}]
