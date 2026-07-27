import path from 'path'
import { fileURLToPath } from 'url'

import { postgresAdapter } from '@payloadcms/db-postgres'
import { mcpPlugin } from '@payloadcms/plugin-mcp'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import { buildConfig } from 'payload'
import sharp from 'sharp'

import { Artworks } from './payload/collections/Artworks'
import { Users } from './payload/collections/Users'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Trial-only config — see ../axis/docs/crow-payload-trial.md. Production
// alikro.art still reads from Crow through shared/cms.ts; nothing here is wired
// into the site yet.
export default buildConfig({
    admin: {
        user: Users.slug,
        importMap: {
            baseDir: path.resolve(dirname),
        },
        // Crow's browser tab reads "Console". Matching it is one line and it is
        // the first thing you see in a window list.
        meta: {
            titleSuffix: ' — alikro console',
        },
        // Crow is white-only; it has no dark mode and no theme switcher. Payload
        // defaults to `'all'`, which follows the OS — so on a machine set to dark
        // the admin came up dark and none of the light-theme work was visible.
        // First-party config, and it also removes the theme picker from account
        // settings, which is one fewer control that has no Crow counterpart.
        theme: 'light',
        // Re-skin (2026-07-27). `admin.dashboard` is a first-party API: naming a
        // `defaultLayout` displaces Payload's stock "Collections" cards without
        // touching a stylesheet or a class name. Config sanitization still pushes
        // its own `collections` widget into `widgets`, so it stays available in
        // the dashboard's widget picker — this changes the default, not the menu.
        //
        // Known limit, verified in the source rather than assumed: a saved
        // per-user dashboard preference wins over `defaultLayout`
        // (`getItemsFromPreferences(...) ?? getItemsFromConfig(...)`), so anyone
        // who has already rearranged their dashboard keeps what they arranged.
        dashboard: {
            widgets: [
                {
                    slug: 'crow',
                    label: 'alikro',
                    Component: '/payload/components/CrowDashboard#CrowDashboard',
                    minWidth: 'full',
                },
            ],
            defaultLayout: [{ widgetSlug: 'crow', width: 'full' }],
        },
    },
    // `series` and `materials` were dropped 2026-07-27 — the modelling layer was
    // built, shown to Anton and Alina, and rejected in favour of Crow's flat
    // shape. Their contents are preserved in payload/migration/dump-*.json.
    collections: [Artworks, Users],
    editor: lexicalEditor(),
    secret: process.env.PAYLOAD_SECRET || '',
    typescript: {
        outputFile: path.resolve(dirname, 'payload/payload-types.ts'),
    },
    // Neon in the trial; any Postgres connection string works.
    //
    // `push` is OFF. It defaults to on in dev, which was right while the model
    // was moving, but the model has stopped and there are committed migrations
    // now. Leaving it on is actively harmful: every script that boots Payload
    // re-diffs the schema and stops on an interactive "DATA LOSS WARNING —
    // accept and push? (y/N)" prompt. Piped, that prompt is invisible and the
    // script simply hangs forever; unattended, it takes the default and exits 0,
    // which reads as success. Both failure modes were hit here on 2026-07-27.
    db: postgresAdapter({
        push: false,
        pool: {
            connectionString: process.env.DATABASE_URL || '',
        },
    }),
    sharp,
    plugins: [...storagePlugins(), agentSurface()],
})

// Criterion 4 of the trial — "how well can agents drive Payload". Payload ships
// a first-party MCP server as `@payloadcms/plugin-mcp`, versioned in lockstep
// with the core (peer-dependency pinned to the exact release). It mounts a
// streamable-HTTP endpoint at `/api/mcp`.
//
// Registered unconditionally but gated behind `PAYLOAD_MCP`: the plugin keeps
// its API-key collection in the schema even when disabled, which is what makes
// the flag safe. Toggling the plugin in and out of the config array instead
// would let dev-mode `push` drop that table on the next boot without it.
function isEnabled(value: string | undefined) {
    return value !== undefined && value !== '' && value !== '0' && value.toLowerCase() !== 'false'
}

function agentSurface() {
    // `enabled` is per-capability, and `delete: false` is deliberate. This
    // branch's standing rule is that nothing gets deleted; expressing that in
    // the tool registry means the agent is never handed the capability, rather
    // than being trusted not to use it.
    const readAndWriteNoDelete = { create: true, delete: false, find: true, update: true }
    return mcpPlugin({
        // Explicitly falsy strings count as off: `PAYLOAD_MCP=0` reading as ON is
        // the kind of flag that gets switched the wrong way once and never noticed.
        disabled: !isEnabled(process.env.PAYLOAD_MCP),
        collections: {
            artworks: {
                description: 'One record per artwork — the image and its catalogue data (title, year, medium, free-text `material`, flat `tags`, and `order`, the single archive-wide sort position).',
                enabled: readAndWriteNoDelete,
            },
        },
    })
}

// The S3 adapter only engages once a bucket is configured. Without it Payload
// writes to `media/` on disk, which is what lets the branch run before any
// credentials exist.
function storagePlugins() {
    const bucket = process.env.S3_BUCKET
    if (!bucket) {
        return []
    }
    return [
        s3Storage({
            bucket,
            collections: {
                artworks: {
                    // Crow-parity read path: URLs point straight at the bucket
                    // (later, CloudFront) instead of being proxied through
                    // Payload's own route with per-request access control.
                    disablePayloadAccessControl: true,
                    prefix: process.env.S3_PREFIX || 'alikro',
                    generateFileURL: fileURLGenerator(bucket),
                },
            },
            config: {
                region: process.env.S3_REGION,
                credentials: process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY
                    ? {
                        accessKeyId: process.env.S3_ACCESS_KEY_ID,
                        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
                    }
                    : undefined,
            },
        }),
    ]
}

// Builds the public URL for a stored file. This has to be supplied explicitly:
// the S3 adapter's own generator falls back to `config.endpoint`, which is unset
// for plain AWS, and would bake the literal string "undefined/…" into every
// `url` and `sizes.*.url` column — persisted at write time, so a whole archive
// migration would have to be re-run to undo it.
//
// The CDN host is optional. Unset in the trial: reads go to the bucket
// directly, and CloudFront is deferred to a MIGRATE verdict.
function fileURLGenerator(bucket: string) {
    const host = process.env.NEXT_PUBLIC_PAYLOAD_ASSETS_DOMAIN
        ?? `${bucket}.s3.${process.env.S3_REGION}.amazonaws.com`
    return ({ filename, prefix }: { filename: string, prefix?: string }) => {
        // 20 of the live filenames contain spaces or Cyrillic. An unescaped
        // space inside a srcset candidate is read as the descriptor separator,
        // so the browser silently drops the image.
        const path = [prefix, filename]
            .filter((segment): segment is string => Boolean(segment))
            .flatMap(segment => segment.split('/'))
            .filter(Boolean)
            .map(encodeURIComponent)
            .join('/')
        return `https://${host}/${path}`
    }
}
