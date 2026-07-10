import React, { useEffect, useState } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import AppLayout from '../../components/layout/AppLayout';
import PageSEO from '../../components/seo/PageSEO';
import { signalsApi } from '../../api';
import type { Signal } from '@/types';

const card: React.CSSProperties = {
  backgroundColor: 'white',
  borderRadius: '16px',
  padding: '24px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
};

const parseJsonArray = (raw?: string | null): string[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return [];
  }
};

const parseTp2 = (raw?: string | null): number | null => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed?.tp2 === 'number' ? parsed.tp2 : null;
  } catch {
    return null;
  }
};

const SignalDetailPage: NextPage = () => {
  const router = useRouter();
  const { id } = router.query;

  const [signal, setSignal]   = useState<Signal | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!router.isReady || typeof id !== 'string') return;

    setLoading(true);
    setNotFound(false);

    signalsApi.getById(id)
      .then(({ data }) => setSignal(data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [router.isReady, id]);

  if (loading) {
    return (
      <AppLayout>
        <PageSEO title="Chargement… — Alvio" noindex={true} />
        <div style={{ ...card, textAlign: 'center', color: '#9ca3af' }}>
          Chargement du signal…
        </div>
      </AppLayout>
    );
  }

  if (notFound || !signal) {
    return (
      <AppLayout>
        <PageSEO title="Signal introuvable — Alvio" noindex={true} />
        <div style={{ ...card, textAlign: 'center' }}>
          <p style={{ fontSize: '18px', fontWeight: 700, color: '#111827', margin: '0 0 8px' }}>
            Signal introuvable
          </p>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 20px' }}>
            Ce signal n&apos;existe pas ou ne vous appartient pas.
          </p>
          <button onClick={() => router.push('/signals')} style={{
            padding: '10px 20px', borderRadius: '10px', border: 'none',
            background: '#2563eb', color: 'white', fontSize: '14px', fontWeight: 700, cursor: 'pointer',
          }}>
            Retour aux signaux
          </button>
        </div>
      </AppLayout>
    );
  }

  const isBuy    = signal.direction === 'BUY';
  const risk     = Math.abs(signal.entry_price - signal.stop_loss).toFixed(2);
  const gain     = Math.abs(signal.take_profit - signal.entry_price).toFixed(2);
  const rr       = risk !== '0.00' ? `1:${(Number(gain) / Number(risk)).toFixed(1)}` : '—';
  const patterns = parseJsonArray(signal.patterns);
  const tp2      = parseTp2(signal.indicators);
  const date     = new Date(signal.createdAt).toLocaleString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  const fmt = (v: number) => v < 1 ? `$${v}` : `$${v.toLocaleString('fr-FR')}`;

  return (
    <AppLayout>
      <PageSEO
        title={`${signal.asset} — Signal ${signal.direction} — Alvio`}
        description={`Signal ${signal.direction} sur ${signal.asset} — Confiance ${signal.confidence}%. Analyse IA Alvio.`}
        noindex={true}
      />
      <Head><title>{signal.asset} — Signal — Alvio</title></Head>

      {/* Back button + header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <button onClick={() => router.push('/signals')} style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '8px 14px', borderRadius: '10px', border: '1px solid #e5e7eb',
          background: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#374151',
        }}>
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Retour aux signaux
        </button>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#111827', margin: 0 }}>{signal.asset}</h1>
        <span style={{ background: isBuy ? '#2563eb' : '#ef4444', color: 'white', fontSize: '13px', fontWeight: 700, padding: '4px 12px', borderRadius: '8px' }}>{signal.direction}</span>
        {signal.timeframe && (
          <span style={{ background: '#f3f4f6', color: '#6b7280', fontSize: '12px', fontWeight: 600, padding: '4px 10px', borderRadius: '8px', fontFamily: 'monospace', border: '1px solid #e5e7eb' }}>{signal.timeframe}</span>
        )}
        <span style={{ fontSize: '12px', color: '#9ca3af', marginLeft: 'auto' }}>{date}</span>
      </div>

      {/* Confidence bar */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div>
            <p style={{ fontSize: '13px', fontWeight: 600, color: '#6b7280', margin: '0 0 2px' }}>Score de confiance IA</p>
            <p style={{ fontSize: '36px', fontWeight: 700, color: '#111827', margin: 0 }}>{signal.confidence}%</p>
          </div>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: isBuy ? '#f0fdf4' : '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="28" height="28" fill="none" stroke={isBuy ? '#10b981' : '#ef4444'} viewBox="0 0 24 24">
              {isBuy ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />}
            </svg>
          </div>
        </div>
        <div style={{ height: '10px', background: '#e5e7eb', borderRadius: '99px', overflow: 'hidden' }}>
          <div style={{ width: `${signal.confidence}%`, height: '100%', background: signal.confidence >= 90 ? '#10b981' : '#2563eb', borderRadius: '99px', transition: 'width 0.8s ease' }} />
        </div>
        {patterns[0] && (
          <p style={{ fontSize: '12px', color: '#9ca3af', margin: '8px 0 0' }}>Pattern principal : <strong style={{ color: '#374151' }}>{patterns[0]}</strong></p>
        )}
      </div>

      {/* Price grid */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${tp2 ? 5 : 4}, 1fr)`, gap: '12px' }}>
        {[
          { label: "Prix d'entrée", value: fmt(signal.entry_price), color: '#111827', bg: '#f9fafb' },
          { label: 'Objectif (TP1)', value: fmt(signal.take_profit), color: '#10b981', bg: '#f0fdf4' },
          ...(tp2 ? [{ label: 'Objectif (TP2)', value: fmt(tp2), color: '#10b981', bg: '#f0fdf4' }] : []),
          { label: 'Stop Loss (SL)', value: fmt(signal.stop_loss), color: '#ef4444', bg: '#fef2f2' },
          { label: 'Risk/Reward', value: rr, color: '#2563eb', bg: '#eff6ff' },
        ].map((p, i) => (
          <div key={i} style={{ ...card, background: p.bg, textAlign: 'center' }}>
            <p style={{ fontSize: '12px', color: '#9ca3af', fontWeight: 600, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{p.label}</p>
            <p style={{ fontSize: '22px', fontWeight: 700, color: p.color, margin: 0 }}>{p.value}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* Patterns detected */}
        <div style={card}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', margin: '0 0 16px' }}>Patterns détectés</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {patterns.length > 0 ? patterns.map((p: string, i: number) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: '#f9fafb', borderRadius: '10px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="14" height="14" fill="none" stroke="#2563eb" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                </div>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>{p}</span>
                <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#10b981', fontWeight: 700, background: '#f0fdf4', padding: '2px 8px', borderRadius: '20px' }}>Confirmé</span>
              </div>
            )) : (
              <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0 }}>Aucun pattern renseigné pour ce signal.</p>
            )}
          </div>
        </div>

        {/* Risk Management */}
        <div style={card}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', margin: '0 0 16px' }}>Gestion du Risque</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#fef2f2', borderRadius: '10px' }}>
              <div>
                <p style={{ fontSize: '12px', color: '#9ca3af', fontWeight: 600, margin: '0 0 2px' }}>Risque (par unité)</p>
                <p style={{ fontSize: '18px', fontWeight: 700, color: '#ef4444', margin: 0 }}>-${risk}</p>
              </div>
              <svg width="20" height="20" fill="none" stroke="#ef4444" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#f0fdf4', borderRadius: '10px' }}>
              <div>
                <p style={{ fontSize: '12px', color: '#9ca3af', fontWeight: 600, margin: '0 0 2px' }}>Gain potentiel (par unité)</p>
                <p style={{ fontSize: '18px', fontWeight: 700, color: '#10b981', margin: 0 }}>+${gain}</p>
              </div>
              <svg width="20" height="20" fill="none" stroke="#10b981" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
            </div>
            <div style={{ padding: '12px 16px', background: '#eff6ff', borderRadius: '10px' }}>
              <p style={{ fontSize: '12px', color: '#9ca3af', fontWeight: 600, margin: '0 0 2px' }}>Ratio Risque/Rendement</p>
              <p style={{ fontSize: '22px', fontWeight: 700, color: '#2563eb', margin: 0 }}>{rr}</p>
            </div>
            <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0, padding: '0 4px' }}>
              ⚠️ Ne risquez jamais plus de 1-2% de votre capital sur un seul trade.
            </p>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <button style={{ flex: 1, padding: '14px', borderRadius: '12px', border: 'none', background: '#2563eb', color: 'white', fontSize: '15px', fontWeight: 700, cursor: 'pointer' }}>
          📋 Copier les paramètres
        </button>
        <button onClick={() => router.push('/simulator')} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid #e5e7eb', background: 'white', color: '#374151', fontSize: '15px', fontWeight: 700, cursor: 'pointer' }}>
          🔬 Tester dans le simulateur
        </button>
      </div>
    </AppLayout>
  );
};

export default SignalDetailPage;
