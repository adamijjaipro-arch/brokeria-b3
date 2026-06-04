import React, { useState, useEffect, useCallback } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import AppLayout from '../../components/layout/AppLayout';
import api from '../../api';

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

interface StrategyIndicator {
  name:   string;
  params: string;
}

interface RiskManagement {
  stop_loss:     string;
  take_profit:   string;
  position_size: string;
  risk_reward:   string;
}

interface StrategyRules {
  name:             string;
  description:      string;
  entry_conditions: string[];
  exit_conditions:  string[];
  indicators:       StrategyIndicator[];
  timeframe:        string;
  asset_type:       string;
  risk_management:  RiskManagement;
  sessions:         string[];
  confidence_score: number;
}

interface AnalyzeResult {
  rules: StrategyRules;
  strategyId: string;
}

// ─── Styles constants ─────────────────────────────────────────────────────────

const card: React.CSSProperties = {
  backgroundColor: 'white',
  borderRadius: '16px',
  padding: '24px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StringSection({ title, items, color, bg }: { title: string; items: string[]; color: string; bg: string }) {
  if (items.length === 0) return null;
  return (
    <div style={{ marginBottom: '20px' }}>
      <p style={{ fontSize: '12px', fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 10px' }}>{title}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {items.map((item, i) => (
          <div key={i} style={{ background: bg, borderRadius: '10px', padding: '10px 14px', fontSize: '13px', color: '#374151', lineHeight: '1.5', borderLeft: `3px solid ${color}` }}>
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
      <p style={{ fontSize: '12px', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 10px' }}>Indicateurs techniques</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {indicators.map((ind, i) => (
          <div key={i} style={{ background: '#eff6ff', borderRadius: '10px', padding: '8px 12px', fontSize: '13px', color: '#1d4ed8', borderLeft: '3px solid #2563eb', display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span style={{ fontWeight: 700 }}>{ind.name}</span>
            {ind.params && <span style={{ color: '#6b7280', fontSize: '12px' }}>({ind.params})</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

function RiskSection({ risk }: { risk: RiskManagement }) {
  const rows: Array<{ label: string; value: string }> = [
    { label: 'Stop Loss',      value: risk.stop_loss },
    { label: 'Take Profit',    value: risk.take_profit },
    { label: 'Taille position', value: risk.position_size },
    { label: 'Risk/Reward',    value: risk.risk_reward },
  ].filter((r) => r.value && r.value !== '');

  if (rows.length === 0) return null;
  return (
    <div style={{ marginBottom: '20px' }}>
      <p style={{ fontSize: '12px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 10px' }}>Gestion du risque</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        {rows.map((r, i) => (
          <div key={i} style={{ background: '#f9fafb', borderRadius: '10px', padding: '10px 14px', borderLeft: '3px solid #9ca3af' }}>
            <p style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 600, margin: '0 0 2px', textTransform: 'uppercase' }}>{r.label}</p>
            <p style={{ fontSize: '13px', color: '#374151', fontWeight: 600, margin: 0 }}>{r.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnalysisModal({ result, onClose, onTest }: { result: AnalyzeResult; onClose: () => void; onTest: () => void }) {
  const { rules } = result;
  const score = rules.confidence_score ?? 0;
  const scoreColor = score >= 70 ? '#10b981' : score >= 40 ? '#f97316' : '#ef4444';

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: 'white', borderRadius: '20px', width: '100%', maxWidth: '600px', maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 60px rgba(0,0,0,0.25)' }}
      >
        {/* Header */}
        <div style={{ padding: '24px 28px 16px', borderBottom: '1px solid #f3f4f6' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', margin: 0 }}>
                  {rules.name || 'Analyse IA'}
                </h2>
                <span style={{ fontSize: '12px', fontWeight: 700, padding: '2px 10px', borderRadius: '20px', background: `${scoreColor}15`, color: scoreColor, border: `1px solid ${scoreColor}40`, whiteSpace: 'nowrap' }}>
                  Score {score}/100
                </span>
              </div>
              {rules.description && (
                <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 10px', lineHeight: '1.5' }}>{rules.description}</p>
              )}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {rules.timeframe && (
                  <span style={{ fontSize: '12px', fontWeight: 600, padding: '3px 10px', borderRadius: '20px', background: '#eff6ff', color: '#2563eb' }}>
                    ⏱ {rules.timeframe}
                  </span>
                )}
                {rules.asset_type && (
                  <span style={{ fontSize: '12px', fontWeight: 600, padding: '3px 10px', borderRadius: '20px', background: '#f0fdf4', color: '#10b981' }}>
                    📈 {rules.asset_type}
                  </span>
                )}
                {rules.sessions?.map((s, i) => (
                  <span key={i} style={{ fontSize: '12px', fontWeight: 600, padding: '3px 10px', borderRadius: '20px', background: '#faf5ff', color: '#7c3aed' }}>
                    🕐 {s}
                  </span>
                ))}
              </div>
            </div>
            <button onClick={onClose} style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', flexShrink: 0 }}>
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body — scrollable */}
        <div style={{ padding: '20px 28px', overflowY: 'auto', flex: 1 }}>
          <StringSection title="Conditions d'entrée"  items={rules.entry_conditions} color="#10b981" bg="#f0fdf4" />
          <StringSection title="Conditions de sortie" items={rules.exit_conditions}  color="#ef4444" bg="#fef2f2" />
          <IndicatorsSection indicators={rules.indicators} />
          <RiskSection risk={rules.risk_management} />
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 28px 24px', borderTop: '1px solid #f3f4f6', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '10px 20px', borderRadius: '12px', border: '1px solid #e5e7eb', background: 'white', color: '#374151', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
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

  // ─── Chargement des stratégies ─────────────────────────────────────────────

  const loadStrategies = useCallback(async () => {
    setLoadingList(true);
    setListError('');
    try {
      const { data } = await api.get<Strategy[]>('/strategies');
      setStrategies(data);
    } catch {
      setListError('Impossible de charger les stratégies.');
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => { loadStrategies(); }, [loadStrategies]);

  // ─── Analyse d'une stratégie ───────────────────────────────────────────────

  const handleAnalyze = async (strategyId: string) => {
    setAnalyzingId(strategyId);
    try {
      const { data } = await api.post<AnalyzeResult>(`/strategies/${strategyId}/analyze`);
      setAnalysisResult(data);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      alert(msg ?? 'Erreur lors de l\'analyse');
    } finally {
      setAnalyzingId(null);
    }
  };

  const handleTestInSimulator = () => {
    if (!analysisResult) return;
    router.push(`/simulator?strategyId=${analysisResult.strategyId}`);
  };

  // ─── Filtrage ──────────────────────────────────────────────────────────────

  const filtered =
    filter === 'Tous'
      ? strategies
      : strategies.filter((s) =>
          s.status === (filter === 'Actives' ? 'active' : 'inactive'),
        );

  const activeCount   = strategies.filter((s) => s.status === 'active').length;
  const totalTrades   = strategies.reduce((acc, s) => acc + (s.total_trades ?? 0), 0);
  const avgWinRate    =
    strategies.length > 0
      ? strategies.reduce((acc, s) => acc + (s.win_rate ?? 0), 0) / strategies.length
      : 0;

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <AppLayout title="Mes Stratégies" subtitle="Gérez et analysez vos stratégies de trading personnalisées">
      <Head><title>Stratégies — Alvio</title></Head>

      {/* Header actions */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '24px', marginTop: '-8px' }}>
        <div style={{ display: 'flex', gap: '4px', background: 'white', borderRadius: '12px', padding: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}>
          {(['Tous', 'Actives', 'Inactives'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '6px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              fontSize: '13px', fontWeight: filter === f ? 700 : 500,
              background: filter === f ? '#2563eb' : 'transparent',
              color: filter === f ? 'white' : '#6b7280',
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
          { label: 'Stratégies actives', value: String(activeCount), color: '#10b981', bg: '#f0fdf4' },
          { label: 'Win rate moyen',     value: avgWinRate > 0 ? `${avgWinRate.toFixed(1)}%` : '—', color: '#2563eb', bg: '#eff6ff' },
          { label: 'Total trades',       value: String(totalTrades),  color: '#111827', bg: '#f9fafb' },
        ].map((s, i) => (
          <div key={i} style={{ ...card, background: s.bg, padding: '16px 20px' }}>
            <p style={{ fontSize: '12px', color: '#9ca3af', fontWeight: 600, margin: '0 0 4px' }}>{s.label}</p>
            <p style={{ fontSize: '24px', fontWeight: 700, color: s.color, margin: 0 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Loading / error */}
      {loadingList && (
        <div style={{ ...card, textAlign: 'center', padding: '40px', color: '#6b7280', fontSize: '14px' }}>
          Chargement des stratégies…
        </div>
      )}

      {listError && (
        <div style={{ ...card, background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', fontSize: '14px', padding: '16px 20px' }}>
          {listError}
        </div>
      )}

      {/* Strategies list */}
      {!loadingList && !listError && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.map((s) => {
            const isAnalyzing = analyzingId === s.id;
            return (
              <div key={s.id} style={card}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                  {/* Icon */}
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: s.status === 'active' ? '#f0fdf4' : '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="22" height="22" fill="none" stroke={s.status === 'active' ? '#10b981' : '#9ca3af'} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>

                  {/* Main info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#111827', margin: 0 }}>{s.name}</h3>
                      <span style={{
                        fontSize: '11px', fontWeight: 700, padding: '2px 10px', borderRadius: '20px',
                        background: s.status === 'active' ? '#f0fdf4' : '#f9fafb',
                        color: s.status === 'active' ? '#10b981' : '#9ca3af',
                        border: `1px solid ${s.status === 'active' ? '#bbf7d0' : '#e5e7eb'}`,
                        whiteSpace: 'nowrap',
                      }}>
                        {s.status === 'active' ? '● Actif' : '○ Inactif'}
                      </span>
                    </div>
                    {s.description && (
                      <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 14px', lineHeight: '1.5' }}>{s.description}</p>
                    )}

                    {/* Metrics */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                      {[
                        { label: 'Asset',         value: s.asset,                                                       color: '#111827' },
                        { label: 'Timeframe',     value: s.timeframe,                                                   color: '#2563eb' },
                        { label: 'Win Rate',      value: s.win_rate != null ? `${s.win_rate}%` : '—',                   color: (s.win_rate ?? 0) >= 70 ? '#10b981' : '#f97316' },
                        { label: 'Profit Factor', value: s.profit_factor != null ? String(s.profit_factor) : '—',       color: '#111827' },
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
                    <button
                      onClick={() => handleAnalyze(s.id)}
                      disabled={isAnalyzing}
                      style={{
                        padding: '8px 16px', borderRadius: '10px', border: 'none',
                        background: isAnalyzing ? '#93c5fd' : '#2563eb',
                        color: 'white', fontSize: '13px', fontWeight: 600,
                        cursor: isAnalyzing ? 'not-allowed' : 'pointer',
                        whiteSpace: 'nowrap',
                        display: 'flex', alignItems: 'center', gap: '6px',
                      }}
                    >
                      {isAnalyzing ? (
                        <>
                          <Spinner />
                          Analyse…
                        </>
                      ) : (
                        <>📊 Analyser</>
                      )}
                    </button>
                    <button style={{
                      padding: '8px 16px', borderRadius: '10px', border: '1px solid #e5e7eb',
                      background: 'white', color: '#374151', fontSize: '13px', fontWeight: 600,
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

          {/* Empty state */}
          {filtered.length === 0 && (
            <div style={{ ...card, textAlign: 'center', padding: '60px 24px' }}>
              <span style={{ fontSize: '40px', display: 'block', marginBottom: '12px' }}>📋</span>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#374151', margin: '0 0 8px' }}>Aucune stratégie {filter.toLowerCase()}</h3>
              <p style={{ fontSize: '13px', color: '#9ca3af', margin: '0 0 20px' }}>Importez votre première stratégie pour commencer l'analyse.</p>
              <button onClick={() => router.push('/strategies/import')} style={{ padding: '10px 24px', borderRadius: '12px', border: 'none', background: '#2563eb', color: 'white', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
                + Importer une stratégie
              </button>
            </div>
          )}
        </div>
      )}

      {/* Analysis modal */}
      {analysisResult && (
        <AnalysisModal
          result={analysisResult}
          onClose={() => setAnalysisResult(null)}
          onTest={handleTestInSimulator}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </AppLayout>
  );
};

// ─── Micro-composants ─────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div style={{ width: '13px', height: '13px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
  );
}

export default StrategiesPage;
