import path from 'path'
import { fileURLToPath } from 'url'

import { postgresAdapter } from '@payloadcms/db-postgres'
import { mcpPlugin } from '@payloadcms/plugin-mcp'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import { buildConfig } from 'payload'
import sharp from 'sharp'

import { Artworks } from './payload/collections/Artworks'
import { Materials } from './payload/collections/Materials'
import { Series } from './payload/collections/Series'
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
    },
    collections: [Artworks, Series, Materials, Users],
    editor: lexicalEditor(),
    secret: process.env.PAYLOAD_SECRET || '',
    typescript: {
        outputFile: path.resolve(dirname, 'payload/payload-types.ts'),
    },
    // Neon in the trial; any Postgres connection string works. `push` stays on
    // its default (dev-only) so schema changes apply without a migration step
    // while the model is still moving.
    db: postgresAdapter({
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
                description: 'One record per artwork — the image and its catalogue data (title, year, medium, material, series membership, and `order`, the single archive-wide sort position).',
                enabled: readAndWriteNoDelete,
            },
            series: {
                description: 'A named body of work. Membership is written on the artwork (`artworks.series`), not here.',
                enabled: readAndWriteNoDelete,
            },
            materials: {
                description: 'The material vocabulary — what works are made of and made on.',
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
