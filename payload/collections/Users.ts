import type { CollectionConfig } from 'payload'

// Admin users — Alina and Anton. Payload creates the first one on the first
// visit to /admin. `useAPIKey` is what an agent or an MCP server would
// authenticate with; embedded site reads bypass auth entirely via the Local API.
export const Users: CollectionConfig = {
    slug: 'users',
    auth: {
        useAPIKey: true,
    },
    admin: {
        useAsTitle: 'email',
    },
    fields: [
        {
            name: 'name',
            type: 'text',
        },
    ],
}
