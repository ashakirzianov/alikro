import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
    cacheComponents: true,
    images: {
        minimumCacheTTL: 2678400, // 31 days
    }
}

// `withPayload` is ESM-only, which is why this file is .mjs rather than .js.
// `devBundleServerPackages: false` matches Payload's own template — it keeps the
// admin's server packages out of the dev bundle.
export default withPayload(nextConfig, { devBundleServerPackages: false })
