/** @type {import('next').NextConfig} */
const nextConfig = {
    cacheComponents: true,
    images: {
        minimumCacheTTL: 2678400, // 31 days
    }
}

module.exports = nextConfig
