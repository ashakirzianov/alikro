import { AssetQuery, not } from "./assets"

export type Section = {
    path: string,
    title: string,
    section: string,
    description: string,
    query: AssetQuery,
    slideAndQuery?: AssetQuery,
    slideAltPath?: string,
    slideLinks?: boolean,
}

export function allSections(): Section[] {
    return sections
}

export function sectionForPath(path: string): Section | undefined {
    return sections.find(section => section.path === path)
}

export function allSectionPaths(): string[] {
    return sections.map(section => section.path)
}

const sections: Section[] = [{
    path: 'all',
    title: 'Alikro, an artist.',
    description: 'All works by Alikro.',
    section: 'all',
    query: null,
    slideAndQuery: 'selfportrait',
    slideLinks: true,
}, {
    path: 'drawings',
    title: 'Drawings.',
    description: "Alikro's drawings.",
    section: 'drawings',
    query: 'drawing',
    slideAndQuery: [not('selfportrait')],
}, {
    path: 'illustrations',
    title: 'Illustrations.',
    description: "Alikro's illustrations.",
    section: 'illustrations',
    query: 'illustration',
    slideAndQuery: [not('selfportrait')],
}, {
    path: 'paintings',
    title: 'Paintings.',
    description: "Alikro's paintings.",
    section: 'paintings',
    query: 'painting',
    slideAndQuery: [not('selfportrait')],
}, {
    path: 'posters',
    title: 'Posters.',
    description: "Alikro's posters.",
    section: 'posters',
    query: 'poster',
    slideAndQuery: [not('selfportrait')],
}, {
    path: 'collages',
    title: 'Collages.',
    description: "Alikro's collages.",
    section: 'collages',
    query: 'collage',
    slideAndQuery: [not('selfportrait')],
}, {
    path: 'tattoos',
    title: 'Tattoos.',
    description: "Alikro's tattoos.",
    section: 'tattoos',
    query: 'tattoo',
}]