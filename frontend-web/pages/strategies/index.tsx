import React, { useState, useEffect, useCallback } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import AppLayout from '../../components/layout/AppLayout';
import api from '../../api';
import PageSEO from '../../components/seo/PageSEO';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Strategy {
  id: string;
  name: string;
  description: string | null;
  asset: string;
  timeframe: string;
  status: string;
  win_rate: number | null;
  total_trades: number | null;
  profit_factor: number | null;
  createdAt: string;
  code: string;
}

interface StrategyIndicator { name: string; params: string; }

interface RiskManagement {
  stop_loss: string; take_profit: string;
  position_size: string; risk_reward: string;
}

interface StrategyRules {
  name: string; description: string;
  entry_conditions: string[]; exit_conditions: string[];
  indicators: StrategyIndicator[]; timeframe: string;
  asset_type: string; risk_management: RiskManagement;
  sessions: string[]; confidence_score: number;
}

interface AnalyzeResult { rules: StrategyRules; strategyId: string; }

// ─── Styles ───────────────────────────────────────────────────────────────────

const card: React.CSSProperties = {
  backgroundColor: '#111111',
  borderRadius: '16px',
  padding: '24px',
  border: '1px solid #1F1F1F',
  boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StringSection({ title, items, color, bg }: { title: string; items: string[]; color: string; bg: string }) {
  if (items.length === 0) return null;
  return (
    <div style={{ marginBottom: '20px' }}>
      <p style={{ fontSize: '12px', fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 10px' }}>{title}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {items.map((item, i) => (
          <div key={i} style={{ background: bg, borderRadius: '10px', padding: '10px 14px', fontSize: '13px', color: '#CCCCCC', lineHeight: '1.5', borderLeft: `3px solid ${color}` }}>
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

function IndicatorsSection({ indicators }: { indicators: StrategyIndicator[] }) {
  if (indicators.length === 0) return null;
  return (
    <div style={{ marginBottom: '20px' }}>
      <p style={{ fontSize: '12px', fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 10px' }}>Indicateurs techniques</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {indicators.map((ind, i) => (
          <div key={i} style={{ background: 'rgba(59,130,246,0.08)', borderRadius: '10px', padding: '8px 12px', fontSize: '13px', color: '#3b82f6', borderLeft: '3px solid #2563eb', display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span style={{ fontWeight: 700 }}>{ind.name}</span>
            {ind.params && <span style={{ color: '#555555', fontSize: '12px' }}>({ind.params})</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

function RiskSection({ risk }: { risk: RiskManagement }) {
  const rows = [
    { label: 'Stop Loss',      value: risk.stop_loss },
    { label: 'Take Profit',    value: risk.take_profit },
    { label: 'Taille position', value: risk.position_size },
    { label: 'Risk/Reward',    value: risk.risk_reward },
  ].filter((r) => r.value && r.value !== '');
  if (rows.length === 0) return null;
  return (
    <div style={{ marginBottom: '20px' }}>
      <p style={{ fontSize: '12px', fontWeight: 700, color: '#555555', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 10px' }}>Gestion du risque</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        {rows.map((r, i) => (
          <div key={i} style={{ background: '#1A1A1A', borderRadius: '10px', padding: '10px 14px', borderLeft: '3px solid #333333' }}>
            <p style={{ fontSize: '11px', color: '#555555', fontWeight: 600, margin: '0 0 2px', textTransform: 'uppercase' }}>{r.label}</p>
            <p style={{ fontSize: '13px', color: '#CCCCCC', fontWeight: 600, margin: 0 }}>{r.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnalysisModal({ result, onClose, onTest }: { result: AnalyzeResult; onClose: () => void; onTest: () => void }) {
  const { rules } = result;
  const score = rules.confidence_score ?? 0;
  const scoreColor = score >= 70 ? '#22c55e' : score >= 40 ? '#f97316' : '#ef4444';

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: '#111111', borderRadius: '20px', width: '100%', maxWidth: '600px', maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 60px rgba(0,0,0,0.6)', border: '1px solid #1F1F1F' }}>
        {/* Header */}
        <div style={{ padding: '24px 28px 16px', borderBottom: '1px solid #1A1A1A' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>{rules.name || 'Analyse IA'}</h2>
                <span style={{ fontSize: '12px', fontWeight: 700, padding: '2px 10px', borderRadius: '20px', background: `${scoreColor}15`, color: scoreColor, border: `1px solid ${scoreColor}40`, whiteSpace: 'nowrap' }}>
                  Score {score}/100
                </span>
              </div>
              {rules.description && (
                <p style={{ fontSize: '13px', color: '#888888', margin: '0 0 10px', lineHeight: '1.5' }}>{rules.description}</p>
              )}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {rules.timeframe && (
                  <span style={{ fontSize: '12px', fontWeight: 600, padding: '3px 10px', borderRadius: '20px', background: 'rgba(59,130,246,0.10)', color: '#3b82f6' }}>
                    ⏱ {rules.timeframe}
                  </span>
                )}
                {rules.asset_type && (
                  <span style={{ fontSize: '12px', fontWeight: 600, padding: '3px 10px', borderRadius: '20px', background: 'rgba(34,197,94,0.10)', color: '#22c55e' }}>
                    📈 {rules.asset_type}
                  </span>
                )}
                {rules.sessions?.map((s, i) => (
                  <span key={i} style={{ fontSize: '12px', fontWeight: 600, padding: '3px 10px', borderRadius: '20px', background: 'rgba(139,92,246,0.10)', color: '#a78bfa' }}>
                    🕐 {s}
                  </span>
                ))}
              </div>
            </div>
            <button onClick={onClose} style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #2A2A2A', background: '#1A1A1A', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555555', flexShrink: 0 }}>
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 28px', overflowY: 'auto', flex: 1 }}>
          <StringSection title="Conditions d'entrée"  items={rules.entry_conditions} color="#22c55e" bg="rgba(34,197,94,0.08)" />
          <StringSection title="Conditions de sortie" items={rules.exit_conditions}  color="#ef4444" bg="rgba(239,68,68,0.08)" />
          <IndicatorsSection indicators={rules.indicators} />
          <RiskSection risk={rules.risk_management} />
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 28px 24px', borderTop: '1px solid #1A1A1A', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '10px 20px', borderRadius: '12px', border: '1px solid #2A2A2A', background: '#1A1A1A', color: '#CCCCCC', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
            Fermer
          </button>
          <button onClick={onTest} style={{ padding: '10px 20px', borderRadius: '12px', border: 'none', background: '#2563eb', color: 'white', fontSize: '14px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            Tester dans le simulateur
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const StrategiesPage: NextPage = () => {
  const router = useRouter();

  const [filter, setFilter]           = useState('Tous');
  const [strategies, setStrategies]   = useState<Strategy[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError]     = useState('');

  const [analyzingId, setAnalyzingId]       = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalyzeResult | null>(null);

  const loadStrategies = useCallback(async () => {
    setLoadingList(true); setListError('');
    try {
      const { data } = await api.get<Strategy[]>('/strategies');
      setStrategies(data);
    } catch {
      setListError('Impossible de charger les stratégies.');
    } finally { setLoadingList(false); }
  }, []);

  useEffect(() => { loadStrategies(); }, [loadStrategies]);

  const handleAnalyze = async (strategyId: string) => {
    setAnalyzingId(strategyId);
    try {
      const { data } = await api.post<AnalyzeResult>(`/strategies/${strategyId}/analyze`);
      setAnalysisResult(data);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      alert(msg ?? "Erreur lors de l'analyse");
    } finally { setAnalyzingId(null); }
  };

  const handleTestInSimulator = () => {
    if (!analysisResult) return;
    router.push(`/simulator?strategyId=${analysisResult.strategyId}`);
  };

  const filtered    = filter === 'Tous' ? strategies : strategies.filter((s) => s.status === (filter === 'Actives' ? 'active' : 'inactive'));
  const activeCount = strategies.filter((s) => s.status === 'active').length;
  const totalTrades = strategies.reduce((acc, s) => acc + (s.total_trades ?? 0), 0);
  const avgWinRate  = strategies.length > 0 ? strategies.reduce((acc, s) => acc + (s.win_rate ?? 0), 0) / strategies.length : 0;

  return (
    <AppLayout title="Mes Stratégies" subtitle="Gérez et analysez vos stratégies de trading personnalisées">
      <PageSEO
        title="Stratégies — Alvio"
        description="Stratégies de trading Alvio. Créez et gérez vos stratégies algorithmiques personnalisées."
        noindex={true}
      />
      <Head><title>Stratégies — Alvio</title></Head>

      {/* Header actions */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '24px', marginTop: '-8px' }}>
        <div style={{ display: 'flex', gap: '4px', background: '#1A1A1A', borderRadius: '12px', padding: '4px', border: '1px solid #1F1F1F' }}>
          {(['Tous', 'Actives', 'Inactives'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '6px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              fontSize: '13px', fontWeight: filter === f ? 700 : 500,
              background: filter === f ? '#2563eb' : 'transparent',
              color: filter === f ? 'white' : '#888888',
            }}>{f}</button>
          ))}
        </div>

        <button onClick={() => router.push('/strategies/import')} style={{
          marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px',
          padding: '10px 18px', borderRadius: '12px', border: 'none',
          background: '#2563eb', color: 'white', fontSize: '14px', fontWeight: 700, cursor: 'pointer',
        }}>
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Importer une stratégie
        </button>
      </div>

      {/* Summary row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
        {[
          { label: 'Stratégies actives', value: String(activeCount),                                color: '#22c55e', bg: 'rgba(34,197,94,0.08)',  border: 'rgba(34,197,94,0.15)'  },
          { label: 'Win rate moyen',     value: avgWinRate > 0 ? `${avgWinRate.toFixed(1)}%` : '—', color: '#3b82f6', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.15)' },
          { label: 'Total trades',       value: String(totalTrades),                                color: '#FFFFFF', bg: '#141414',               border: '#1F1F1F'               },
        ].map((s, i) => (
          <div key={i} style={{ ...card, background: s.bg, border: `1px solid ${s.border}`, padding: '16px 20px' }}>
            <p style={{ fontSize: '12px', color: '#555555', fontWeight: 600, margin: '0 0 4px' }}>{s.label}</p>
            <p style={{ fontSize: '24px', fontWeight: 700, color: s.color, margin: 0 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {loadingList && (
        <div style={{ ...card, textAlign: 'center', padding: '40px', color: '#888888', fontSize: '14px' }}>
          Chargement des stratégies…
        </div>
      )}

      {listError && (
        <div style={{ ...card, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.20)', color: '#ef4444', fontSize: '14px', padding: '16px 20px' }}>
          {listError}
        </div>
      )}

      {!loadingList && !listError && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.map((s) => {
            const isAnalyzing = analyzingId === s.id;
            return (
              <div key={s.id} style={card}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: s.status === 'active' ? 'rgba(34,197,94,0.12)' : '#141414', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="22" height="22" fill="none" stroke={s.status === 'active' ? '#22c55e' : '#444444'} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>{s.name}</h3>
                      <span style={{
                        fontSize: '11px', fontWeight: 700, padding: '2px 10px', borderRadius: '20px',
                        background: s.status === 'active' ? 'rgba(34,197,94,0.12)' : '#141414',
                        color:      s.status === 'active' ? '#22c55e'             : '#555555',
                        border:     `1px solid ${s.status === 'active' ? 'rgba(34,197,94,0.25)' : '#222222'}`,
                        whiteSpace: 'nowrap',
                      }}>
                        {s.status === 'active' ? '● Actif' : '○ Inactif'}
                      </span>
                    </div>
                    {s.description && (
                      <p style={{ fontSize: '13px', color: '#888888', margin: '0 0 14px', lineHeight: '1.5' }}>{s.description}</p>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                      {[
                        { label: 'Asset',         value: s.asset,                                                    color: '#CCCCCC' },
                        { label: 'Timeframe',     value: s.timeframe,                                                color: '#3b82f6' },
                        { label: 'Win Rate',      value: s.win_rate != null ? `${s.win_rate}%` : '—',               color: (s.win_rate ?? 0) >= 70 ? '#22c55e' : '#f97316' },
                        { label: 'Profit Factor', value: s.profit_factor != null ? String(s.profit_factor) : '—',   color: '#CCCCCC' },
                      ].map((m, i) => (
                        <div key={i} style={{ background: '#1A1A1A', borderRadius: '10px', padding: '10px 14px' }}>
                          <p style={{ fontSize: '11px', color: '#555555', fontWeight: 600, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{m.label}</p>
                          <p style={{ fontSize: '15px', fontWeight: 700, color: m.color, margin: 0 }}>{m.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
                    <button onClick={() => handleAnalyze(s.id)} disabled={isAnalyzing} style={{
                      padding: '8px 16px', borderRadius: '10px', border: 'none',
                      background: isAnalyzing ? '#1e40af' : '#2563eb',
                      color: 'white', fontSize: '13px', fontWeight: 600,
                      cursor: isAnalyzing ? 'not-allowed' : 'pointer',
                      whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px',
                    }}>
                      {isAnalyzing ? <><Spinner /> Analyse…</> : <>📊 Analyser</>}
                    </button>
                    <button style={{
                      padding: '8px 16px', borderRadius: '10px', border: '1px solid #2A2A2A',
                      background: '#1A1A1A', color: '#CCCCCC', fontSize: '13px', fontWeight: 600,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center',
                    }}>
                      <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Modifier
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div style={{ ...card, textAlign: 'center', padding: '60px 24px' }}>
              <span style={{ fontSize: '40px', display: 'block', marginBottom: '12px' }}>📋</span>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#CCCCCC', margin: '0 0 8px' }}>Aucune stratégie {filter.toLowerCase()}</h3>
              <p style={{ fontSize: '13px', color: '#555555', margin: '0 0 20px' }}>Importez votre première stratégie pour commencer l&apos;analyse.</p>
              <button onClick={() => router.push('/strategies/import')} style={{ padding: '10px 24px', borderRadius: '12px', border: 'none', background: '#2563eb', color: 'white', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
                + Importer une stratégie
              </button>
            </div>
          )}
        </div>
      )}

      {analysisResult && (
        <AnalysisModal result={analysisResult} onClose={() => setAnalysisResult(null)} onTest={handleTestInSimulator} />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </AppLayout>
  );
};

function Spinner() {
  return <div style={{ width: '13px', height: '13px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />;
}

export default StrategiesPage;
