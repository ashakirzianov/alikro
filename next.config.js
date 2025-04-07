/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        serverActions: {
            bodySizeLimit: '10mb',
        },
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: process.env.NEXT_PUBLIC_ASSETS_DOMAIN,
                port: '',
                pathname: '/**',
                search: '',
            },
        ]
    }
}

module.exports = nextConfig
