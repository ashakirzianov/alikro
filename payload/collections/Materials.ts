import type { CollectionConfig } from 'payload'

// The material taxonomy — the one thing in this trial that Crow could only ever
// store as prose. "gouache on paper + digital" is structured data; alikro
// already depends on that structure and re-derives it on every request with a
// bespoke parser, which makes the parser the schema.
//
// Seeded from the archive by the migration (payload/migration/materials.ts), not
// hand-listed, so the vocabulary is exactly what the work is actually made of.
export const Materials: CollectionConfig = {
    slug: 'materials',
    access: {
        read: () => true,
    },
    admin: {
        useAsTitle: 'name',
        defaultColumns: ['name', 'slug'],
        description: 'Media and supports. Merge duplicates here rather than editing 600 artworks.',
    },
    fields: [
        {
            name: 'slug',
            type: 'text',
            required: true,
            unique: true,
            index: true,
        },
        {
            name: 'name',
            type: 'text',
            required: true,
        },
        {
            // The archive has a real hierarchy the flat string could not express:
            // "soldate clay", "murietta clay" and "porcelain clay" are all clay.
            // Optional, and for Alina to fill in — the migration only proposes it.
            name: 'broader',
            type: 'relationship',
            relationTo: 'materials',
            admin: {
                description: 'A more general material, if this is a specific kind of one (e.g. soldate clay → clay).',
            },
        },
    ],
}
