/**
 * Page /auth/magic?token=xxx
 *
 * Atterrissage après clic sur le magic link reçu par email.
 * Appelle /auth/magic-link/verify avec le token de l'URL,
 * stocke le access token dans Zustand, redirige vers le dashboard.
 */
import { useEffect, useRef, useState } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { authApi } from '../../api';
import { useAuthStore } from '../../context/authStore';

const MagicCallbackPage: NextPage = () => {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const called = useRef(false);

  useEffect(() => {
    if (!router.isReady) return;
    if (called.current) return;

    const { token } = router.query;

    if (typeof token !== 'string' || !token) {
      setStatus('error');
      return;
    }

    called.current = true;

    authApi
      .verifyMagicLink(token)
      .then(({ data }) => {
        if ((data as any).requiresPassword) {
          router.replace(`/auth/create-password?token=${(data as any).preAuthToken}`);
        } else {
          router.replace(`/auth/2fa?token=${(data as any).preAuthToken}`);
        }
      })
      .catch(() => {
        setStatus('error');
      });
  }, [router.isReady, router.query]);

  return (
    <>
      <Head><title>Connexion en cours… — Alvio</title></Head>
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb', fontFamily: "'Inter', sans-serif" }}>
        <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '20px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', maxWidth: '400px', width: '100%' }}>

          {status === 'loading' && (
            <>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', border: '3px solid #e5e7eb', borderTop: '3px solid #2563eb', margin: '0 auto 20px', animation: 'spin 0.8s linear infinite' }} />
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', margin: '0 0 8px' }}>Vérification en cours…</h2>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>Validation de votre lien magique</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <svg width="28" height="28" fill="none" stroke="#10b981" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', margin: '0 0 8px' }}>Connecté !</h2>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>Redirection vers le tableau de bord…</p>
            </>
          )}

          {status === 'error' && (
            <>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <svg width="28" height="28" fill="none" stroke="#ef4444" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', margin: '0 0 8px' }}>Lien invalide ou expiré</h2>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 20px' }}>
                Ce lien a déjà été utilisé ou a expiré (15 min).<br />Demandez-en un nouveau.
              </p>
              <button
                onClick={() => router.push('/login')}
                style={{ padding: '12px 24px', borderRadius: '10px', border: 'none', background: '#2563eb', color: 'white', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}
              >
                Retour à la connexion
              </button>
            </>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
};

export default MagicCallbackPage;
