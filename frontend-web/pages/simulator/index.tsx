import React, { useState, useEffect, useRef } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import AppLayout from '../../components/layout/AppLayout';
import { simulatorApi, DCAResult, SimulationRecord } from '../../api';
import PageSEO from '../../components/seo/PageSEO';

// ── Constants ─────────────────────────────────────────────────────────────────

const MONTHS_LABELS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
const ASSETS = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT', 'XRP/USDT'];

const ASSET_COLORS: Record<string, { bg: string; color: string }> = {
  'BTC/USDT': { bg: 'rgba(249,115,22,0.12)',  color: '#fb923c' },
  'ETH/USDT': { bg: 'rgba(139,92,246,0.12)',  color: '#a78bfa' },
  'SOL/USDT': { bg: 'rgba(34,197,94,0.12)',   color: '#4ade80' },
  'BNB/USDT': { bg: 'rgba(245,158,11,0.12)',  color: '#fbbf24' },
  'XRP/USDT': { bg: 'rgba(14,165,233,0.12)',  color: '#38bdf8' },
};

const W = 600, H = 340;

// ── Chart helpers ─────────────────────────────────────────────────────────────

function toY(v: number, minV: number, maxV: number) {
  return H - ((v - minV) / (maxV - minV || 1)) * H;
}
function buildPath(data: number[], minV: number, maxV: number) {
  if (data.length < 2) return '';
  return `M0,${toY(data[0], minV, maxV)} ` +
    data.map((v, i) => `L${(i / (data.length - 1)) * W},${toY(v, minV, maxV)}`).join(' ');
}
function buildArea(data: number[], minV: number, maxV: number) {
  return buildPath(data, minV, maxV) + ` L${W},${H} L0,${H} Z`;
}

// ── Formatters ────────────────────────────────────────────────────────────────

const fmt     = (n: number) => '$' + Math.round(n).toLocaleString('fr-FR');
const pct     = (n: number) => (n >= 0 ? '+' : '') + n.toFixed(1) + '%';
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' });

// ── History helpers ────────────────────────────────────────────────────────────

function parseRecord(r: SimulationRecord) {
  type P = { initialAmount: number; monthlyInvestment: number; months: number; annualReturn: number; volatility: number; mode?: string };
  type R = { totalInvested: number; finalBalance: number; totalGains: number; roi: number };
  return { params: JSON.parse(r.params) as P, result: JSON.parse(r.result) as R };
}

// ── Slider track background ────────────────────────────────────────────────────

function sliderBg(value: number, min: number, max: number) {
  const p = ((value - min) / (max - min)) * 100;
  return `linear-gradient(to right, #3b82f6 ${p}%, #222222 ${p}%)`;
}

// ── Page ──────────────────────────────────────────────────────────────────────

const SimulatorPage: NextPage = () => {
  const [capital,      setCapital]      = useState('10000');
  const [monthlyInv,   setMonthlyInv]   = useState('0');
  const [asset,        setAsset]        = useState('BTC/USDT');
  const [period,       setPeriod]       = useState(1);
  const [annualReturn, setAnnualReturn] = useState(0.35);
  const [volatility,   setVolatility]   = useState(0.35);
  const [mode,         setMode]         = useState<'monte_carlo' | 'fixed'>('monte_carlo');
  const [running,      setRunning]      = useState(false);
  const [result,       setResult]       = useState<DCAResult | null>(null);
  const [error,        setError]        = useState('');
  const [history,      setHistory]      = useState<SimulationRecord[]>([]);
  const [histLoading,  setHistLoading]  = useState(true);

  interface TooltipData { x: number; monthLabel: string; balance: number; invested: number }
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const chartRef  = useRef<HTMLDivElement>(null);

  useEffect(() => {
    simulatorApi.getHistory()
      .then(({ data }) => setHistory(data))
      .catch(() => {})
      .finally(() => setHistLoading(false));
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleRun = async () => {
    setRunning(true);
    setError('');
    try {
      const { data } = await simulatorApi.runDCA({
        asset,
        initialAmount:     parseFloat(capital)    || 10_000,
        monthlyInvestment: parseFloat(monthlyInv) || 0,
        months:            period * 12,
        annualReturn,
        volatility,
        mode,
      });
      setResult(data);
      simulatorApi.getHistory().then(({ data: h }) => setHistory(h)).catch(() => {});
    } catch {
      setError('Impossible de contacter le serveur. Résultats calculés localement (mode fixe).');
      // Fallback : intérêts composés avec annuité, cohérent avec mode="fixed" côté backend
      // Logique : contribution d'abord, puis croissance (même ordre que le backend)
      const pv  = parseFloat(capital)    || 10_000;
      const pmt = parseFloat(monthlyInv) || 0;
      const r   = annualReturn / 12;
      const n   = period * 12;
      let bal = pv;
      let inv = pv;
      const fbMonthlyData: { month: number; balance: number; invested: number }[] = [];
      for (let m = 1; m <= n; m++) {
        bal  = (bal + pmt) * (1 + r);
        inv += pmt;
        fbMonthlyData.push({
          month:    m,
          balance:  Math.round(bal * 100) / 100,
          invested: Math.round(inv * 100) / 100,
        });
      }
      const fbGains = bal - inv;
      const fbRoi   = (fbGains / inv) * 100;
      setResult({
        totalInvested: Math.round(inv * 100) / 100,
        finalBalance:  Math.round(bal * 100) / 100,
        totalGains:    Math.round(fbGains * 100) / 100,
        roi:           Math.round(fbRoi * 100) / 100,
        monthlyData:   fbMonthlyData,
      });
    } finally {
      setRunning(false);
    }
  };

  const handleReset = () => {
    setCapital('10000'); setMonthlyInv('0'); setAsset('BTC/USDT');
    setPeriod(1); setAnnualReturn(0.35); setVolatility(0.35); setMode('monte_carlo');
    setResult(null); setError(''); setTooltip(null);
  };

  const handleReplay = (r: SimulationRecord) => {
    const { params: p, result: res } = parseRecord(r);
    setCapital(String(p.initialAmount));
    setMonthlyInv(String(p.monthlyInvestment));
    setAsset(r.asset);
    setPeriod(Math.round(p.months / 12));
    setAnnualReturn(p.annualReturn);
    if (p.volatility !== undefined) setVolatility(p.volatility);
    if (p.mode === 'fixed' || p.mode === 'monte_carlo') setMode(p.mode);
    setTooltip(null);
    // Restore exact curve from persisted monthlyData — no new API call
    if (r.monthlyData) {
      const md = JSON.parse(r.monthlyData) as { month: number; balance: number; invested: number }[];
      setResult({ ...res, monthlyData: md });
    } else {
      setResult(null); // old record without monthlyData — form is restored for manual re-run
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Chart derived values ───────────────────────────────────────────────────

  const equityData   = result?.monthlyData.map((d) => d.balance)  ?? [];
  const investedData = result?.monthlyData.map((d) => d.invested) ?? [];
  const allValues = [...equityData, ...investedData];
  const minV = allValues.length > 0 ? Math.min(...allValues) * 0.95 : 0;
  const maxV = allValues.length > 0 ? Math.max(...allValues) * 1.05 : 1;
  const chartLabels = result
    ? result.monthlyData
        .filter((_, i) => i % Math.ceil(result.monthlyData.length / 12) === 0)
        .map((d) => MONTHS_LABELS[(d.month - 1) % 12])
    : MONTHS_LABELS;

  const handleChartMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!result || !chartRef.current) return;
    const rect = chartRef.current.getBoundingClientRect();
    const frac = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
    const idx  = Math.min(Math.round(frac * (result.monthlyData.length - 1)), result.monthlyData.length - 1);
    const d    = result.monthlyData[idx];
    setTooltip({ x: e.clientX - rect.left, monthLabel: `Mois ${d.month}`, balance: d.balance, invested: d.invested });
  };

  let crossX: number | null = null;
  let crossY: number | null = null;
  if (tooltip && result && chartRef.current) {
    const rect = chartRef.current.getBoundingClientRect();
    const frac = Math.min(Math.max(tooltip.x / rect.width, 0), 1);
    const idx  = Math.min(Math.round(frac * (result.monthlyData.length - 1)), result.monthlyData.length - 1);
    crossX = frac * W;
    crossY = toY(result.monthlyData[idx].balance, minV, maxV);
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const ac = ASSET_COLORS[asset] ?? { bg: 'rgba(255,255,255,0.08)', color: '#AAAAAA' };

  return (
    <AppLayout title="Simulateur de Trading" subtitle="Testez vos stratégies sans risque avec des données historiques">
      <PageSEO
        title="Simulateur DCA — Alvio"
        description="Simulateur de trading DCA Alvio. Testez vos stratégies d'investissement et analysez vos performances sur données historiques crypto."
        noindex={true}
      />
      <Head><title>Simulateur — Alvio</title></Head>

      {/* ── 2-col grid ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '20px', alignItems: 'start', marginBottom: '20px' }}>

        {/* ═══ LEFT: Form card ══════════════════════════════════════════════ */}
        <div style={{ background: '#111111', borderRadius: '20px', border: '1px solid #1F1F1F', boxShadow: '0 1px 3px rgba(0,0,0,0.4)', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ padding: '22px 24px 18px', borderBottom: '1px solid #1A1A1A' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'linear-gradient(135deg,#2563eb,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="16" height="16" fill="none" stroke="#fff" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>Paramètres</h2>
                <p style={{ fontSize: '11px', color: '#555555', margin: 0 }}>Simulation DCA</p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div style={{ padding: '20px 24px 24px' }}>

            {/* Capital */}
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Capital Initial</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px', color: '#444444', fontWeight: 600, pointerEvents: 'none' }}>$</span>
                <input type="number" value={capital} onChange={(e) => setCapital(e.target.value)}
                  className="sim-input" min="0"
                  style={{ ...inputBase, paddingLeft: '28px' }} />
              </div>
            </div>

            {/* Monthly */}
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Investissement mensuel</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px', color: '#444444', fontWeight: 600, pointerEvents: 'none' }}>$</span>
                <input type="number" value={monthlyInv} onChange={(e) => setMonthlyInv(e.target.value)}
                  className="sim-input" min="0"
                  style={{ ...inputBase, paddingLeft: '28px' }} />
              </div>
            </div>

            {/* Asset pills */}
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Actif</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {ASSETS.map((a) => {
                  const c = ASSET_COLORS[a] ?? { bg: 'rgba(255,255,255,0.08)', color: '#AAAAAA' };
                  const active = asset === a;
                  return (
                    <button key={a} onClick={() => setAsset(a)} style={{
                      padding: '6px 12px', borderRadius: '8px', border: 'none',
                      background: active ? c.bg : '#1A1A1A',
                      color: active ? c.color : '#555555',
                      fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                      outline: active ? `2px solid ${c.color}30` : '2px solid transparent',
                      outlineOffset: '1px', transition: 'all 0.15s',
                    }}>
                      {a.replace('/USDT', '')}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Period slider */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={labelStyle}>Période</label>
                <span style={{ fontSize: '14px', fontWeight: 800, color: '#3b82f6' }}>{period} an{period > 1 ? 's' : ''}</span>
              </div>
              <input type="range" min={1} max={5} step={1} value={period}
                onChange={(e) => setPeriod(Number(e.target.value))}
                className="sim-slider"
                style={{ width: '100%', background: sliderBg(period, 1, 5) }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                {[1,2,3,4,5].map((n) => (
                  <span key={n} style={{ fontSize: '11px', color: n === period ? '#3b82f6' : '#444444', fontWeight: n === period ? 700 : 400, transition: 'color 0.15s' }}>
                    {n}a
                  </span>
                ))}
              </div>
            </div>

            {/* Return slider */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={labelStyle}>Rendement annuel</label>
                <span style={{ fontSize: '14px', fontWeight: 800, color: annualReturn >= 0.5 ? '#22c55e' : '#3b82f6' }}>
                  {Math.round(annualReturn * 100)}%
                </span>
              </div>
              <input type="range" min={5} max={100} step={5} value={Math.round(annualReturn * 100)}
                onChange={(e) => setAnnualReturn(Number(e.target.value) / 100)}
                className="sim-slider"
                style={{ width: '100%', background: sliderBg(Math.round(annualReturn * 100), 5, 100) }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                <span style={{ fontSize: '11px', color: '#444444' }}>5%</span>
                <span style={{ fontSize: '11px', color: '#444444' }}>100%</span>
              </div>
            </div>

            {/* Mode toggle */}
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Mode de simulation</label>
              <div style={{ display: 'flex', gap: '6px' }}>
                {(['monte_carlo', 'fixed'] as const).map((m) => (
                  <button key={m} onClick={() => setMode(m)} style={{
                    flex: 1, padding: '8px 10px', borderRadius: '8px', border: 'none',
                    background: mode === m ? 'rgba(59,130,246,0.15)' : '#1A1A1A',
                    color: mode === m ? '#3b82f6' : '#555555',
                    fontSize: '11px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                    outline: mode === m ? '2px solid rgba(59,130,246,0.30)' : '2px solid transparent',
                    outlineOffset: '1px', transition: 'all 0.15s',
                  }}>
                    {m === 'monte_carlo' ? 'Monte Carlo' : 'Projection fixe'}
                  </button>
                ))}
              </div>
              <p style={{ fontSize: '11px', color: '#444444', margin: '6px 0 0', lineHeight: 1.4 }}>
                {mode === 'monte_carlo'
                  ? 'Résultats variables à chaque simulation (bruit gaussien)'
                  : 'Résultats reproductibles — idéal pour les présentations'}
              </p>
            </div>

            {/* Volatility slider — Monte Carlo uniquement */}
            {mode === 'monte_carlo' && (
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={labelStyle}>Volatilité</label>
                  <span style={{ fontSize: '14px', fontWeight: 800, color: '#8b5cf6' }}>
                    {Math.round(volatility * 100)}%
                  </span>
                </div>
                <input type="range" min={0} max={50} step={5} value={Math.round(volatility * 100)}
                  onChange={(e) => setVolatility(Number(e.target.value) / 100)}
                  className="sim-slider"
                  style={{ width: '100%', background: sliderBg(Math.round(volatility * 100), 0, 50) }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                  <span style={{ fontSize: '11px', color: '#444444' }}>0%</span>
                  <span style={{ fontSize: '11px', color: '#444444' }}>50%</span>
                </div>
              </div>
            )}
            {mode === 'fixed' && <div style={{ marginBottom: '24px' }} />}

            {/* Run button */}
            <button onClick={handleRun} disabled={running} style={{
              width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
              background: running ? '#1e40af' : 'linear-gradient(135deg,#2563eb 0%,#4f46e5 100%)',
              color: '#fff', fontSize: '14px', fontWeight: 700, cursor: running ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              boxShadow: running ? 'none' : '0 4px 14px rgba(37,99,235,0.30)',
              fontFamily: 'inherit', transition: 'box-shadow 0.2s',
            }}>
              {running ? (
                <>
                  <div style={{ width: '15px', height: '15px', borderRadius: '50%', border: '2.5px solid rgba(255,255,255,0.2)', borderTop: '2.5px solid #fff', animation: 'sim-spin 0.7s linear infinite' }} />
                  Calcul en cours…
                </>
              ) : (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21" /></svg>
                  Lancer la simulation
                </>
              )}
            </button>

            {/* Reset */}
            <button onClick={handleReset} style={{
              width: '100%', marginTop: '8px', padding: '8px', border: 'none', borderRadius: '8px',
              background: 'none', color: '#444444', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
              fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
            }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#888888')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#444444')}>
              <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Réinitialiser
            </button>

            {error && (
              <div style={{ marginTop: '10px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.20)', borderRadius: '10px', padding: '10px 14px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <svg width="13" height="13" fill="none" stroke="#f59e0b" viewBox="0 0 24 24" style={{ flexShrink: 0, marginTop: '1px' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
                <p style={{ fontSize: '12px', color: '#fbbf24', margin: 0, lineHeight: 1.5 }}>{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* ═══ RIGHT: Results / empty state ════════════════════════════════ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {!result ? (
            /* ── Onboarding card ── */
            <div style={{ background: '#111111', borderRadius: '20px', border: '1px solid #1F1F1F', boxShadow: '0 1px 3px rgba(0,0,0,0.4)', padding: '56px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div style={{ width: '68px', height: '68px', borderRadius: '18px', background: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                <svg width="34" height="34" fill="none" stroke="#3b82f6" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#FFFFFF', margin: '0 0 8px' }}>
                Votre simulation apparaîtra ici
              </h3>
              <p style={{ fontSize: '13px', color: '#888888', margin: '0 0 40px', maxWidth: '320px', lineHeight: 1.7 }}>
                Configurez vos paramètres à gauche et lancez la simulation pour visualiser l&apos;évolution de votre capital.
              </p>

              {/* 3 steps */}
              <div style={{ display: 'flex', gap: '0', width: '100%', maxWidth: '380px' }}>
                {[
                  { n: '1', label: 'Configure',  desc: 'Capital, actif et période',           icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
                  { n: '2', label: 'Lance',      desc: 'Clique sur Lancer',                   icon: 'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
                  { n: '3', label: 'Analyse',    desc: 'Capital final, ROI, courbe',          icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
                ].map((s, i) => (
                  <div key={s.n} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                    {i < 2 && (
                      <div style={{ position: 'absolute', top: '16px', left: '58%', right: '-42%', height: '1px', background: 'linear-gradient(90deg,rgba(37,99,235,0.3),rgba(30,30,30,0))', zIndex: 0 }} />
                    )}
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg,#2563eb,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px', position: 'relative', zIndex: 1, boxShadow: '0 2px 8px rgba(37,99,235,0.30)' }}>
                      <svg width="15" height="15" fill="none" stroke="white" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={s.icon} />
                      </svg>
                    </div>
                    <p style={{ fontSize: '12px', fontWeight: 700, color: '#CCCCCC', margin: '0 0 3px' }}>{s.label}</p>
                    <p style={{ fontSize: '11px', color: '#555555', margin: 0, lineHeight: 1.4, textAlign: 'center', padding: '0 4px' }}>{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* ── KPI 2×2 ── */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '12px' }}>
                {[
                  { label: 'Capital Final',  value: fmt(result.finalBalance),  sub: pct(result.roi),         win: result.roi >= 0,            iconPath: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
                  { label: 'Total Investi', value: fmt(result.totalInvested), sub: `sur ${period} an${period > 1 ? 's' : ''}`, win: null, iconPath: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' },
                  { label: 'Gains Totaux',  value: fmt(result.totalGains),   sub: 'profit net estimé',       win: result.totalGains >= 0,     iconPath: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
                  { label: 'ROI',           value: pct(result.roi),          sub: 'retour sur investissement',win: result.roi >= 0,           iconPath: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
                ].map((k, i) => {
                  const color  = k.win === null ? '#3b82f6' : k.win ? '#22c55e' : '#ef4444';
                  const iconBg = k.win === null ? 'rgba(59,130,246,0.12)' : k.win ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)';
                  const border = k.win === null ? 'rgba(59,130,246,0.20)'  : k.win ? 'rgba(34,197,94,0.20)'  : 'rgba(239,68,68,0.20)';
                  return (
                    <div key={i} style={{ background: '#111111', borderRadius: '16px', padding: '20px', border: `1px solid ${border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <p style={{ fontSize: '11px', fontWeight: 700, color: '#555555', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>{k.label}</p>
                        <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg width="15" height="15" fill="none" stroke={color} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={k.iconPath} />
                          </svg>
                        </div>
                      </div>
                      <p style={{ fontSize: '26px', fontWeight: 800, color, margin: '0 0 4px', letterSpacing: '-0.02em', lineHeight: 1 }}>{k.value}</p>
                      <p style={{ fontSize: '12px', color: '#555555', fontWeight: 500, margin: 0 }}>{k.sub}</p>
                    </div>
                  );
                })}
              </div>

              {/* ── Equity chart ── */}
              <div style={{ background: '#111111', borderRadius: '20px', padding: '24px', border: '1px solid #1F1F1F', boxShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>
                {/* Chart header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px', gap: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>Courbe d&apos;Équité</h2>
                      <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', background: ac.bg, color: ac.color, whiteSpace: 'nowrap' }}>{asset}</span>
                    </div>
                    <p style={{ fontSize: '12px', color: '#555555', margin: 0 }}>Évolution mensuelle sur {period} an{period > 1 ? 's' : ''}</p>
                  </div>
                  {tooltip ? (
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ fontSize: '11px', color: '#555555', margin: '0 0 2px', fontWeight: 600 }}>{tooltip.monthLabel}</p>
                      <p style={{ fontSize: '18px', fontWeight: 800, color: '#3b82f6', margin: 0, letterSpacing: '-0.02em' }}>{fmt(tooltip.balance)}</p>
                      <p style={{ fontSize: '11px', color: '#555555', margin: 0 }}>investi : {fmt(tooltip.invested)}</p>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ fontSize: '11px', color: '#555555', margin: '0 0 2px' }}>Capital final</p>
                      <p style={{ fontSize: '18px', fontWeight: 800, color: '#3b82f6', margin: 0, letterSpacing: '-0.02em' }}>{fmt(result.finalBalance)}</p>
                      <p style={{ fontSize: '11px', color: '#555555', margin: 0 }}>ROI {pct(result.roi)}</p>
                    </div>
                  )}
                </div>

                {/* Chart container */}
                <div ref={chartRef} style={{ position: 'relative', cursor: 'crosshair', userSelect: 'none' }}
                  onMouseMove={handleChartMove}
                  onMouseLeave={() => setTooltip(null)}>
                  <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: '380px', display: 'block' }} preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="simGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor="#2563eb" stopOpacity="0.22" />
                        <stop offset="80%"  stopColor="#2563eb" stopOpacity="0.04" />
                        <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d={buildArea(investedData, minV, maxV)} fill="rgba(255,255,255,0.03)" />
                    <path d={buildPath(investedData, minV, maxV)} fill="none" stroke="#2A2A2A" strokeWidth="2" strokeDasharray="7,5" />
                    <path d={buildArea(equityData, minV, maxV)} fill="url(#simGrad)" />
                    <path d={buildPath(equityData, minV, maxV)} fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    {crossX !== null && crossY !== null && (
                      <>
                        <line x1={crossX} y1={0} x2={crossX} y2={H} stroke="#3b82f6" strokeWidth="1" strokeDasharray="4,3" strokeOpacity="0.40" />
                        <circle cx={crossX} cy={crossY} r="5" fill="#3b82f6" stroke="#111111" strokeWidth="2.5" />
                      </>
                    )}
                  </svg>
                </div>

                {/* X-axis labels */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', padding: '0 2px' }}>
                  {chartLabels.slice(0, 12).map((m, i) => <span key={i} style={{ fontSize: '11px', color: '#444444' }}>{m}</span>)}
                </div>

                {/* Legend */}
                <div style={{ display: 'flex', gap: '24px', marginTop: '14px', paddingTop: '14px', borderTop: '1px solid #1A1A1A' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                    <div style={{ width: '22px', height: '3px', background: '#3b82f6', borderRadius: '2px' }} />
                    <span style={{ fontSize: '12px', color: '#888888' }}>Capital cumulé</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                    <svg width="22" height="3" viewBox="0 0 22 3"><line x1="0" y1="1.5" x2="22" y2="1.5" stroke="#2A2A2A" strokeWidth="2" strokeDasharray="6,4" /></svg>
                    <span style={{ fontSize: '12px', color: '#888888' }}>Montant investi</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ═══ HISTORY: Full width ═════════════════════════════════════════════ */}
      <div style={{ background: '#111111', borderRadius: '20px', border: '1px solid #1F1F1F', boxShadow: '0 1px 3px rgba(0,0,0,0.4)', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #1A1A1A', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF', margin: '0 0 2px' }}>Historique des Simulations</h2>
            <p style={{ fontSize: '12px', color: '#555555', margin: 0 }}>Sauvegardées automatiquement en base de données</p>
          </div>
          {history.length > 0 && (
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#3b82f6', background: 'rgba(59,130,246,0.10)', padding: '4px 14px', borderRadius: '20px' }}>
              {history.length} simulation{history.length > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {histLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '48px', justifyContent: 'center' }}>
            <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid #222222', borderTop: '2px solid #3b82f6', animation: 'sim-spin 0.7s linear infinite' }} />
            <span style={{ fontSize: '13px', color: '#555555' }}>Chargement de l&apos;historique…</span>
          </div>
        ) : history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '56px 24px' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: '#141414', border: '2px dashed #222222', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <svg width="24" height="24" fill="none" stroke="#333333" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#CCCCCC', margin: '0 0 4px' }}>Aucune simulation enregistrée</p>
            <p style={{ fontSize: '13px', color: '#555555', margin: 0 }}>Lancez votre première simulation pour la voir apparaître ici.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#0D0D0D', borderBottom: '1px solid #1A1A1A' }}>
                  {['Date', 'Actif', 'Capital initial', 'Capital final', 'Gains', 'ROI', 'Période', ''].map((h) => (
                    <th key={h} style={{ textAlign: 'left', padding: '11px 16px', fontSize: '11px', fontWeight: 700, color: '#444444', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map((r, i) => {
                  const { params: p, result: res } = parseRecord(r);
                  const win = res.roi >= 0;
                  const c   = ASSET_COLORS[r.asset] ?? { bg: 'rgba(255,255,255,0.06)', color: '#AAAAAA' };
                  return (
                    <tr key={r.id} className="sim-row"
                      style={{ background: i % 2 === 0 ? '#111111' : '#0E0E0E', borderBottom: '1px solid #1A1A1A' }}>
                      <td style={{ padding: '13px 16px', color: '#555555', whiteSpace: 'nowrap' }}>{fmtDate(r.createdAt)}</td>
                      <td style={{ padding: '13px 16px' }}>
                        <span style={{ background: c.bg, color: c.color, fontSize: '11px', fontWeight: 800, padding: '3px 10px', borderRadius: '20px', whiteSpace: 'nowrap' }}>
                          {r.asset.replace('/USDT', '')}
                        </span>
                      </td>
                      <td style={{ padding: '13px 16px', color: '#CCCCCC', fontWeight: 600 }}>{fmt(p.initialAmount)}</td>
                      <td style={{ padding: '13px 16px', fontWeight: 700, color: win ? '#22c55e' : '#ef4444' }}>{fmt(res.finalBalance)}</td>
                      <td style={{ padding: '13px 16px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 700, color: win ? '#22c55e' : '#ef4444' }}>
                          <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={win ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'} />
                          </svg>
                          {fmt(Math.abs(res.totalGains))}
                        </span>
                      </td>
                      <td style={{ padding: '13px 16px' }}>
                        <span style={{ background: win ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)', color: win ? '#22c55e' : '#ef4444', fontSize: '12px', fontWeight: 800, padding: '4px 10px', borderRadius: '8px', whiteSpace: 'nowrap' }}>
                          {pct(res.roi)}
                        </span>
                      </td>
                      <td style={{ padding: '13px 16px', color: '#555555', whiteSpace: 'nowrap' }}>
                        {p.months / 12} an{p.months / 12 > 1 ? 's' : ''}
                      </td>
                      <td style={{ padding: '13px 16px' }}>
                        <button
                          onClick={() => handleReplay(r)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 13px', borderRadius: '8px', border: '1px solid #2A2A2A', background: '#1A1A1A', color: '#CCCCCC', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.color = '#3b82f6'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#2A2A2A'; e.currentTarget.style.color = '#CCCCCC'; }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                            <polygon points="5,3 19,12 5,21" />
                          </svg>
                          Rejouer
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`
        @keyframes sim-spin { to { transform: rotate(360deg); } }

        .sim-input { transition: border-color 0.15s, box-shadow 0.15s; }
        .sim-input:focus {
          border-color: #3b82f6 !important;
          background: #1F1F1F !important;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.12);
          outline: none;
        }

        .sim-slider {
          -webkit-appearance: none;
          appearance: none;
          height: 6px;
          border-radius: 99px;
          outline: none;
          cursor: pointer;
        }
        .sim-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #111111;
          border: 2.5px solid #3b82f6;
          box-shadow: 0 1px 4px rgba(59,130,246,0.35);
          cursor: pointer;
          transition: box-shadow 0.15s, transform 0.15s;
        }
        .sim-slider::-webkit-slider-thumb:hover {
          box-shadow: 0 2px 10px rgba(59,130,246,0.50);
          transform: scale(1.15);
        }
        .sim-slider::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #111111;
          border: 2.5px solid #3b82f6;
          box-shadow: 0 1px 4px rgba(59,130,246,0.35);
          cursor: pointer;
        }

        .sim-row { transition: background 0.1s; }
        .sim-row:hover { background: rgba(59,130,246,0.05) !important; }
      `}</style>
    </AppLayout>
  );
};

// Shared style objects (module-level to avoid recreation)
const labelStyle: React.CSSProperties = {
  fontSize: '11px', fontWeight: 700, color: '#666666',
  textTransform: 'uppercase', letterSpacing: '0.06em',
  display: 'block', marginBottom: '8px',
};
const inputBase: React.CSSProperties = {
  width: '100%', padding: '10px 12px',
  border: '1.5px solid #1F1F1F', borderRadius: '10px',
  fontSize: '14px', fontWeight: 600, color: '#FFFFFF',
  background: '#1A1A1A', outline: 'none', boxSizing: 'border-box',
  fontFamily: 'inherit',
};

export default SimulatorPage;
