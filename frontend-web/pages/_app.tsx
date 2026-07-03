import { ThemeProvider } from 'next-themes';
import '../styles/globals.css';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { SITE_NAME, SITE_URL, DEFAULT_OG_IMAGE, DEFAULT_DESCRIPTION } from '../lib/seo';

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
        <title>{SITE_NAME} — Trading Algorithmique Intelligent</title>
        <meta name="description" content={DEFAULT_DESCRIPTION} />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="fr_FR" />
        <meta property="og:url" content={SITE_URL} />
        <meta property="og:site_name" content={SITE_NAME} />
        <meta property="og:image" content={DEFAULT_OG_IMAGE} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@AlvioTrading" />
        <meta name="author" content={SITE_NAME} />
        <meta name="keywords" content="trading, crypto, signaux IA, algorithme, BTC, ETH, DCA, backtesting" />
      </Head>

      <PageTransition route={router.asPath}>
        <Component {...pageProps} />
      </PageTransition>
    </ThemeProvider>
  );
}

export default MyApp;
