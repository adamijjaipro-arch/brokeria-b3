import { useState, useEffect } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { authApi } from '../../api';
import { useAuthStore } from '../../context/authStore';
import PageSEO from '../../components/seo/PageSEO';

const PinPage: NextPage = () => {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pinAuthToken, setPinAuthToken] = useState('');
  const [attemptsLeft, setAttemptsLeft] = useState(3);

  useEffect(() => {
    if (!router.isReady) return;
    const { token } = router.query;
    if (typeof token === 'string') setPinAuthToken(token);
    else if (!pinAuthToken) router.replace('/login');
  }, [router.isReady, router.query]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length < 4) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await authApi.verifyPin(pinAuthToken, pin);
      setAuth(data.accessToken, data.user);
      router.replace('/dashboard');
    } catch (err: any) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.message;
      if (status === 423) { router.replace('/auth/locked'); return; }
      const errMsg = Array.isArray(msg) ? msg.join(', ') : msg || 'Code PIN incorrect';
      setError(errMsg);
      const match = errMsg.match(/(\d+) tentative/);
      if (match) setAttemptsLeft(parseInt(match[1]));
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageSEO title="Code PIN — Alvio" description="Confirmez votre identité avec votre code PIN Alvio pour accéder à votre espace de trading." noindex={true} />
      <Head><title>Code PIN — Alvio</title></Head>
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb', fontFamily: "'Inter', sans-serif" }}>
        <div style={{ width: '100%', maxWidth: '420px', padding: '40px', background: 'white', borderRadius: '20px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>

          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: '#fdf4ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <svg width="28" height="28" fill="none" stroke="#9333ea" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>

          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#111827', margin: '0 0 8px', textAlign: 'center' }}>Étape 3 — Code PIN</h2>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 8px', textAlign: 'center' }}>Entrez votre code PIN personnel.</p>

          {/* Progress */}
          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginBottom: '24px' }}>
            {['Mot de passe', 'Code email', 'Code PIN'].map((_step, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{
                  width: '24px', height: '24px', borderRadius: '50%',
                  background: i < 2 ? '#10b981' : '#9333ea',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '11px', fontWeight: 700, color: 'white',
                }}>{i < 2 ? '✓' : '3'}</div>
                {i < 2 && <div style={{ width: '20px', height: '2px', background: '#10b981' }} />}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '8px' }}>Code PIN (4-6 chiffres)</label>
              <input
                type="password" inputMode="numeric" pattern="[0-9]*"
                maxLength={6} placeholder="••••" value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                style={{
                  width: '100%', padding: '14px', border: `2px solid ${error ? '#fca5a5' : '#e5e7eb'}`,
                  borderRadius: '12px', fontSize: '28px', fontWeight: 700, color: '#111827',
                  background: '#f9fafb', outline: 'none', textAlign: 'center',
                  letterSpacing: '8px', boxSizing: 'border-box',
                }}
                autoFocus required
              />
            </div>

            {error && (
              <div style={{ background: '#fef2f2', borderRadius: '10px', padding: '12px 14px', border: '1px solid #fecaca' }}>
                <p style={{ fontSize: '13px', color: '#dc2626', margin: '0 0 4px', fontWeight: 600 }}>{error}</p>
                {attemptsLeft > 0 && attemptsLeft < 3 && (
                  <p style={{ fontSize: '12px', color: '#ef4444', margin: 0 }}>⚠️ {attemptsLeft} tentative{attemptsLeft > 1 ? 's' : ''} avant blocage</p>
                )}
              </div>
            )}

            <button type="submit" disabled={loading || pin.length < 4} style={{
              padding: '13px', borderRadius: '12px', border: 'none',
              background: (loading || pin.length < 4) ? '#c4b5fd' : '#9333ea',
              color: 'white', fontSize: '15px', fontWeight: 700,
              cursor: (loading || pin.length < 4) ? 'not-allowed' : 'pointer', width: '100%',
            }}>
              {loading ? 'Vérification…' : 'Confirmer le PIN →'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px' }}>
            <button onClick={() => router.push('/login')} style={{ color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, fontSize: '13px' }}>← Retour</button>
          </p>
        </div>
      </div>
    </>
  );
};

export default PinPage;
