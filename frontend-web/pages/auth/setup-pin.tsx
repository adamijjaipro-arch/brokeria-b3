import { useState, useEffect } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { authApi } from '../../api';
import { useAuthStore } from '../../context/authStore';

const SetupPinPage: NextPage = () => {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [pin, setPin] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pinAuthToken, setPinAuthToken] = useState('');

  useEffect(() => {
    if (!router.isReady) return;
    const { token } = router.query;
    if (typeof token === 'string') setPinAuthToken(token);
    else if (!pinAuthToken) router.replace('/login');
  }, [router.isReady, router.query]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin !== confirm) { setError('Les codes PIN ne correspondent pas'); return; }
    if (pin.length < 4) { setError('Le PIN doit faire au moins 4 chiffres'); return; }
    setLoading(true);
    setError('');
    try {
      const { data } = await authApi.setupPin(pinAuthToken, pin);
      setAuth(data.accessToken, data.user);
      router.replace('/dashboard');
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : msg || 'Erreur lors de la création du PIN');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head><title>Créer votre PIN — BrokerIA</title></Head>
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb', fontFamily: "'Inter', sans-serif" }}>
        <div style={{ width: '100%', maxWidth: '420px', padding: '40px', background: 'white', borderRadius: '20px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>

          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: '#fdf4ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <svg width="28" height="28" fill="none" stroke="#9333ea" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>

          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#111827', margin: '0 0 8px', textAlign: 'center' }}>Créer votre code PIN</h2>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 24px', textAlign: 'center', lineHeight: '1.6' }}>
            Ce PIN sera votre 3ème facteur d'authentification.<br />
            Choisissez un code de 4 à 6 chiffres.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '8px' }}>Nouveau PIN (4-6 chiffres)</label>
              <input
                type="password" inputMode="numeric" pattern="[0-9]*"
                maxLength={6} placeholder="••••" value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                style={{
                  width: '100%', padding: '14px', border: '2px solid #e5e7eb',
                  borderRadius: '12px', fontSize: '28px', fontWeight: 700, color: '#111827',
                  background: '#f9fafb', outline: 'none', textAlign: 'center',
                  letterSpacing: '8px', boxSizing: 'border-box',
                }}
                autoFocus required
              />
            </div>

            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '8px' }}>Confirmer le PIN</label>
              <input
                type="password" inputMode="numeric" pattern="[0-9]*"
                maxLength={6} placeholder="••••" value={confirm}
                onChange={(e) => setConfirm(e.target.value.replace(/\D/g, ''))}
                style={{
                  width: '100%', padding: '14px', border: '2px solid #e5e7eb',
                  borderRadius: '12px', fontSize: '28px', fontWeight: 700, color: '#111827',
                  background: '#f9fafb', outline: 'none', textAlign: 'center',
                  letterSpacing: '8px', boxSizing: 'border-box',
                }}
                required
              />
            </div>

            {error && (
              <div style={{ background: '#fef2f2', borderRadius: '10px', padding: '12px 14px', border: '1px solid #fecaca' }}>
                <p style={{ fontSize: '13px', color: '#dc2626', margin: 0, fontWeight: 500 }}>{error}</p>
              </div>
            )}

            <button type="submit" disabled={loading || pin.length < 4 || confirm.length < 4} style={{
              padding: '13px', borderRadius: '12px', border: 'none',
              background: (loading || pin.length < 4 || confirm.length < 4) ? '#c4b5fd' : '#9333ea',
              color: 'white', fontSize: '15px', fontWeight: 700,
              cursor: (loading || pin.length < 4 || confirm.length < 4) ? 'not-allowed' : 'pointer', width: '100%',
            }}>
              {loading ? 'Enregistrement…' : 'Créer mon PIN →'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default SetupPinPage;
