import React, { useState } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { authApi } from '../api';

const RegisterPage: NextPage = () => {
  const router = useRouter();
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [plan, setPlan] = useState<'starter' | 'pro'>('starter');
  const [error, setError] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await authApi.register(form.email, form.username, form.password);
      router.push(`/auth/2fa?token=${data.preAuthToken}`);
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : msg || 'Erreur lors de la création du compte');
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 16px', border: '1px solid #e5e7eb',
    borderRadius: '12px', fontSize: '14px', color: '#111827',
    background: '#f9fafb', outline: 'none', boxSizing: 'border-box',
  };

  const FEATURES = ['Signaux IA illimités', 'Simulateur de trading', 'Formation complète', 'Alertes en temps réel', 'Support 24/7'];

  return (
    <>
      <Head><title>Créer un compte — TradingAI</title></Head>
      <div style={{ display: 'flex', height: '100vh', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

        {/* Left panel */}
        <div style={{ width: '45%', background: '#0d1117', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '40px 48px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-80px', left: '-80px', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(37,99,235,0.1)', filter: 'blur(60px)' }} />
          <div style={{ position: 'absolute', bottom: '-60px', right: '-60px', width: '250px', height: '250px', borderRadius: '50%', background: 'rgba(16,185,129,0.08)', filter: 'blur(50px)' }} />

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', position: 'relative' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M3 17l4-8 4 4 4-6 4 3" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M3 17h18" stroke="white" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <span style={{ color: 'white', fontWeight: 700, fontSize: '20px' }}>TradingAI</span>
          </div>

          <div style={{ position: 'relative' }}>
            <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'white', margin: '0 0 14px', lineHeight: '1.2' }}>
              Rejoignez 2 400+<br />traders gagnants
            </h1>
            <p style={{ fontSize: '15px', color: '#6b7280', margin: '0 0 32px', lineHeight: '1.6' }}>
              Créez votre compte gratuitement et commencez à trader avec l'intelligence artificielle.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {FEATURES.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="11" height="11" fill="none" stroke="white" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <span style={{ fontSize: '14px', color: '#e5e7eb', fontWeight: 500 }}>{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Plan selector */}
          <div>
            <p style={{ fontSize: '12px', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>Choisissez votre plan</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              {[
                { id: 'starter', label: 'Starter', price: 'Gratuit', color: '#6b7280' },
                { id: 'pro', label: 'Pro', price: '€29/mois', color: '#2563eb' },
              ].map((p) => (
                <button key={p.id} onClick={() => setPlan(p.id as any)} style={{
                  flex: 1, padding: '12px', borderRadius: '12px', cursor: 'pointer',
                  border: plan === p.id ? `2px solid ${p.color}` : '2px solid rgba(255,255,255,0.08)',
                  background: plan === p.id ? `${p.color}22` : 'rgba(255,255,255,0.04)',
                  color: plan === p.id ? 'white' : '#6b7280',
                  textAlign: 'center', transition: 'all 0.15s',
                }}>
                  <p style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 2px' }}>{p.label}</p>
                  <p style={{ fontSize: '12px', margin: 0, opacity: 0.8 }}>{p.price}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right panel — form */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb', padding: '40px' }}>
          <div style={{ width: '100%', maxWidth: '420px' }}>
            <div style={{ marginBottom: '28px' }}>
              <h2 style={{ fontSize: '26px', fontWeight: 700, color: '#111827', margin: '0 0 6px' }}>Créer un compte</h2>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
                Déjà inscrit ?{' '}
                <Link href="/login" style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>Se connecter</Link>
              </p>
            </div>

            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Nom d'utilisateur</label>
                <input type="text" placeholder="johndoe" value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })} style={inputStyle} />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Email</label>
                <input type="email" placeholder="john.doe@example.com" value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })} style={inputStyle} />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Mot de passe</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPass ? 'text' : 'password'} placeholder="Minimum 8 caractères" value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    style={{ ...inputStyle, paddingRight: '44px' }} />
                  <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 0 }}>
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {showPass
                        ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        : <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>
                      }
                    </svg>
                  </button>
                </div>
                {/* Password strength */}
                {form.password && (
                  <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} style={{ flex: 1, height: '3px', borderRadius: '2px', background: form.password.length >= i * 2 ? (form.password.length >= 8 ? '#10b981' : '#f97316') : '#e5e7eb' }} />
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', padding: '2px 0' }}>
                <input type="checkbox" id="terms" style={{ marginTop: '2px', accentColor: '#2563eb', flexShrink: 0 }} />
                <label htmlFor="terms" style={{ fontSize: '12px', color: '#6b7280', lineHeight: '1.5', cursor: 'pointer' }}>
                  J'accepte les <span style={{ color: '#2563eb', fontWeight: 600 }}>Conditions d'utilisation</span> et la <span style={{ color: '#2563eb', fontWeight: 600 }}>Politique de confidentialité</span>
                </label>
              </div>

              {error && (
                <div style={{ background: '#fef2f2', borderRadius: '10px', padding: '12px 14px', border: '1px solid #fecaca' }}>
                  <p style={{ fontSize: '13px', color: '#dc2626', margin: 0, fontWeight: 500 }}>{error}</p>
                </div>
              )}

              <button type="submit" disabled={loading} style={{
                padding: '13px', borderRadius: '12px', border: 'none',
                background: loading ? '#93c5fd' : '#2563eb', color: 'white',
                fontSize: '15px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                marginTop: '4px',
              }}>
                {loading ? (
                  <>
                    <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', animation: 'spin 0.7s linear infinite' }} />
                    Création en cours...
                  </>
                ) : `🚀 Créer mon compte ${plan === 'pro' ? 'Pro' : 'gratuit'}`}
              </button>
            </form>

            <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px', color: '#9ca3af' }}>
              <Link href="/" style={{ color: '#6b7280', textDecoration: 'none', fontWeight: 500 }}>← Retour à l'accueil</Link>
            </p>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
};

export default RegisterPage;
