// Which Crow tags name a body of work, and what series document each becomes.
//
// The five that alikro already exposes as collections keep their existing ids
// (shared/collection.ts) so live URLs survive. Everything else is derived from
// the tag. `Favorite` is deliberately absent — it is a flag on a work, not a
// body of work, and stays a flat tag.
//
// Blessed 2026-07-26 with one content question still out: the twelve poster
// topics below are modelled as a series each. If they are one campaign instead,
// collapse them here — nothing else needs to change.

export type SeriesSeed = {
    slug: string,
    title: string,
    description?: string,
    // The Crow tag this series was derived from.
    tag: string,
}

export const SERIES_SEEDS: SeriesSeed[] = [
    // Already collections on the site today — ids must not change.
    { slug: 'self-portraits', title: 'self portraits', description: "Alikro's self portraits.", tag: 'Self-portrait' },
    { slug: 'friends', title: 'friends', description: "Alikro's friend portraits.", tag: 'Friend Portrait' },
    { slug: 'black-list', title: 'black list', description: "Alikro's Black List series.", tag: 'The Black List' },
    { slug: 'nai', title: 'nai', description: "Alikro's NAI works.", tag: 'NAI' },
    { slug: 'sketches-from-museums', title: 'sketches from museums', description: "Alikro's sketches from museums.", tag: 'Sketch from Museum' },

    // New series, not previously expressible.
    { slug: 'green-theatre', title: 'Green Theatre', tag: 'Green Theatre' },
    { slug: 'vietnam', title: 'Vietnam', tag: 'Vietnam' },
    { slug: 'ukrainian-history', title: 'Ukrainian History', tag: 'Ukrainian History' },
    { slug: 'anton', title: 'Anton', tag: 'Anton' },
    { slug: 'war', title: 'War', tag: 'War' },
    { slug: 'venice-beach', title: 'Venice Beach', tag: 'Venice Beach' },
    { slug: 'it', title: 'IT', tag: 'IT' },
    { slug: 'plates', title: 'Plates', tag: 'Plates' },
    { slug: 'kunsht', title: 'Kunsht', tag: 'Kunsht' },
    { slug: 'vsi-svoi', title: 'Vsi.Svoi', tag: 'Vsi.Svoi' },
    { slug: 'cat-hotel', title: 'Cat Hotel', tag: 'Cat Hotel' },
    { slug: 'vika-temnova', title: 'Vika Temnova', description: 'Posters made for Vika Temnova.', tag: 'Vika Temnova' },
    { slug: 'porteno', title: 'Porteño', description: 'Buenos Aires.', tag: 'Porteño' },

    // Poster topics, 2019–21. One series each, pending Anton's ruling.
    { slug: 'eating-disorders', title: 'Eating Disorders', tag: 'Eating Disorders' },
    { slug: 'illness-anxiety-disorder', title: 'Illness Anxiety Disorder', tag: 'Illness Anxiety Disorder' },
    { slug: 'menstruation', title: 'Menstruation', tag: 'Menstruation' },
    { slug: 'abuse', title: 'Abuse', tag: 'Abuse' },
    { slug: 'cat-calling', title: 'Cat Calling', tag: 'Cat Calling' },
    { slug: 'parenthood', title: 'Parenthood', tag: 'Parenthood' },
    { slug: 'children-watch-porn', title: 'Children Watch Porn', tag: 'Children Watch Porn' },
    { slug: 'sperm-donation', title: 'Sperm Donation', tag: 'Sperm Donation' },
    { slug: 'school-bullying', title: 'School Bullying', tag: 'School Bullying' },
    { slug: 'toxic-masculinity', title: 'Toxic Masculinity', tag: 'Toxic Masculinity' },
    { slug: 'organ-donation', title: 'Organ Donation', tag: 'Organ Donation' },
    { slug: 'sirens', title: 'Sirens', tag: 'Sirens' },
]

// Tags that stay flat labels rather than becoming series.
export const FLAG_TAGS = ['Favorite']

export function seriesSlugForTag(tag: string): string | undefined {
    return seedsByTag().get(tag)?.slug
}

export function isFlagTag(tag: string): boolean {
    return FLAG_TAGS.includes(tag)
}

let cachedSeedsByTag: Map<string, SeriesSeed> | undefined

function seedsByTag() {
    if (!cachedSeedsByTag) {
        cachedSeedsByTag = new Map(SERIES_SEEDS.map(seed => [seed.tag, seed]))
    }
    return cachedSeedsByTag
}
