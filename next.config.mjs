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
    unoptimized: true,
  },
  experimental: {
    serverComponentsExternalPackages: ['thread-stream'],
  },
  // Empty turbopack config to allow webpack config to coexist in Next.js 16
  turbopack: {},
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
