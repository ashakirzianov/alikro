// Exports Crow's metadata to neutral JSON.
//
// Worth keeping under every verdict, including FREEZE — it is the portability
// artifact, the thing that proves the archive is not captive. Run it fresh
// before a migration: the export carries `exportedAt`, and migrate.ts refuses a
// stale one, because the last time a committed JSON file was trusted as "the
// archive" it was 109 records behind.
//
//   npm run migrate:export

import { writeFile } from 'fs/promises'
import path from 'path'

import type { CrowAsset, CrowExport } from './mapping'

const OUTPUT = path.resolve(process.cwd(), 'payload/migration/crow-export.json')

export async function exportCrowMetadata(): Promise<CrowExport> {
    const base = process.env.NEXT_PUBLIC_CROW_CMS
    const secret = process.env.CROW_CMS_SECRET_KEY
    if (!base || !secret) {
        throw new Error('NEXT_PUBLIC_CROW_CMS and CROW_CMS_SECRET_KEY must be set (see .env.local)')
    }
    const url = `${base}/api/projects/alikro/metadata`
    const res = await fetch(url, { headers: { Authorization: `Bearer ${secret}` } })
    if (!res.ok) {
        throw new Error(`Crow returned ${res.status} for ${url}`)
    }
    const assets = await res.json() as CrowAsset[]
    return {
        exportedAt: new Date().toISOString(),
        source: url,
        count: assets.length,
        assets,
    }
}

async function main() {
    const data = await exportCrowMetadata()
    await writeFile(OUTPUT, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
    console.log(`Exported ${data.count} assets to ${path.relative(process.cwd(), OUTPUT)} at ${data.exportedAt}`)
}

if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) {
    main().catch(error => {
        console.error(error)
        process.exit(1)
    })
}
