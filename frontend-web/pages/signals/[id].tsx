import React from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import AppLayout from '../../components/layout/AppLayout';
import PageSEO from '../../components/seo/PageSEO';

const card: React.CSSProperties = {
  backgroundColor: 'white',
  borderRadius: '16px',
  padding: '24px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
};

// Mock signals data keyed by id
const MOCK: Record<string, any> = {
  '1': { asset: 'BTC/USDT', direction: 'BUY', timeframe: '4H', confidence: 92, entry: 67234.5, target: 69000, stopLoss: 66000, pattern: 'Bullish Engulfing', patterns: ['Bullish Engulfing', 'Golden Cross', 'Volume Surge'], date: '17 Fév 2025 — 10:30', rr: '1:2.5' },
  '2': { asset: 'SOL/USDT', direction: 'BUY', timeframe: '15M', confidence: 85, entry: 134.2, target: 138, stopLoss: 132, pattern: 'Double Bottom', patterns: ['Double Bottom', 'RSI Oversold'], date: '17 Fév 2025 — 09:15', rr: '1:1.9' },
  '3': { asset: 'BNB/USDT', direction: 'BUY', timeframe: '1D', confidence: 81, entry: 412.3, target: 425, stopLoss: 405, pattern: 'Breakout', patterns: ['Breakout', 'MACD Cross'], date: '17 Fév 2025 — 08:00', rr: '1:1.7' },
  '4': { asset: 'XRP/USDT', direction: 'BUY', timeframe: '2H', confidence: 83, entry: 0.63, target: 0.68, stopLoss: 0.61, pattern: 'Ascending Triangle', patterns: ['Ascending Triangle', 'Volume Breakout', 'EMA Cross'], date: '17 Fév 2025 — 07:45', rr: '1:2.1' },
};

const SignalDetailPage: NextPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const signal = MOCK[id as string] || MOCK['1'];

  const isBuy = signal.direction === 'BUY';
  const risk = Math.abs(signal.entry - signal.stopLoss).toFixed(2);
  const gain = Math.abs(signal.target - signal.entry).toFixed(2);

  const fmt = (v: number) => v < 1 ? `$${v}` : `$${v.toLocaleString('fr-FR')}`;

  return (
    <AppLayout>
      <PageSEO
        title={`${signal.asset} — Signal ${signal.direction} — Alvio`}
        description={`Signal ${signal.direction} sur ${signal.asset} — Confiance ${signal.confidence}%. Pattern: ${signal.pattern}. Analyse IA Alvio.`}
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
        <span style={{ background: '#f3f4f6', color: '#6b7280', fontSize: '12px', fontWeight: 600, padding: '4px 10px', borderRadius: '8px', fontFamily: 'monospace', border: '1px solid #e5e7eb' }}>{signal.timeframe}</span>
        <span style={{ fontSize: '12px', color: '#9ca3af', marginLeft: 'auto' }}>{signal.date}</span>
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
        <p style={{ fontSize: '12px', color: '#9ca3af', margin: '8px 0 0' }}>Pattern principal : <strong style={{ color: '#374151' }}>{signal.pattern}</strong></p>
      </div>

      {/* Price grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        {[
          { label: "Prix d'entrée", value: fmt(signal.entry), color: '#111827', bg: '#f9fafb' },
          { label: 'Objectif (TP)', value: fmt(signal.target), color: '#10b981', bg: '#f0fdf4' },
          { label: 'Stop Loss (SL)', value: fmt(signal.stopLoss), color: '#ef4444', bg: '#fef2f2' },
          { label: 'Risk/Reward', value: signal.rr, color: '#2563eb', bg: '#eff6ff' },
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
            {signal.patterns.map((p: string, i: number) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: '#f9fafb', borderRadius: '10px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="14" height="14" fill="none" stroke="#2563eb" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                </div>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>{p}</span>
                <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#10b981', fontWeight: 700, background: '#f0fdf4', padding: '2px 8px', borderRadius: '20px' }}>Confirmé</span>
              </div>
            ))}
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
              <p style={{ fontSize: '22px', fontWeight: 700, color: '#2563eb', margin: 0 }}>{signal.rr}</p>
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
