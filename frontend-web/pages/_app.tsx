import { ThemeProvider } from 'next-themes';
import '../styles/globals.css';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { useEffect } from 'react';
import { DefaultSeo } from 'next-seo';
import { useAuth } from '../hooks/useAuth';
import { SITE_NAME, SITE_URL, TWITTER_HANDLE, DEFAULT_OG_IMAGE, DEFAULT_DESCRIPTION } from '../lib/seo';

const PageTransition = dynamic(() => import('../components/layout/PageTransition'), { ssr: false });

const PUBLIC_ROUTES = ['/login', '/register', '/', '/pricing', '/formation'];

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const { initAuth } = useAuth();

  useEffect(() => {
    if (!PUBLIC_ROUTES.includes(router.pathname)) {
      initAuth();
    }
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>

      <DefaultSeo
        titleTemplate={`%s | ${SITE_NAME}`}
        defaultTitle={`${SITE_NAME} — Trading Algorithmique Intelligent`}
        description={DEFAULT_DESCRIPTION}
        canonical={SITE_URL}
        openGraph={{
          type: 'website',
          locale: 'fr_FR',
          url: SITE_URL,
          siteName: SITE_NAME,
          images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: `${SITE_NAME} — Trading Algorithmique` }],
        }}
        twitter={{
          handle: TWITTER_HANDLE,
          site: TWITTER_HANDLE,
          cardType: 'summary_large_image',
        }}
        additionalMetaTags={[
          { name: 'author', content: SITE_NAME },
          { name: 'keywords', content: 'trading, crypto, signaux IA, algorithme, BTC, ETH, DCA, backtesting' },
        ]}
      />

      <PageTransition route={router.asPath}>
        <Component {...pageProps} />
      </PageTransition>
    </ThemeProvider>
  );
}

export default MyApp;
