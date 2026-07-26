import type { CollectionConfig } from 'payload'

// Exhibitions have no representation in Crow at all — no field, no tag, no
// convention. They exist here to test whether Payload's modelling layer earns
// its keep on content alikro cannot currently express.
export const Exhibitions: CollectionConfig = {
    slug: 'exhibitions',
    access: {
        read: () => true,
    },
    admin: {
        useAsTitle: 'title',
        defaultColumns: ['title', 'venue', 'startDate'],
        description: 'A show: where the work hung, when, and which pieces were in it.',
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
            name: 'title',
            type: 'text',
            required: true,
        },
        {
            name: 'venue',
            type: 'text',
        },
        {
            name: 'city',
            type: 'text',
        },
        {
            name: 'startDate',
            type: 'date',
            index: true,
        },
        {
            name: 'endDate',
            type: 'date',
        },
        {
            name: 'description',
            type: 'textarea',
        },
        {
            name: 'externalUrl',
            type: 'text',
            admin: {
                description: 'Gallery or event page, if there is one.',
            },
        },
        {
            name: 'cover',
            type: 'relationship',
            relationTo: 'artworks',
        },
        {
            // Reverse side of artworks.exhibitions. Deliberately NOT `orderable`:
            // Payload derives the fractional-index column name from
            // `_{collection}_{fieldName}_order`, so a second orderable join also
            // named `artworks` on collection `artworks` would collide with the
            // one on Series — same column, and the later registration wins the
            // scope mapping. Hang order is out of scope for the trial; see the
            // field-mapping doc for the workarounds.
            name: 'artworks',
            type: 'join',
            collection: 'artworks',
            on: 'exhibitions',
        },
    ],
}
