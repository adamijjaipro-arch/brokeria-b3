import React, { useState } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import AppLayout from '../../components/layout/AppLayout';

const card: React.CSSProperties = {
  backgroundColor: 'white',
  borderRadius: '16px',
  padding: '24px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
};

const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

const MONTHLY_DATA = [
  { month: 'Jan', signals: 42, winRate: 71, pnl: '+$1 240' },
  { month: 'Fév', signals: 38, winRate: 73, pnl: '+$1 890' },
  { month: 'Mar', signals: 51, winRate: 68, pnl: '+$980' },
  { month: 'Avr', signals: 45, winRate: 76, pnl: '+$2 340' },
  { month: 'Mai', signals: 60, winRate: 74, pnl: '+$3 100' },
  { month: 'Jun', signals: 55, winRate: 72, pnl: '+$2 650' },
];

const ReportsPage: NextPage = () => {
  const [selectedMonth, setSelectedMonth] = useState(1); // Février
  const [selectedYear, setSelectedYear] = useState(2025);

  const maxSignals = Math.max(...MONTHLY_DATA.map((d) => d.signals));

  return (
    <AppLayout title="Rapports de Performance" subtitle="Analysez vos résultats mois par mois">
      <Head><title>Rapports — Alvio</title></Head>

      {/* Filter row */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '24px', marginTop: '-8px' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <label style={{ fontSize: '13px', fontWeight: 600, color: '#6b7280' }}>Mois</label>
          <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))}
            style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '10px', fontSize: '13px', background: 'white', outline: 'none', color: '#111827', cursor: 'pointer' }}>
            {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <label style={{ fontSize: '13px', fontWeight: 600, color: '#6b7280' }}>Année</label>
          <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}
            style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '10px', fontSize: '13px', background: 'white', outline: 'none', color: '#111827', cursor: 'pointer' }}>
            {[2025, 2024, 2023].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <button style={{ padding: '8px 16px', borderRadius: '10px', border: 'none', background: '#2563eb', color: 'white', fontSize: '13px', fontWeight: 600, cursor: 'pointer', marginLeft: '4px' }}>
          Générer le rapport
        </button>
        <button style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '10px', border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#6b7280' }}>
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          Exporter PDF
        </button>
      </div>

      {/* KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {[
          { label: 'Total Signaux', value: '38', sub: MONTHS[selectedMonth] + ' ' + selectedYear, icon: '📡', bg: '#eff6ff', color: '#2563eb' },
          { label: 'Win Rate', value: '73.5%', sub: '+2.1% vs mois précédent', icon: '🎯', bg: '#f0fdf4', color: '#10b981' },
          { label: 'Confiance Moy.', value: '84.2%', sub: 'Score IA moyen', icon: '🤖', bg: '#faf5ff', color: '#7c3aed' },
          { label: 'P&L Estimé', value: '+$1 890', sub: 'Performance du mois', icon: '💰', bg: '#fff7ed', color: '#f97316' },
        ].map((k, i) => (
          <div key={i} style={{ ...card, background: k.bg }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <p style={{ fontSize: '12px', color: '#6b7280', fontWeight: 600, margin: 0 }}>{k.label}</p>
              <span style={{ fontSize: '20px' }}>{k.icon}</span>
            </div>
            <p style={{ fontSize: '28px', fontWeight: 700, color: k.color, margin: '0 0 4px' }}>{k.value}</p>
            <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Detailed metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div style={card}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', margin: '0 0 16px' }}>Répartition des signaux</h2>
          {[
            { label: 'Signaux BUY', value: '28', pct: 74, color: '#10b981' },
            { label: 'Signaux SELL', value: '7', pct: 18, color: '#ef4444' },
            { label: 'Signaux HOLD', value: '3', pct: 8, color: '#f97316' },
          ].map((s, i) => (
            <div key={i} style={{ marginBottom: i < 2 ? '14px' : 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>{s.label}</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: s.color }}>{s.value} <span style={{ color: '#9ca3af', fontWeight: 400 }}>({s.pct}%)</span></span>
              </div>
              <div style={{ height: '8px', background: '#f3f4f6', borderRadius: '99px', overflow: 'hidden' }}>
                <div style={{ width: `${s.pct}%`, height: '100%', background: s.color, borderRadius: '99px' }} />
              </div>
            </div>
          ))}

          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #f3f4f6' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
              {[
                { label: 'Confiance > 80%', value: '22 signaux', color: '#10b981' },
                { label: 'Confiance > 90%', value: '8 signaux', color: '#2563eb' },
              ].map((s, i) => (
                <div key={i} style={{ background: '#f9fafb', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                  <p style={{ fontSize: '18px', fontWeight: 700, color: s.color, margin: '0 0 4px' }}>{s.value}</p>
                  <p style={{ fontSize: '11px', color: '#9ca3af', margin: 0 }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={card}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', margin: '0 0 16px' }}>Performance sur 6 mois</h2>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '140px', padding: '0 4px' }}>
            {MONTHLY_DATA.map((d, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', height: '100%', justifyContent: 'flex-end' }}>
                <span style={{ fontSize: '10px', color: '#10b981', fontWeight: 700 }}>{d.winRate}%</span>
                <div style={{
                  width: '100%', borderRadius: '6px 6px 0 0',
                  height: `${(d.signals / maxSignals) * 110}px`,
                  background: i === 1 ? '#2563eb' : '#bfdbfe',
                  transition: 'height 0.5s',
                }} />
                <span style={{ fontSize: '10px', color: '#9ca3af' }}>{d.month}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #f3f4f6' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {MONTHLY_DATA.map((d, i) => (
                <div key={i} style={{ textAlign: 'center', padding: '8px', background: i === 1 ? '#eff6ff' : 'transparent', borderRadius: '8px' }}>
                  <p style={{ fontSize: '12px', fontWeight: 700, color: '#10b981', margin: '0 0 2px' }}>{d.pnl}</p>
                  <p style={{ fontSize: '10px', color: '#9ca3af', margin: 0 }}>{d.month}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Summary text */}
      <div style={{ ...card, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
        <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '24px', flexShrink: 0 }}>📊</span>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#065f46', margin: '0 0 6px' }}>Résumé IA — {MONTHS[selectedMonth]} {selectedYear}</h3>
            <p style={{ fontSize: '14px', color: '#047857', margin: 0, lineHeight: '1.6' }}>
              Excellent mois de performance. Le taux de réussite de <strong>73.5%</strong> est supérieur à la moyenne sur 30 jours.
              Les signaux BUY ont dominé avec une confiance élevée. Les patterns <em>Double Bottom</em> et <em>Bullish Engulfing</em> ont été les plus rentables.
              Continuez à privilégier les timeframes 4H et 1D pour maximiser la précision des signaux.
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default ReportsPage;
