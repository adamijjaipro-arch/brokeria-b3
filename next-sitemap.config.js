/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://alvio.io',
  generateRobotsTxt: false, // on utilise notre robots.txt manuel
  generateIndexSitemap: false,
  outDir: 'public',

  // Pages à exclure (privées)
  exclude: [
    '/dashboard',
    '/dashboard/*',
    '/signals',
    '/signals/*',
    '/profile',
    '/profile/*',
    '/reports',
    '/reports/*',
    '/simulator',
    '/simulator/*',
    '/strategies',
    '/strategies/*',
    '/auth/*',
    '/api/*',
  ],

  // Priorité et fréquence par page
  transform: async (config, path) => {
    const priorities = {
      '/': 1.0,
      '/pricing': 0.9,
      '/markets': 0.9,
      '/formation': 0.85,
      '/login': 0.5,
      '/register': 0.6,
    };

    const changefreqs = {
      '/': 'daily',
      '/pricing': 'weekly',
      '/markets': 'hourly',
      '/formation': 'weekly',
      '/login': 'monthly',
      '/register': 'monthly',
    };

    return {
      loc: path,
      changefreq: changefreqs[path] ?? 'weekly',
      priority: priorities[path] ?? 0.7,
      lastmod: new Date().toISOString(),
      alternateRefs: [],
    };
  },
};
