import React, { useState, useEffect } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import AppLayout from '../../components/layout/AppLayout';
import { signalsApi, Signal, SignalStats } from '../../api';

const card: React.CSSProperties = {
  backgroundColor: 'white',
  borderRadius: '16px',
  padding: '24px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
};

const Dashboard: NextPage = () => {
  const router = useRouter();
  const [stats, setStats] = useState<SignalStats | null>(null);
  const [recentSignals, setRecentSignals] = useState<Signal[]>([]);

  useEffect(() => {
    signalsApi.getStatistics().then(({ data }) => setStats(data)).catch(() => {});
    signalsApi.getRecent().then(({ data }) => setRecentSignals(data)).catch(() => {});
  }, []);

  // Simple SVG area chart for "Évolution du compte"
  const months = ['Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
  const values = [13500, 14200, 13800, 15100, 16400, 17500];
  const min = 13000;
  const max = 18500;
  const W = 500, H = 120;
  const toY = (v: number) => H - ((v - min) / (max - min)) * H;
  const areaPath = `M0,${toY(values[0])} ` + values.map((v, i) => `L${(i / (values.length - 1)) * W},${toY(v)}`).join(' ') + ` L${W},${H} L0,${H} Z`;
  const linePath = `M0,${toY(values[0])} ` + values.map((v, i) => `L${(i / (values.length - 1)) * W},${toY(v)}`).join(' ');

  return (
    <AppLayout
      title="Dashboard"
      subtitle="Bienvenue, voici un aperçu de votre activité de trading"
    >
      <Head><title>Dashboard — Alvio</title></Head>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {/* Capital Total */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <p style={{ fontSize: '13px', color: '#6b7280', fontWeight: 500, margin: 0 }}>Capital Total</p>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" fill="none" stroke="#2563eb" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
          </div>
          <p style={{ fontSize: '36px', fontWeight: 700, color: '#111827', margin: '0 0 6px' }}>$17 500</p>
          <p style={{ fontSize: '13px', color: '#10b981', fontWeight: 600, margin: 0 }}>+75% depuis le début</p>
        </div>

        {/* Win Rate */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <p style={{ fontSize: '13px', color: '#6b7280', fontWeight: 500, margin: 0 }}>Win Rate</p>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" fill="none" stroke="#10b981" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
          </div>
          <p style={{ fontSize: '36px', fontWeight: 700, color: '#111827', margin: '0 0 6px' }}>73.5%</p>
          <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>Sur les 30 derniers jours</p>
        </div>

        {/* Signaux Actifs */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <p style={{ fontSize: '13px', color: '#6b7280', fontWeight: 500, margin: 0 }}>Signaux Actifs</p>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" fill="none" stroke="#2563eb" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
          </div>
          <p style={{ fontSize: '36px', fontWeight: 700, color: '#111827', margin: '0 0 6px' }}>{stats?.totalSignals ?? 12}</p>
          <p style={{ fontSize: '13px', color: '#2563eb', fontWeight: 600, margin: 0, cursor: 'pointer' }} onClick={() => router.push('/signals')}>{stats ? `${stats.buySignals} achat · ${stats.sellSignals} vente` : '3 nouveaux aujourd\'hui'}</p>
        </div>

        {/* Performance */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <p style={{ fontSize: '13px', color: '#6b7280', fontWeight: 500, margin: 0 }}>Performance</p>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" fill="none" stroke="#10b981" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
            </div>
          </div>
          <p style={{ fontSize: '36px', fontWeight: 700, color: '#10b981', margin: '0 0 6px' }}>+34.2%</p>
          <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>Ce mois-ci</p>
        </div>
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '16px', marginBottom: '24px' }}>
        {/* Area chart */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#111827', margin: 0 }}>Évolution du compte</h2>
              <p style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0 0' }}>6 derniers mois</p>
            </div>
            <span style={{ fontSize: '20px', fontWeight: 700, color: '#10b981' }}>$17 500</span>
          </div>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: '140px' }} preserveAspectRatio="none">
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563eb" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={areaPath} fill="url(#areaGrad)" />
            <path d={linePath} fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            {values.map((v, i) => (
              <circle key={i} cx={(i / (values.length - 1)) * W} cy={toY(v)} r="4" fill="white" stroke="#2563eb" strokeWidth="2" />
            ))}
          </svg>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
            {months.map((m, i) => (
              <span key={i} style={{ fontSize: '11px', color: '#9ca3af' }}>{m}</span>
            ))}
          </div>
        </div>

        {/* Top Signaux */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#111827', margin: 0 }}>Top Signaux du jour</h2>
            <button onClick={() => router.push('/signals')} style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
              Voir tout →
            </button>
          </div>
          {(recentSignals.length > 0
            ? recentSignals.slice(0, 4).map((s) => ({ asset: s.asset, dir: s.direction, conf: s.confidence, pattern: (s.patterns ? (JSON.parse(s.patterns) as string[])[0] : null) || '—' }))
            : [
                { asset: 'BTC/USDT', dir: 'BUY', conf: 92, pattern: 'Bullish Engulfing' },
                { asset: 'SOL/USDT', dir: 'BUY', conf: 85, pattern: 'Double Bottom' },
                { asset: 'BNB/USDT', dir: 'BUY', conf: 81, pattern: 'Breakout' },
                { asset: 'XRP/USDT', dir: 'BUY', conf: 83, pattern: 'Ascending Triangle' },
              ]
          ).map((s, i) => (
            <div key={i} onClick={() => router.push('/signals')} style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '10px 0', borderBottom: i < 3 ? '1px solid #f3f4f6' : 'none', cursor: 'pointer',
            }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="16" height="16" fill="none" stroke="#10b981" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '13px', fontWeight: 700, color: '#111827', margin: 0 }}>{s.asset}</p>
                <p style={{ fontSize: '11px', color: '#9ca3af', margin: 0 }}>{s.pattern}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ background: '#2563eb', color: 'white', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '6px' }}>{s.dir}</span>
                <p style={{ fontSize: '12px', fontWeight: 700, color: '#111827', margin: '2px 0 0', textAlign: 'center' }}>{s.conf}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3 Action Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        <button onClick={() => router.push('/signals')} style={{
          background: '#eff6ff', border: 'none', borderRadius: '16px', padding: '24px',
          cursor: 'pointer', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '8px',
        }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="20" height="20" fill="none" stroke="white" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
          </div>
          <p style={{ fontSize: '15px', fontWeight: 700, color: '#1e40af', margin: 0 }}>Voir les signaux</p>
          <p style={{ fontSize: '13px', color: '#3b82f6', margin: 0 }}>{stats?.totalSignals ?? 12} signaux actifs</p>
        </button>

        <button onClick={() => router.push('/simulator')} style={{
          background: '#f0fdf4', border: 'none', borderRadius: '16px', padding: '24px',
          cursor: 'pointer', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '8px',
        }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="20" height="20" fill="none" stroke="white" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12h3l3-9 4 18 3-9 3 0" /></svg>
          </div>
          <p style={{ fontSize: '15px', fontWeight: 700, color: '#065f46', margin: 0 }}>Simulateur</p>
          <p style={{ fontSize: '13px', color: '#10b981', margin: 0 }}>Tester une stratégie</p>
        </button>

        <button onClick={() => router.push('/formation')} style={{
          background: '#fff7ed', border: 'none', borderRadius: '16px', padding: '24px',
          cursor: 'pointer', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '8px',
        }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#f97316', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="20" height="20" fill="none" stroke="white" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /></svg>
          </div>
          <p style={{ fontSize: '15px', fontWeight: 700, color: '#9a3412', margin: 0 }}>Formation</p>
          <p style={{ fontSize: '13px', color: '#f97316', margin: 0 }}>Continuer à apprendre</p>
        </button>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
