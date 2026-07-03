import { useState, useEffect } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { authApi } from '../../api';
import PageSEO from '../../components/seo/PageSEO';

const TwoFAPage: NextPage = () => {
  const router = useRouter();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [preAuthToken, setPreAuthToken] = useState('');
  const [attemptsLeft, setAttemptsLeft] = useState(3);

  useEffect(() => {
    if (!router.isReady) return;
    const { token } = router.query;
    if (typeof token === 'string') setPreAuthToken(token);
    else router.replace('/login');
  }, [router.isReady, router.query]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await authApi.verify2FA(preAuthToken, otp);
      if (data.requiresPinSetup) {
        router.replace(`/auth/setup-pin?token=${data.pinAuthToken}`);
      } else {
        router.replace(`/auth/pin?token=${data.pinAuthToken}`);
      }
    } catch (err: any) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.message;
      if (status === 423) {
        router.replace('/auth/locked');
        return;
      }
      const errMsg = Array.isArray(msg) ? msg.join(', ') : msg || 'Code incorrect ou expiré';
      setError(errMsg);
      // Extract attempts remaining from message
      const match = errMsg.match(/(\d+) tentative/);
      if (match) setAttemptsLeft(parseInt(match[1]));
      setOtp('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageSEO title="Vérification 2FA — Alvio" description="Authentification à deux facteurs Alvio. Saisissez votre code OTP pour accéder à votre compte." noindex={true} />
      <Head><title>Vérification — Alvio</title></Head>
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb', fontFamily: "'Inter', sans-serif" }}>
        <div style={{ width: '100%', maxWidth: '420px', padding: '40px', background: 'white', borderRadius: '20px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>

          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <svg width="28" height="28" fill="none" stroke="#2563eb" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>

          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#111827', margin: '0 0 8px', textAlign: 'center' }}>Étape 2 — Code email</h2>
          <p id="otp-help-text" style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 8px', textAlign: 'center', lineHeight: '1.6' }}>
            Un code à 6 chiffres a été envoyé à votre adresse email.
          </p>

          {/* Progress indicator */}
          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginBottom: '24px' }}>
            {['Mot de passe', 'Code email', 'Code PIN'].map((step, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{
                  width: '24px', height: '24px', borderRadius: '50%',
                  background: i === 0 ? '#10b981' : i === 1 ? '#2563eb' : '#e5e7eb',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '11px', fontWeight: 700, color: i < 2 ? 'white' : '#9ca3af',
                }}>{i === 0 ? '✓' : i + 1}</div>
                {i < 2 && <div style={{ width: '20px', height: '2px', background: i === 0 ? '#10b981' : '#e5e7eb' }} />}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '8px' }}>Code de vérification</label>
              <input
                type="text" inputMode="numeric" pattern="[0-9]*" maxLength={6}
                placeholder="000000" value={otp}
                aria-describedby="otp-help-text"
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                style={{
                  width: '100%', padding: '14px', border: `2px solid ${error ? '#fca5a5' : '#e5e7eb'}`,
                  borderRadius: '12px', fontSize: '28px', fontWeight: 700, color: '#111827',
                  background: '#f9fafb', outline: 'none', textAlign: 'center',
                  letterSpacing: '12px', boxSizing: 'border-box',
                }}
                autoFocus required
              />
            </div>

            {error && (
              <div role="alert" aria-live="polite" style={{ background: '#fef2f2', borderRadius: '10px', padding: '12px 14px', border: '1px solid #fecaca' }}>
                <p style={{ fontSize: '13px', color: '#dc2626', margin: '0 0 6px', fontWeight: 600 }}>{error}</p>
                {attemptsLeft > 0 && attemptsLeft < 3 && (
                  <p style={{ fontSize: '12px', color: '#ef4444', margin: 0 }}>
                    ⚠️ {attemptsLeft} tentative{attemptsLeft > 1 ? 's' : ''} avant blocage du compte
                  </p>
                )}
              </div>
            )}

            <button type="submit" disabled={loading || otp.length !== 6} style={{
              padding: '13px', borderRadius: '12px', border: 'none',
              background: (loading || otp.length !== 6) ? '#93c5fd' : '#2563eb',
              color: 'white', fontSize: '15px', fontWeight: 700,
              cursor: (loading || otp.length !== 6) ? 'not-allowed' : 'pointer', width: '100%',
            }}>
              {loading ? 'Vérification…' : 'Confirmer →'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px' }}>
            <button onClick={() => router.push('/login')} style={{ color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, fontSize: '13px' }}>
              ← Retour à la connexion
            </button>
          </p>
        </div>
      </div>
    </>
  );
};

export default TwoFAPage;
