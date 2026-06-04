import { useState, useEffect } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { authApi } from '../../api';

const CreatePasswordPage: NextPage = () => {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [preAuthToken, setPreAuthToken] = useState('');
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    if (!router.isReady) return;
    const { token } = router.query;
    if (typeof token === 'string') setPreAuthToken(token);
    else router.replace('/login');
  }, [router.isReady, router.query]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError('Les mots de passe ne correspondent pas'); return; }
    if (password.length < 6) { setError('Le mot de passe doit faire au moins 6 caractères'); return; }
    setLoading(true);
    setError('');
    try {
      const { data } = await authApi.setPassword(preAuthToken, password);
      router.replace(`/auth/2fa?token=${data.preAuthToken}`);
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : msg || 'Erreur lors de la création du mot de passe');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 16px', border: '1px solid #e5e7eb',
    borderRadius: '12px', fontSize: '14px', color: '#111827',
    background: '#f9fafb', outline: 'none', boxSizing: 'border-box',
  };

  return (
    <>
      <Head><title>Créer un mot de passe — Alvio</title></Head>
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb', fontFamily: "'Inter', sans-serif" }}>
        <div style={{ width: '100%', maxWidth: '420px', padding: '40px', background: 'white', borderRadius: '20px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>

          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <svg width="28" height="28" fill="none" stroke="#10b981" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>

          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#111827', margin: '0 0 8px', textAlign: 'center' }}>Créer votre mot de passe</h2>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 28px', textAlign: 'center', lineHeight: '1.6' }}>
            Votre connexion magic link a été vérifiée.<br />
            Créez maintenant un mot de passe pour sécuriser votre compte.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Mot de passe</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ ...inputStyle, paddingRight: '44px' }}
                  required
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 0 }}>
                  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {showPass
                      ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59" />
                      : <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>
                    }
                  </svg>
                </button>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Confirmer le mot de passe</label>
              <input
                type="password"
                placeholder="••••••••"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                style={inputStyle}
                required
              />
            </div>

            {error && (
              <div style={{ background: '#fef2f2', borderRadius: '10px', padding: '12px 14px', border: '1px solid #fecaca' }}>
                <p style={{ fontSize: '13px', color: '#dc2626', margin: 0, fontWeight: 500 }}>{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '13px', borderRadius: '12px', border: 'none',
                background: loading ? '#6ee7b7' : '#10b981',
                color: 'white', fontSize: '15px', fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer', width: '100%',
              }}
            >
              {loading ? 'Enregistrement…' : 'Créer le mot de passe →'}
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

export default CreatePasswordPage;
