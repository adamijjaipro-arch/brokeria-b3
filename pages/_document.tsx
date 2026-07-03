import { Html, Head, Main, NextScript } from 'next/document';
import { ORGANIZATION_JSONLD, WEBSITE_JSONLD, SITE_URL, SITE_NAME } from '../lib/seo';

export default function Document() {
  return (
    <Html lang="fr" suppressHydrationWarning>
      <Head>
        {/* ── Charset & Base ─────────────────────────────── */}
        <meta charSet="utf-8" />
        <meta name="author" content={SITE_NAME} />
        <meta name="creator" content={SITE_NAME} />
        <meta name="publisher" content={SITE_NAME} />
        <meta name="theme-color" content="#3B82F6" />
        <meta name="color-scheme" content="dark" />
        <meta name="application-name" content={SITE_NAME} />
        <meta name="apple-mobile-web-app-title" content={SITE_NAME} />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="format-detection" content="telephone=no" />

        {/* ── Favicons ───────────────────────────────────── */}
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="mask-icon" href="/favicon.svg" color="#3B82F6" />

        {/* ── PWA Manifest ───────────────────────────────── */}
        <link rel="manifest" href="/manifest.json" />

        {/* ── Fonts — next/font handled in _app, preconnect here ── */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />

        {/* ── DNS Prefetch ────────────────────────────────── */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />

        {/* ── JSON-LD: Organization + WebSite (global) ───── */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_JSONLD) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(WEBSITE_JSONLD) }}
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
