import type { CollectionConfig } from 'payload'

// A series is what alikro currently fakes with a hardcoded tag query in
// shared/collection.ts. Moving it into content is the "beyond parity" half of
// the trial: the thing Crow structurally cannot do.
export const Series: CollectionConfig = {
    slug: 'series',
    access: {
        read: () => true,
    },
    admin: {
        useAsTitle: 'title',
        defaultColumns: ['title', 'order', 'featured'],
        description: 'A named body of work. Replaces alikro\'s hardcoded tag-query collections.',
    },
    fields: [
        {
            name: 'slug',
            type: 'text',
            required: true,
            unique: true,
            index: true,
            admin: {
                description: 'URL segment — carry over the ids in shared/collection.ts (e.g. `self-portraits`) so existing links keep working.',
            },
        },
        {
            name: 'title',
            type: 'text',
            required: true,
        },
        {
            name: 'description',
            type: 'textarea',
        },
        {
            name: 'cover',
            type: 'relationship',
            relationTo: 'artworks',
        },
        {
            name: 'featured',
            type: 'checkbox',
            defaultValue: false,
            admin: {
                description: 'Show in the site navigation.',
            },
        },
        {
            name: 'order',
            type: 'number',
            admin: {
                description: 'Position among series in the navigation.',
            },
        },
        {
            // The reverse side of artworks.series. `orderable` is what makes
            // "reorder a gallery" — one of the trial's scripted tasks — a drag
            // inside this document instead of an edit across N artworks.
            //
            // Caveat (Payload marks `orderable` experimental): the fractional
            // index is a single column on `artworks`, and for a hasMany
            // relationship the reorder scope is taken from the *first* related
            // series. An artwork in two series therefore shares one sort key
            // across both. Exact per-series order would need an explicit array
            // field here instead — see the field-mapping doc.
            name: 'artworks',
            type: 'join',
            collection: 'artworks',
            on: 'series',
            orderable: true,
        },
    ],
}
