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
            // The reverse side of artworks.series: a read-only view of what is
            // in this series. Membership is set on the artwork.
            //
            // Deliberately not `orderable`. A per-series fractional index would
            // be a second ordering alongside `artworks.order`, and the two can
            // drift with neither derived from the other — so this sorts by the
            // one global order, exactly as the tag-driven collections do today.
            // (It was also approximate: Payload marks `orderable` experimental,
            // and for a hasMany relationship the reorder scope comes from the
            // artwork's *first* series.)
            name: 'artworks',
            type: 'join',
            collection: 'artworks',
            on: 'series',
            defaultSort: 'order',
        },
    ],
}
