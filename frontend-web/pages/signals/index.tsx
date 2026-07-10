import React, { useState, useEffect, useCallback } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import AppLayout from '../../components/layout/AppLayout';
import { signalsApi, Signal } from '../../api';
import PageSEO from '../../components/seo/PageSEO';

const REFRESH_MS = 30_000;

const card: React.CSSProperties = {
  backgroundColor: '#111111',
  borderRadius: '16px',
  padding: '24px',
  border: '1px solid #1F1F1F',
  boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
};

// Fallback mock data
const MOCK_SIGNALS: Signal[] = [
  {
    id: '1', asset: 'BTC/USD', direction: 'BUY', confidence: 88,
    entry_price: 73730, stop_loss: 73535, take_profit: 74052,
    patterns: '["Bullish Breakout"]', indicators: '{"tp1":74052}',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2', asset: 'DAX', direction: 'BUY', confidence: 85,
    entry_price: 23560, stop_loss: 23510, take_profit: 23630,
    patterns: '["Bullish Continuation"]', indicators: '{"tp1":23630,"tp2":23672}',
    createdAt: new Date().toISOString(),
  },
  {
    id: '3', asset: 'NASDAQ', direction: 'BUY', confidence: 86,
    entry_price: 24702, stop_loss: 24646, take_profit: 24788,
    patterns: '["Ascending Triangle"]', indicators: '{"tp1":24788,"tp2":24819}',
    createdAt: new Date().toISOString(),
  },
];

const DIRECTIONS          = ['Tous', 'BUY', 'SELL', 'HOLD'];
const CONFIDENCE_OPTIONS  = ['Tous', '> 70%', '> 80%', '> 90%'];
const CRYPTO_ASSETS       = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'MATIC', 'DOGE', 'USDT', 'AVAX'];

const isCrypto = (asset: string) => CRYPTO_ASSETS.some((c) => asset.toUpperCase().includes(c));

const fmt = (n: number, asset = '') => {
  const prefix = isCrypto(asset) ? '$' : '';
  return prefix + n.toLocaleString('fr-FR', { maximumFractionDigits: n >= 1000 ? 0 : 4 });
};

const parseIndicators = (raw?: string | null): Record<string, number> => {
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return {}; }
};

const timeLabel = (iso: string) =>
  new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

const SignalsPage: NextPage = () => {
  const router = useRouter();
  const [signals,     setSignals]     = useState<Signal[]>([]);
  const [isMock,      setIsMock]      = useState(false);
  const [loading,     setLoading]     = useState(true);
  const [filterDir,   setFilterDir]   = useState('Tous');
  const [filterConf,  setFilterConf]  = useState('Tous');
  const [filterAsset, setFilterAsset] = useState('');

  const fetchSignals = useCallback(() => {
    signalsApi.getAll()
      .then(({ data }) => {
        const useMock = data.length === 0;
        setSignals(useMock ? MOCK_SIGNALS : data);
        setIsMock(useMock);
      })
      .catch(() => {
        setSignals(MOCK_SIGNALS);
        setIsMock(true);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchSignals();
    const id = setInterval(fetchSignals, REFRESH_MS);
    return () => clearInterval(id);
  }, [fetchSignals]);

  const filtered = signals.filter((s) => {
    const dirOk   = filterDir === 'Tous' || s.direction === filterDir;
    const assetOk = !filterAsset || s.asset.toLowerCase().includes(filterAsset.toLowerCase());
    const confMin = filterConf === 'Tous' ? 0 : filterConf === '> 70%' ? 70 : filterConf === '> 80%' ? 80 : 90;
    return dirOk && assetOk && s.confidence >= confMin;
  });

  const btnFilter = (active: boolean): React.CSSProperties => ({
    padding: '6px 14px', borderRadius: '8px',
    border: active ? 'none' : '1px solid #2A2A2A',
    backgroundColor: active ? '#2563eb' : '#1A1A1A',
    color: active ? 'white' : '#888888',
    fontSize: '13px', fontWeight: 600, cursor: 'pointer',
    transition: 'all 0.15s',
  });

  const selectStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px', border: '1px solid #1F1F1F',
    borderRadius: '10px', fontSize: '13px', color: '#FFFFFF',
    background: '#1A1A1A', outline: 'none',
  };

  return (
    <AppLayout
      title="Signaux de Trading"
      subtitle={`${filtered.length} signal${filtered.length > 1 ? 's' : ''} actif${filtered.length > 1 ? 's' : ''} détecté${filtered.length > 1 ? 's' : ''} par l'IA`}
    >
      <PageSEO
        title="Signaux Trading — Alvio"
        description="Signaux de trading Alvio. Recommandations BUY/SELL générées par intelligence artificielle sur les marchés crypto."
        noindex={true}
      />
      <Head><title>Signaux — Alvio</title></Head>

      {/* Header actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', marginTop: '-8px' }}>
        {isMock && (
          <span style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '5px 12px', borderRadius: '8px',
            background: 'rgba(234,179,8,0.12)', border: '1px solid rgba(234,179,8,0.3)',
            color: '#eab308', fontSize: '12px', fontWeight: 700,
          }}>
            ⚠️ Données de démonstration
          </span>
        )}
        <button style={{ ...btnFilter(false), marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          Exporter
        </button>
        <button style={{ ...btnFilter(true), display: 'flex', alignItems: 'center', gap: '6px' }}>
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          Alertes
        </button>
      </div>

      {/* Filters */}
      <div style={card}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
          <div>
            <p style={{ fontSize: '11px', fontWeight: 600, color: '#666666', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Type</p>
            <select value={filterDir} onChange={(e) => setFilterDir(e.target.value)} style={selectStyle}>
              {DIRECTIONS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <p style={{ fontSize: '11px', fontWeight: 600, color: '#666666', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Confiance</p>
            <select value={filterConf} onChange={(e) => setFilterConf(e.target.value)} style={selectStyle}>
              {CONFIDENCE_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <p style={{ fontSize: '11px', fontWeight: 600, color: '#666666', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Actif</p>
            <input
              type="text" placeholder="Rechercher..." value={filterAsset}
              onChange={(e) => setFilterAsset(e.target.value)}
              style={{ ...selectStyle, boxSizing: 'border-box' }}
            />
          </div>
        </div>
      </div>

      {/* Signal list */}
      {loading ? (
        <div style={{ ...card, textAlign: 'center', padding: '48px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '3px solid #2A2A2A', borderTop: '3px solid #2563eb', animation: 'spin 0.7s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ color: '#888888', margin: 0 }}>Chargement des signaux...</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.length === 0 ? (
            <div style={{ ...card, textAlign: 'center', padding: '48px' }}>
              <p style={{ color: '#888888', marginBottom: '12px' }}>Aucun signal ne correspond à vos filtres</p>
              <button
                onClick={() => { setFilterDir('Tous'); setFilterConf('Tous'); setFilterAsset(''); }}
                style={{ padding: '8px 20px', borderRadius: '10px', border: '1px solid #2A2A2A', background: '#1A1A1A', color: '#FFFFFF', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}
              >Réinitialiser les filtres</button>
            </div>
          ) : filtered.map((s) => (
            <div key={s.id} style={{ ...card, padding: '0' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', padding: '20px 24px', gap: '20px' }}>

                {/* Left: Icon + asset */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: '160px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: s.direction === 'BUY' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="20" height="20" fill="none" stroke={s.direction === 'BUY' ? '#22c55e' : '#ef4444'} viewBox="0 0 24 24">
                      {s.direction === 'BUY'
                        ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      }
                    </svg>
                  </div>
                  <div>
                    <p style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>{s.asset}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                      <span style={{ background: s.direction === 'BUY' ? '#2563eb' : '#ef4444', color: 'white', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '6px' }}>{s.direction}</span>
                    </div>
                  </div>
                </div>

                {/* Confiance */}
                <div style={{ minWidth: '110px' }}>
                  <p style={{ fontSize: '11px', color: '#555555', margin: '0 0 4px', fontWeight: 600 }}>CONFIANCE</p>
                  <p style={{ fontSize: '22px', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>{s.confidence}%</p>
                  <div style={{ width: '80px', height: '6px', background: '#222222', borderRadius: '99px', marginTop: '6px', overflow: 'hidden' }}>
                    <div style={{ width: `${s.confidence}%`, height: '100%', background: s.confidence >= 90 ? '#22c55e' : '#2563eb', borderRadius: '99px' }} />
                  </div>
                </div>

                {/* Prix */}
                {(() => {
                  const ind  = parseIndicators(s.indicators);
                  const tp2  = ind.tp2;
                  const cols = tp2 ? 5 : 4;
                  return (
                    <div style={{ flex: 1, display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '16px' }}>
                      <div>
                        <p style={{ fontSize: '11px', color: '#555555', margin: '0 0 4px', fontWeight: 600 }}>ENTRÉE</p>
                        <p style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>{fmt(s.entry_price, s.asset)}</p>
                      </div>
                      <div>
                        <p style={{ fontSize: '11px', color: '#555555', margin: '0 0 4px', fontWeight: 600 }}>{tp2 ? 'TP 1' : 'OBJECTIF'}</p>
                        <p style={{ fontSize: '14px', fontWeight: 700, color: '#22c55e', margin: 0 }}>{fmt(s.take_profit, s.asset)}</p>
                      </div>
                      {tp2 && (
                        <div>
                          <p style={{ fontSize: '11px', color: '#555555', margin: '0 0 4px', fontWeight: 600 }}>TP 2</p>
                          <p style={{ fontSize: '14px', fontWeight: 700, color: '#16a34a', margin: 0 }}>{fmt(tp2, s.asset)}</p>
                        </div>
                      )}
                      <div>
                        <p style={{ fontSize: '11px', color: '#555555', margin: '0 0 4px', fontWeight: 600 }}>STOP LOSS</p>
                        <p style={{ fontSize: '14px', fontWeight: 700, color: '#ef4444', margin: 0 }}>{fmt(s.stop_loss, s.asset)}</p>
                      </div>
                      <div>
                        <p style={{ fontSize: '11px', color: '#555555', margin: '0 0 4px', fontWeight: 600 }}>PATTERN</p>
                        <p style={{ fontSize: '13px', fontWeight: 600, color: '#AAAAAA', margin: 0 }}>
                          {s.patterns
                            ? (Array.isArray(s.patterns)
                                ? s.patterns[0]
                                : (() => { try { const p = JSON.parse(s.patterns as string); return Array.isArray(p) ? p[0] : s.patterns; } catch { return s.patterns; } })())
                            : '—'}
                        </p>
                      </div>
                    </div>
                  );
                })()}

                {/* Right: time + link */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ fontSize: '12px', color: '#555555', margin: '0 0 10px' }}>{timeLabel(s.createdAt)}</p>
                  <button
                    onClick={() => router.push(`/signals/${s.id}`)}
                    style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: '1px solid #2A2A2A', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#3b82f6' }}
                  >
                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    Détails
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </AppLayout>
  );
};

export default SignalsPage;
