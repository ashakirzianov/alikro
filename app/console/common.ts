import { AssetMetadata } from '@/shared/assets'

import { z } from 'zod'

const AssetUpdateSchema = z.object({
    id: z.string(),
    kind: z.string().optional(),
    title: z.string().optional(),
    year: z.number().optional(),
    material: z.string().optional(),
    tags: z.string().array().optional(),
    order: z.number().optional(),
})
const AssetUpdatesSchema = z.array(AssetUpdateSchema)
export function parseAssetUpdates(data: unknown) {
    try {
        if (typeof data !== 'string') {
            throw new Error('Invalid JSON')
        }
        const parsed = JSON.parse(data)
        return AssetUpdatesSchema.safeParse(parsed)
    } catch {
        return AssetUpdatesSchema.safeParse('Invalid JSON')
    }
}

export function parseConsoleSlug(slug: string[]): {
    section: string | undefined,
    action: string | undefined,
    id: string | undefined,
} {
    // TODO: investigate why sometimes we get 'console' in the slug and sometimes we don't
    if (slug[0] === 'console') {
        const [_console, section, action, id] = slug
        return { section, action, id }
    } else {
        const [section, action, id] = slug
        return { section, action, id }
    }
}

// Extract min and max order values from assets
export function getAssetsOrderRange(assets: AssetMetadata[]): [number, number] {
    if (assets.length === 0) {
        return [0, 0]
    }

    return assets.reduce(
        ([min, max], asset) => {
            const order = asset.order ?? 0
            return [
                Math.min(min, order),
                Math.max(max, order)
            ]
        },
        [Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER]
    )
}
