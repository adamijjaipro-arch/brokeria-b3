/**
 * Page /auth/github-callback?token=xxx
 *
 * Atterrissage après le flux OAuth GitHub.
 * Le backend a :
 *   1. Posé le cookie httpOnly refresh_token
 *   2. Redirigé ici avec le access token en query param
 *
 * Cette page :
 *   1. Lit le token de l'URL
 *   2. Le stocke dans Zustand (mémoire)
 *   3. Supprime le token de l'URL (router.replace)
 *   4. Récupère le profil utilisateur
 *   5. Redirige vers le dashboard
 *
 * Architecture note : le token dans l'URL est une concession de sécurité
 * (visible dans les logs serveur). Alternative : POST code opaque → backend.
 */
import { useEffect, useState } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { authApi } from '../../api';
import { useAuthStore } from '../../context/authStore';

const GithubCallbackPage: NextPage = () => {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!router.isReady) return;

    const { token, error: oauthError } = router.query;

    if (oauthError) {
      setError(true);
      return;
    }

    if (typeof token !== 'string' || !token) {
      setError(true);
      return;
    }

    // Supprime le token de l'URL immédiatement (anti-log)
    router.replace('/auth/github-callback', undefined, { shallow: true });

    // Récupère le profil avec le token
    authApi
      .getProfile(token)
      .then(({ data }) => {
        setAuth(token, { id: data.id, email: data.email, username: data.username });
        router.replace('/dashboard');
      })
      .catch(() => {
        setError(true);
      });
  }, [router.isReady, router.query]);

  return (
    <>
      <Head><title>Connexion GitHub — BrokerIA</title></Head>
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb', fontFamily: "'Inter', sans-serif" }}>
        <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '20px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', maxWidth: '400px', width: '100%' }}>

          {!error ? (
            <>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', border: '3px solid #e5e7eb', borderTop: '3px solid #2563eb', margin: '0 auto 20px', animation: 'spin 0.8s linear infinite' }} />
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', margin: '0 0 8px' }}>Connexion GitHub…</h2>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>Finalisation de l'authentification</p>
            </>
          ) : (
            <>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <svg width="28" height="28" fill="none" stroke="#ef4444" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', margin: '0 0 8px' }}>Erreur GitHub OAuth</h2>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 20px' }}>La connexion avec GitHub a échoué.</p>
              <button
                onClick={() => router.push('/login')}
                style={{ padding: '12px 24px', borderRadius: '10px', border: 'none', background: '#2563eb', color: 'white', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}
              >
                Réessayer
              </button>
            </>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
};

export default GithubCallbackPage;
