/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone',
  transpilePackages: ['zustand'],
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'https://alvio.io',
  },

  // ── Image Optimization ──────────────────────────────────────────────
  images: {
    // L'optimiseur intégré (fetch serveur) se heurte au même problème de
    // certificat que MarketsService (voir markets.service.ts DEV_AGENT) sur
    // cette stack Docker locale — on le désactive pour laisser le navigateur
    // charger l'image directement. (`next build` fige NODE_ENV=production
    // quel que soit l'environnement d'exécution, donc un flag conditionnel
    // ici ne peut pas fonctionner : ce Dockerfile/docker-compose ne sert
    // qu'au dev/test local, la vraie prod est déployée depuis la branche
    // vercel-frontend avec son propre next.config.js.)
    unoptimized: true,
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    remotePatterns: [
      { protocol: 'https', hostname: 'assets.coingecko.com' },
      { protocol: 'https', hostname: 'coin-images.coingecko.com' },
      { protocol: 'https', hostname: 'api.coingecko.com' },
      { protocol: 'https', hostname: 'alvio.io' },
      { protocol: 'https', hostname: 'cdn.alvio.io' },
    ],
  },

  // ── Security & Cache Headers ────────────────────────────────────────
  async headers() {
    return [
      // Static assets — cache 1 year
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      // Public pages — cache 1 hour, stale-while-revalidate
      {
        source: '/(|pricing|markets|formation|login|register)',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=3600, stale-while-revalidate=86400' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
      // Private pages — no cache + noindex via X-Robots-Tag
      {
        source: '/(dashboard|signals|profile|reports|simulator|strategies|auth)/:path*',
        headers: [
          { key: 'Cache-Control', value: 'private, no-cache, no-store, must-revalidate' },
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
        ],
      },
      // API routes — no cache
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store' },
          { key: 'X-Robots-Tag', value: 'noindex' },
        ],
      },
    ];
  },

  // ── Redirects ────────────────────────────────────────────────────────
  async redirects() {
    return [
      // www → non-www (301 permanent)
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.alvio.io' }],
        destination: 'https://alvio.io/:path*',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
