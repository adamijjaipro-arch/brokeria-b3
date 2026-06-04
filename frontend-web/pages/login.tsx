/**
 * Page /login — 3 méthodes d'authentification :
 *   1. Email / Mot de passe
 *   2. Magic Link (lien par email)
 *   3. GitHub OAuth
 */
import React, { useState } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { authApi } from '../api';
import { useAuthStore } from '../context/authStore';

type Tab = 'password' | 'magic';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const LoginPage: NextPage = () => {
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const [tab, setTab] = useState<Tab>('password');

  // Email / password
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  // Magic link
  const [magicEmail, setMagicEmail] = useState('');
  const [magicSent, setMagicSent]   = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await authApi.login(email, password);
      setAuth(data.accessToken, data.user);
      router.push('/dashboard');
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : msg || 'Email ou mot de passe incorrect');
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await authApi.requestMagicLink(magicEmail);
      setMagicSent(true);
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : msg || 'Erreur lors de l\'envoi du lien');
    } finally {
      setLoading(false);
    }
  };

  /** Redirige vers l'endpoint backend GitHub OAuth */
  const handleGithubLogin = () => {
    window.location.href = `${API_URL}/auth/github`;
  };

  // ─── Styles réutilisables ────────────────────────────────────────────────────

  const input: React.CSSProperties = {
    width: '100%', padding: '12px 16px', border: '1px solid #e5e7eb',
    borderRadius: '12px', fontSize: '14px', color: '#111827', background: '#f9fafb',
    outline: 'none', boxSizing: 'border-box',
  };

  const btnPrimary: React.CSSProperties = {
    padding: '13px', borderRadius: '12px', border: 'none',
    background: loading ? '#93c5fd' : '#2563eb', color: 'white',
    fontSize: '15px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    width: '100%',
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      <Head><title>Connexion — Alvio</title></Head>
      <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>

        {/* ── Panneau gauche — brand ────────────────────────────────────────── */}
        <div style={{
          width: '45%', background: '#0d1117', display: 'none',
          flexDirection: 'column', justifyContent: 'space-between',
          padding: '40px 48px', position: 'relative', overflow: 'hidden',
        }} className="left-panel">
          <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(37,99,235,0.12)', filter: 'blur(60px)' }} />
          <div style={{ position: 'absolute', bottom: '-60px', left: '-60px', width: '250px', height: '250px', borderRadius: '50%', background: 'rgba(16,185,129,0.08)', filter: 'blur(50px)' }} />

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', position: 'relative' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M3 17l4-8 4 4 4-6 4 3" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M3 17h18" stroke="white" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <span style={{ color: 'white', fontWeight: 700, fontSize: '20px' }}>Alvio</span>
          </div>

          <div style={{ position: 'relative' }}>
            <h1 style={{ fontSize: '36px', fontWeight: 800, color: 'white', margin: '0 0 16px', lineHeight: '1.15' }}>
              Tradez plus intelligent<br />avec l'IA
            </h1>
            <p style={{ fontSize: '16px', color: '#6b7280', margin: '0 0 40px', lineHeight: '1.6' }}>
              Signaux en temps réel, détection de patterns, DCA simulation — tout en un.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { icon: '🎯', stat: '92%',    label: 'Précision des signaux IA' },
                { icon: '⚡', stat: '15+',    label: 'Patterns détectés en temps réel' },
                { icon: '👥', stat: '2 400+', label: 'Traders actifs' },
              ].map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', background: 'rgba(255,255,255,0.04)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ fontSize: '20px' }}>{s.icon}</span>
                  <div>
                    <p style={{ fontSize: '18px', fontWeight: 700, color: 'white', margin: 0 }}>{s.stat}</p>
                    <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ position: 'relative', padding: '16px', background: 'rgba(255,255,255,0.04)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p style={{ fontSize: '13px', color: '#9ca3af', margin: '0 0 8px', fontStyle: 'italic' }}>
              "Alvio a transformé ma façon de trader. +40% de win rate."
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: 'white' }}>ML</div>
              <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 600 }}>Marc L. — Trader Pro</span>
            </div>
          </div>
        </div>

        {/* ── Panneau droit — formulaires ───────────────────────────────────── */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb', padding: '40px' }}>
          <div style={{ width: '100%', maxWidth: '420px' }}>

            <div style={{ marginBottom: '28px' }}>
              <h2 style={{ fontSize: '26px', fontWeight: 700, color: '#111827', margin: '0 0 6px' }}>Connexion</h2>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
                Pas encore de compte ?{' '}
                <Link href="/register" style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>Créer un compte</Link>
              </p>
            </div>

            {/* ── GitHub OAuth ──────────────────────────────────────────────── */}
            <button onClick={handleGithubLogin} style={{
              width: '100%', padding: '12px', borderRadius: '12px',
              border: '1px solid #e5e7eb', background: '#fff',
              color: '#111827', fontSize: '15px', fontWeight: 600,
              cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: '10px', marginBottom: '20px',
            }}>
              {/* GitHub icon */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
              </svg>
              Continuer avec GitHub
            </button>

            {/* Séparateur */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
              <span style={{ fontSize: '13px', color: '#9ca3af' }}>ou</span>
              <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
            </div>

            {/* ── Tabs Email / Magic Link ───────────────────────────────────── */}
            <div style={{ display: 'flex', gap: '4px', background: '#f3f4f6', borderRadius: '10px', padding: '4px', marginBottom: '20px' }}>
              {(['password', 'magic'] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => { setTab(t); setError(''); setMagicSent(false); }}
                  style={{
                    flex: 1, padding: '8px', borderRadius: '8px', border: 'none',
                    background: tab === t ? 'white' : 'transparent',
                    color: tab === t ? '#111827' : '#6b7280',
                    fontWeight: tab === t ? 700 : 500, fontSize: '14px', cursor: 'pointer',
                    boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  }}
                >
                  {t === 'password' ? 'Mot de passe' : 'Magic Link'}
                </button>
              ))}
            </div>

            {/* ── Formulaire Email / Password ───────────────────────────────── */}
            {tab === 'password' && (
              <form onSubmit={handlePasswordLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Email</label>
                  <input type="email" placeholder="john@example.com" value={email}
                    onChange={(e) => setEmail(e.target.value)} style={input} required />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>Mot de passe</label>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPass ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      style={{ ...input, paddingRight: '44px' }}
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

                {error && <ErrorBox message={error} />}

                <button type="submit" disabled={loading} style={btnPrimary}>
                  {loading ? <Spinner /> : 'Se connecter'}
                </button>
              </form>
            )}

            {/* ── Formulaire Magic Link ─────────────────────────────────────── */}
            {tab === 'magic' && (
              <div>
                {magicSent ? (
                  <div style={{ textAlign: 'center', padding: '24px 0' }}>
                    <div style={{ fontSize: '40px', marginBottom: '12px' }}>📬</div>
                    <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', margin: '0 0 8px' }}>Email envoyé !</h3>
                    <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 16px' }}>
                      Vérifiez votre boîte mail à <strong>{magicEmail}</strong>.<br />
                      Le lien expire dans 15 minutes.
                    </p>
                    <button onClick={() => { setMagicSent(false); setMagicEmail(''); }}
                      style={{ fontSize: '13px', color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                      Renvoyer un lien
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleMagicLink} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
                      Entrez votre email et recevez un lien de connexion instantané — sans mot de passe.
                    </p>
                    <div>
                      <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Email</label>
                      <input type="email" placeholder="john@example.com" value={magicEmail}
                        onChange={(e) => setMagicEmail(e.target.value)} style={input} required />
                    </div>

                    {error && <ErrorBox message={error} />}

                    <button type="submit" disabled={loading} style={btnPrimary}>
                      {loading ? <Spinner /> : 'Envoyer le lien magique ✨'}
                    </button>
                  </form>
                )}
              </div>
            )}

            <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px', color: '#9ca3af' }}>
              <Link href="/" style={{ color: '#6b7280', textDecoration: 'none', fontWeight: 500 }}>← Retour à l'accueil</Link>
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @media (min-width: 768px) { .left-panel { display: flex !important; } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
};

// ─── Micro-composants ─────────────────────────────────────────────────────────

const Spinner = () => (
  <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', animation: 'spin 0.7s linear infinite' }} />
);

const ErrorBox = ({ message }: { message: string }) => (
  <div style={{ background: '#fef2f2', borderRadius: '10px', padding: '12px 14px', border: '1.5px solid #fecaca', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
    <span style={{ fontSize: '18px', flexShrink: 0 }}>⚠️</span>
    <div>
      <p style={{ fontSize: '13px', color: '#991b1b', margin: 0, fontWeight: 600 }}>Erreur</p>
      <p style={{ fontSize: '13px', color: '#dc2626', margin: '4px 0 0', lineHeight: '1.4' }}>{message}</p>
    </div>
  </div>
);

export default LoginPage;
