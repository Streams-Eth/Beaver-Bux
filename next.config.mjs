import path from 'path'
import { fileURLToPath } from 'url'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'hebbkx1anhila5yf.public.blob.vercel-storage.com',
      },
    ],
  },
  serverExternalPackages: ['thread-stream'],
  // Empty turbopack config to allow webpack config to coexist in Next.js 16
  turbopack: {},
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, immutable, max-age=31536000' },
        ],
      },
      {
        source: '/_next/image/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, stale-while-revalidate=86400' },
        ],
      },
      {
        source: '/fonts/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ]
  },
  webpack(config) {
    // Force a single resolved copy of @tanstack/react-query to avoid
    // runtime mismatches between QueryClient and QueryClientProvider.
    config.resolve = config.resolve || {}
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@tanstack/react-query': path.resolve(__dirname, 'node_modules/@tanstack/react-query'),
    }
    return config
  },
}

export default nextConfig
