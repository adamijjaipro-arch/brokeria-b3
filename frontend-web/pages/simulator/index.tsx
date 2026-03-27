import React, { useState } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import AppLayout from '../../components/layout/AppLayout';
import { simulatorApi, DCAResult } from '../../api';

const card: React.CSSProperties = {
  backgroundColor: 'white',
  borderRadius: '16px',
  padding: '24px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
};

const MONTHS_LABELS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

const W = 600, H = 160;

function buildPath(data: number[], minV: number, maxV: number) {
  if (data.length < 2) return '';
  const toY = (v: number) => H - ((v - minV) / (maxV - minV || 1)) * H;
  return `M0,${toY(data[0])} ` + data.map((v, i) => `L${(i / (data.length - 1)) * W},${toY(v)}`).join(' ');
}

function buildArea(data: number[], minV: number, maxV: number) {
  return buildPath(data, minV, maxV) + ` L${W},${H} L0,${H} Z`;
}

const TRADES_MOCK = [
  { date: '2024-12-15', asset: 'BTC/USDT', type: 'BUY',  entry: '$67 000', exit: '$69 000', pnl: '+$2 000', pnlPct: '+2.99%', win: true },
  { date: '2024-12-14', asset: 'ETH/USDT', type: 'SELL', entry: '$3 600',  exit: '$3 500',  pnl: '+$100',  pnlPct: '+2.78%', win: true },
  { date: '2024-12-13', asset: 'SOL/USDT', type: 'BUY',  entry: '$135',    exit: '$132',    pnl: '-$300',  pnlPct: '-2.22%', win: false },
  { date: '2024-12-12', asset: 'BNB/USDT', type: 'BUY',  entry: '$410',    exit: '$420',    pnl: '+$1 000',pnlPct: '+2.44%', win: true },
  { date: '2024-12-11', asset: 'ADA/USDT', type: 'SELL', entry: '$0,6',    exit: '$0,58',   pnl: '+$200',  pnlPct: '+3.33%', win: true },
];

const SimulatorPage: NextPage = () => {
  const [capital, setCapital] = useState('10000');
  const [monthlyInv, setMonthlyInv] = useState('0');
  const [asset, setAsset] = useState('BTC/USDT');
  const [period, setPeriod] = useState(1);
  const [annualReturn, setAnnualReturn] = useState(0.35);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<DCAResult | null>(null);
  const [error, setError] = useState('');

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb',
    borderRadius: '10px', fontSize: '14px', color: '#111827',
    background: '#f9fafb', outline: 'none', boxSizing: 'border-box',
  };

  const handleRun = async () => {
    setRunning(true);
    setError('');
    try {
      const { data } = await simulatorApi.runDCA({
        initialAmount: parseFloat(capital) || 10000,
        monthlyInvestment: parseFloat(monthlyInv) || 0,
        months: period * 12,
        annualReturn,
        volatility: 0.35,
      });
      setResult(data);
    } catch {
      setError('Impossible de contacter le serveur. Affichage des résultats demo.');
      // Show demo result
      setResult({
        totalInvested: parseFloat(capital) || 10000,
        finalBalance: (parseFloat(capital) || 10000) * (1 + annualReturn * period),
        totalGains: (parseFloat(capital) || 10000) * annualReturn * period,
        roi: annualReturn * period * 100,
        monthlyData: Array.from({ length: period * 12 }, (_, i) => ({
          month: i + 1,
          balance: (parseFloat(capital) || 10000) * (1 + (annualReturn / 12) * (i + 1)),
          invested: (parseFloat(capital) || 10000) + (parseFloat(monthlyInv) || 0) * (i + 1),
        })),
      });
    } finally {
      setRunning(false);
    }
  };

  const handleReset = () => {
    setCapital('10000');
    setMonthlyInv('0');
    setAsset('BTC/USDT');
    setPeriod(1);
    setAnnualReturn(0.35);
    setResult(null);
    setError('');
  };

  // Chart data from result
  const equityData = result?.monthlyData.map((d) => d.balance) ?? [];
  const investedData = result?.monthlyData.map((d) => d.invested) ?? [];
  const allValues = [...equityData, ...investedData];
  const minV = allValues.length > 0 ? Math.min(...allValues) * 0.95 : 0;
  const maxV = allValues.length > 0 ? Math.max(...allValues) * 1.05 : 1;
  const chartLabels = result
    ? result.monthlyData.filter((_, i) => i % Math.ceil(result.monthlyData.length / 12) === 0).map((d) => MONTHS_LABELS[(d.month - 1) % 12])
    : MONTHS_LABELS;

  const fmt = (n: number) => '$' + Math.round(n).toLocaleString('fr-FR');
  const pct = (n: number) => (n >= 0 ? '+' : '') + n.toFixed(1) + '%';

  return (
    <AppLayout title="Simulateur de Trading" subtitle="Testez vos stratégies sans risque avec des données historiques">
      <Head><title>Simulateur — TradingAI</title></Head>

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '20px', alignItems: 'start' }}>
        {/* Left: Params */}
        <div style={card}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', margin: '0 0 20px' }}>Paramètres</h2>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: '6px' }}>Capital Initial ($)</label>
            <input type="number" value={capital} onChange={(e) => setCapital(e.target.value)} style={inputStyle} min="0" />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: '6px' }}>Investissement mensuel ($)</label>
            <input type="number" value={monthlyInv} onChange={(e) => setMonthlyInv(e.target.value)} style={inputStyle} min="0" />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: '6px' }}>Actif</label>
            <select value={asset} onChange={(e) => setAsset(e.target.value)} style={inputStyle}>
              {['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT', 'XRP/USDT'].map((a) => <option key={a}>{a}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: '6px' }}>
              Période — <strong>{period} an{period > 1 ? 's' : ''}</strong>
            </label>
            <input type="range" min={1} max={5} step={1} value={period}
              onChange={(e) => setPeriod(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#2563eb' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
              <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span>
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: '6px' }}>
              Rendement annuel estimé — <strong>{Math.round(annualReturn * 100)}%</strong>
            </label>
            <input type="range" min={5} max={100} step={5} value={Math.round(annualReturn * 100)}
              onChange={(e) => setAnnualReturn(Number(e.target.value) / 100)}
              style={{ width: '100%', accentColor: '#2563eb' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
              <span>5%</span><span>100%</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={handleRun} disabled={running} style={{
              flex: 1, padding: '12px', borderRadius: '12px', border: 'none',
              background: running ? '#93c5fd' : '#2563eb', color: 'white', fontSize: '14px', fontWeight: 700,
              cursor: running ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            }}>
              {running ? (
                <>
                  <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', animation: 'spin 0.7s linear infinite' }} />
                  Calcul...
                </>
              ) : (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21" /></svg>
                  Lancer
                </>
              )}
            </button>
            <button onClick={handleReset}
              style={{ padding: '12px 14px', borderRadius: '12px', border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer' }}>
              <svg width="16" height="16" fill="none" stroke="#6b7280" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            </button>
          </div>

          {error && (
            <div style={{ marginTop: '12px', background: '#fffbeb', borderRadius: '10px', padding: '10px 12px', border: '1px solid #fde68a' }}>
              <p style={{ fontSize: '12px', color: '#92400e', margin: 0 }}>{error}</p>
            </div>
          )}
        </div>

        {/* Right: Results */}
        {result && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* KPI 2x2 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              {[
                { label: 'Capital Final', value: fmt(result.finalBalance), sub: pct(result.roi), vColor: '#10b981', subColor: '#10b981', bg: '#f0fdf4', iconColor: '#10b981', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /> },
                { label: 'Total Investi', value: fmt(result.totalInvested), sub: `${period} an${period > 1 ? 's' : ''}`, vColor: '#2563eb', subColor: '#6b7280', bg: '#eff6ff', iconColor: '#2563eb', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /> },
                { label: 'Gains Totaux', value: fmt(result.totalGains), sub: 'profit net', vColor: result.totalGains >= 0 ? '#10b981' : '#ef4444', subColor: '#6b7280', bg: '#f9fafb', iconColor: '#6b7280', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12h3l3-9 4 18 3-9 3 0" /> },
                { label: 'ROI', value: pct(result.roi), sub: 'retour sur investissement', vColor: result.roi >= 0 ? '#10b981' : '#ef4444', subColor: '#6b7280', bg: result.roi >= 0 ? '#f0fdf4' : '#fef2f2', iconColor: result.roi >= 0 ? '#10b981' : '#ef4444', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /> },
              ].map((k, i) => (
                <div key={i} style={card}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <p style={{ fontSize: '12px', color: '#6b7280', fontWeight: 600, margin: 0 }}>{k.label}</p>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="16" height="16" fill="none" stroke={k.iconColor} viewBox="0 0 24 24">{k.icon}</svg>
                    </div>
                  </div>
                  <p style={{ fontSize: '28px', fontWeight: 700, color: k.vColor, margin: '0 0 4px' }}>{k.value}</p>
                  <p style={{ fontSize: '13px', color: k.subColor, fontWeight: 600, margin: 0 }}>{k.sub}</p>
                </div>
              ))}
            </div>

            {/* Equity Chart */}
            <div style={card}>
              <div style={{ marginBottom: '16px' }}>
                <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', margin: 0 }}>Courbe d'Équité</h2>
                <p style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0 0' }}>Évolution du capital sur la période</p>
              </div>
              <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: '170px' }} preserveAspectRatio="none">
                <defs>
                  <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d={buildArea(investedData, minV, maxV)} fill="rgba(156,163,175,0.1)" />
                <path d={buildPath(investedData, minV, maxV)} fill="none" stroke="#9ca3af" strokeWidth="2" strokeDasharray="6,4" />
                <path d={buildArea(equityData, minV, maxV)} fill="url(#eqGrad)" />
                <path d={buildPath(equityData, minV, maxV)} fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                {chartLabels.slice(0, 12).map((m, i) => <span key={i} style={{ fontSize: '11px', color: '#9ca3af' }}>{m}</span>)}
              </div>
              <div style={{ display: 'flex', gap: '20px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #f3f4f6' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '20px', height: '3px', background: '#2563eb', borderRadius: '2px' }} />
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>Capital cumulé</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <svg width="20" height="3" viewBox="0 0 20 3"><line x1="0" y1="1.5" x2="20" y2="1.5" stroke="#9ca3af" strokeWidth="2" strokeDasharray="4,3" /></svg>
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>Montant investi</span>
                </div>
              </div>
            </div>

            {/* Trades table (static demo) */}
            <div style={card}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', margin: 0 }}>Historique des Trades (démo)</h2>
                <button style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', border: '1px solid #e5e7eb', borderRadius: '8px', background: 'white', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>
                  <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  Exporter CSV
                </button>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                    {['Date', 'Actif', 'Type', 'Entrée', 'Sortie', 'P&L', 'P&L %', 'Résultat'].map((h) => (
                      <th key={h} style={{ textAlign: 'left', padding: '0 12px 10px 0', fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {TRADES_MOCK.map((t, i) => (
                    <tr key={i} style={{ borderBottom: i < TRADES_MOCK.length - 1 ? '1px solid #f9fafb' : 'none' }}>
                      <td style={{ padding: '12px 12px 12px 0', color: '#6b7280' }}>{t.date}</td>
                      <td style={{ padding: '12px 12px 12px 0', fontWeight: 600, color: '#111827' }}>{t.asset}</td>
                      <td style={{ padding: '12px 12px 12px 0' }}>
                        <span style={{ background: t.type === 'BUY' ? '#f0fdf4' : '#fef2f2', color: t.type === 'BUY' ? '#10b981' : '#ef4444', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '6px' }}>{t.type}</span>
                      </td>
                      <td style={{ padding: '12px 12px 12px 0', color: '#374151' }}>{t.entry}</td>
                      <td style={{ padding: '12px 12px 12px 0', color: '#374151' }}>{t.exit}</td>
                      <td style={{ padding: '12px 12px 12px 0', fontWeight: 700, color: t.win ? '#10b981' : '#ef4444' }}>{t.pnl}</td>
                      <td style={{ padding: '12px 12px 12px 0', fontWeight: 700, color: t.win ? '#10b981' : '#ef4444' }}>{t.pnlPct}</td>
                      <td style={{ padding: '12px 0' }}>
                        <span style={{ background: t.win ? '#f0fdf4' : '#fef2f2', color: t.win ? '#10b981' : '#ef4444', fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px' }}>
                          {t.win ? 'WIN' : 'LOSS'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </AppLayout>
  );
};

export default SimulatorPage;
