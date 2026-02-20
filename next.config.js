/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        serverActions: {
            bodySizeLimit: '10mb',
        },
    },
    cacheComponents: true,
    images: {
        minimumCacheTTL: 2678400, // 31 days
    }
}

module.exports = nextConfig
