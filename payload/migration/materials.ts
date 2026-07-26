// Derives a material taxonomy from Crow's free-text `material` strings.
//
// This is the one place the trial models something Crow only ever stored as
// prose. "gouache on paper + digital" is structured data — alikro already
// depends on that structure, it just re-derives it on every request with a
// bespoke parser (`shared/material.ts`), which makes *the parser the schema*.
//
// The derivation reuses that parser for structure, but deliberately keeps the
// qualifiers the parser discards (see materialComponents). The raw string stays
// on every record, so the site's filter is unaffected either way — which is
// precisely why there is no reason to inherit the parser's lossiness here.
//
// Normalisation is mechanical only (case, whitespace). Anything that would merge
// two concepts is reported for review, never decided here.

import { parseMaterialString } from '../../shared/material'

// The three separators shared/material.ts marks passive. Anything else marked
// passive is a qualifier the filter chose to drop.
const SEPARATORS = [' + ', ' on ', ', ']

export type MaterialRole = 'medium' | 'support'

export type MaterialComponent = {
    // Stable identity: lowercased, whitespace-collapsed, kebab-cased.
    slug: string,
    // Display form, as first seen in the archive.
    name: string,
    role: MaterialRole,
}

// Splits one Crow material string into its components. `medium` is what the
// work is made of; `support` is what it is made *on* — the distinction alikro's
// filter already draws by prefixing support terms with "on ".
export function materialComponents(material: string | undefined): MaterialComponent[] {
    if (!material || material.trim().length === 0) {
        return []
    }
    const components: MaterialComponent[] = []
    // `parseMaterialString` splits qualifiers off for the site's filter —
    // "soldate clay" becomes a passive "soldate " plus "clay", so the filter can
    // offer one broad "clay" term. Faithful to the filter, but lossy: it throws
    // away exactly the distinction a ceramicist cares about, and modelling the
    // parser's compromises would bake them into the schema. The qualifier is
    // merged back below, so the taxonomy is at least as precise as the prose.
    let qualifier = ''
    for (const element of parseMaterialString(material)) {
        if (element.passive) {
            if (!SEPARATORS.includes(element.content)) {
                qualifier = element.content
            }
            continue
        }
        const name = normalizeName(`${qualifier}${element.content}`)
        qualifier = ''
        if (name.length === 0) {
            continue
        }
        const component: MaterialComponent = {
            slug: slugify(name),
            name,
            role: element.on ? 'support' : 'medium',
        }
        if (!components.some(existing => existing.slug === component.slug && existing.role === component.role)) {
            components.push(component)
        }
    }
    return components
}

// The distinct taxonomy across a whole archive, plus the near-duplicates a human
// should look at. Deriving rather than hand-listing keeps this honest: the terms
// are exactly what the data contains.
export function deriveMaterialTaxonomy(materials: (string | undefined)[]) {
    const bySlug = new Map<string, MaterialComponent>()
    for (const material of materials) {
        for (const component of materialComponents(material)) {
            if (!bySlug.has(component.slug)) {
                bySlug.set(component.slug, component)
            }
        }
    }
    const terms = [...bySlug.values()].sort((a, b) => a.slug.localeCompare(b.slug))
    return { terms, ...relatedTerms(terms) }
}

// Two different things, kept apart because conflating them would be a content
// decision made by a regex:
//   - `plural`  — "marker" / "markers": almost certainly one term spelled twice.
//   - `narrower` — "clay" / "soldate clay": not duplicates at all, but a
//     broader/narrower pair. The archive turns out to have a real material
//     hierarchy that the flat string could never express.
// Both are reported for Alina; neither is merged here.
function relatedTerms(terms: MaterialComponent[]) {
    const plural: [string, string][] = []
    const narrower: [string, string][] = []
    for (let i = 0; i < terms.length; i++) {
        for (let j = i + 1; j < terms.length; j++) {
            const a = terms[i].slug
            const b = terms[j].slug
            if (`${a}s` === b || a === `${b}s`) {
                plural.push([a, b])
            } else if (b.endsWith(`-${a}`)) {
                narrower.push([a, b])
            } else if (a.endsWith(`-${b}`)) {
                narrower.push([b, a])
            }
        }
    }
    return { plural, narrower }
}

function normalizeName(value: string): string {
    return value.trim().replace(/\s+/g, ' ').toLowerCase()
}

function slugify(name: string): string {
    return name.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}
