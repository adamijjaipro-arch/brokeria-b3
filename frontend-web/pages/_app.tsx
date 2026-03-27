import { ThemeProvider } from 'next-themes';
import '../styles/globals.css';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

const PageTransition = dynamic(() => import('../components/layout/PageTransition'), { ssr: false });

// Routes publiques qui n'ont pas besoin d'un initAuth silencieux
const PUBLIC_ROUTES = ['/login', '/register', '/', '/pricing', '/formation'];

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const { initAuth } = useAuth();

  useEffect(() => {
    // Au premier chargement (ou après F5) : tente de récupérer l'access token
    // via le cookie httpOnly refresh_token. Silencieux si non connecté.
    if (!PUBLIC_ROUTES.includes(router.pathname)) {
      initAuth();
    }
  }, []);

  return (
    <ThemeProvider attribute="class">
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <PageTransition route={router.asPath}>
        <Component {...pageProps} />
      </PageTransition>
    </ThemeProvider>
  );
}

export default MyApp;
