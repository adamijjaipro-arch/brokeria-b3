import { Html, Head, Main, NextScript } from 'next/document';

// SVG du logo Alvio encodé en data URI pour le favicon
const FAVICON_SVG = `data:image/svg+xml,${encodeURIComponent(
  '<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">' +
  '<rect width="32" height="32" rx="8" fill="#0d1117"/>' +
  '<polygon points="16,4 28,26 4,26" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linejoin="round"/>' +
  '<polyline points="7,22 11,15 15,18 20,9 26,13" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
  '<circle cx="20" cy="9" r="2.5" fill="#10b981"/>' +
  '</svg>'
)}`;

export default function Document() {
  return (
    <Html lang="fr">
      <Head>
        {/* Favicon Alvio */}
        <link rel="icon" type="image/svg+xml" href={FAVICON_SVG} />
        <link rel="shortcut icon" href={FAVICON_SVG} />
        <meta name="application-name" content="Alvio" />
        <meta name="apple-mobile-web-app-title" content="Alvio" />

        {/* Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
