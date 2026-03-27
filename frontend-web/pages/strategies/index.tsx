import React, { useState } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import AppLayout from '../../components/layout/AppLayout';

const card: React.CSSProperties = {
  backgroundColor: 'white',
  borderRadius: '16px',
  padding: '24px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
};

const STRATEGIES = [
  { id: 1, name: 'BTC Trend Following', desc: 'Stratégie basée sur le suivi de tendance avec EMA 20/50 et confirmation RSI.', status: 'active', winRate: 73.5, trades: 156, profitFactor: 2.8, asset: 'BTC/USDT', timeframe: '4H', created: '2024-11-15' },
  { id: 2, name: 'ETH Scalping 15M', desc: 'Scalping rapide sur ETH avec Bollinger Bands et volume profile.', status: 'active', winRate: 68.2, trades: 312, profitFactor: 1.9, asset: 'ETH/USDT', timeframe: '15M', created: '2024-12-01' },
  { id: 3, name: 'Multi-Asset Mean Reversion', desc: 'Retour à la moyenne sur un panier de cryptos avec indicateurs de momentum.', status: 'inactive', winRate: 61.4, trades: 88, profitFactor: 1.5, asset: 'Multi', timeframe: '1H', created: '2025-01-10' },
];

const StrategiesPage: NextPage = () => {
  const router = useRouter();
  const [filter, setFilter] = useState('Tous');

  const filtered = filter === 'Tous' ? STRATEGIES : STRATEGIES.filter((s) => s.status === (filter === 'Actives' ? 'active' : 'inactive'));

  return (
    <AppLayout title="Mes Stratégies" subtitle="Gérez et analysez vos stratégies de trading personnalisées">
      <Head><title>Stratégies — TradingAI</title></Head>

      {/* Header actions */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '24px', marginTop: '-8px' }}>
        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: '4px', background: 'white', borderRadius: '12px', padding: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}>
          {['Tous', 'Actives', 'Inactives'].map((f) => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '6px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              fontSize: '13px', fontWeight: filter === f ? 700 : 500,
              background: filter === f ? '#2563eb' : 'transparent',
              color: filter === f ? 'white' : '#6b7280',
            }}>{f}</button>
          ))}
        </div>

        <button onClick={() => router.push('/strategies/new')} style={{
          marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px',
          padding: '10px 18px', borderRadius: '12px', border: 'none',
          background: '#2563eb', color: 'white', fontSize: '14px', fontWeight: 700, cursor: 'pointer',
        }}>
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
          Importer une stratégie
        </button>
      </div>

      {/* Summary row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
        {[
          { label: 'Stratégies actives', value: '2', color: '#10b981', bg: '#f0fdf4' },
          { label: 'Win rate moyen', value: '71.0%', color: '#2563eb', bg: '#eff6ff' },
          { label: 'Total trades', value: '556', color: '#111827', bg: '#f9fafb' },
        ].map((s, i) => (
          <div key={i} style={{ ...card, background: s.bg, padding: '16px 20px' }}>
            <p style={{ fontSize: '12px', color: '#9ca3af', fontWeight: 600, margin: '0 0 4px' }}>{s.label}</p>
            <p style={{ fontSize: '24px', fontWeight: 700, color: s.color, margin: 0 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Strategies list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filtered.map((s) => (
          <div key={s.id} style={card}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
              {/* Icon */}
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: s.status === 'active' ? '#f0fdf4' : '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="22" height="22" fill="none" stroke={s.status === 'active' ? '#10b981' : '#9ca3af'} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              </div>

              {/* Main info */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#111827', margin: 0 }}>{s.name}</h3>
                  <span style={{
                    fontSize: '11px', fontWeight: 700, padding: '2px 10px', borderRadius: '20px',
                    background: s.status === 'active' ? '#f0fdf4' : '#f9fafb',
                    color: s.status === 'active' ? '#10b981' : '#9ca3af',
                    border: `1px solid ${s.status === 'active' ? '#bbf7d0' : '#e5e7eb'}`,
                  }}>
                    {s.status === 'active' ? '● Actif' : '○ Inactif'}
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 14px', lineHeight: '1.5' }}>{s.desc}</p>

                {/* Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                  {[
                    { label: 'Win Rate', value: `${s.winRate}%`, color: s.winRate >= 70 ? '#10b981' : '#f97316' },
                    { label: 'Total Trades', value: s.trades.toString(), color: '#111827' },
                    { label: 'Profit Factor', value: s.profitFactor.toString(), color: '#2563eb' },
                    { label: 'Créé le', value: s.created, color: '#6b7280' },
                  ].map((m, i) => (
                    <div key={i} style={{ background: '#f9fafb', borderRadius: '10px', padding: '10px 14px' }}>
                      <p style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 600, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{m.label}</p>
                      <p style={{ fontSize: '15px', fontWeight: 700, color: m.color, margin: 0 }}>{m.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
                <button onClick={() => router.push('/simulator')} style={{ padding: '8px 16px', borderRadius: '10px', border: 'none', background: '#2563eb', color: 'white', fontSize: '13px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  📊 Analyser
                </button>
                <button style={{ padding: '8px 16px', borderRadius: '10px', border: '1px solid #e5e7eb', background: 'white', color: '#374151', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                  <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  Modifier
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty state if none */}
      {filtered.length === 0 && (
        <div style={{ ...card, textAlign: 'center', padding: '60px 24px' }}>
          <span style={{ fontSize: '40px', display: 'block', marginBottom: '12px' }}>📋</span>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#374151', margin: '0 0 8px' }}>Aucune stratégie {filter.toLowerCase()}</h3>
          <p style={{ fontSize: '13px', color: '#9ca3af', margin: '0 0 20px' }}>Importez votre première stratégie pour commencer l'analyse.</p>
          <button onClick={() => router.push('/strategies/new')} style={{ padding: '10px 24px', borderRadius: '12px', border: 'none', background: '#2563eb', color: 'white', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
            + Importer une stratégie
          </button>
        </div>
      )}
    </AppLayout>
  );
};

export default StrategiesPage;
