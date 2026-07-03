import React, { useState, useEffect, useCallback } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import axios from 'axios';
import dynamic from 'next/dynamic';
import AppLayout from '../../components/layout/AppLayout';
import { marketsApi, type CoinDetailData } from '../../api';
import RateLimitCard from '../../components/common/RateLimitCard';
import Image from 'next/image';
import PageSEO from '../../components/seo/PageSEO';
import { SITE_URL } from '../../lib/seo';

// ── Formatters ────────────────────────────────────────────────────────────────

function fmtPrice(p: number): string {
  if (p >= 1_000) return `$${p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (p >= 1)     return `$${p.toFixed(4)}`;
  return `$${p.toFixed(8)}`;
}
function fmtLarge(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9)  return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6)  return `$${(n / 1e6).toFixed(2)}M`;
  return `$${n.toLocaleString('en-US')}`;
}
function fmtSupply(n: number, sym: string): string {
  const v = n >= 1e9 ? `${(n / 1e9).toFixed(2)}B` : n >= 1e6 ? `${(n / 1e6).toFixed(2)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(0)}K` : n.toFixed(0);
  return `${v} ${sym.toUpperCase()}`;
}
function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').trim();
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, positive }: { label: string; value: string; sub?: string; positive?: boolean }) {
  return (
    <div style={{ background: '#111111', border: '1px solid #1F1F1F', borderRadius: '14px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.4)', flex: 1, minWidth: 0 }}>
      <p style={{ margin: '0 0 8px', fontSize: '11px', fontWeight: 700, color: '#555555', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
      <p style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em' }}>{value}</p>
      {sub !== undefined && (
        <p style={{ margin: '4px 0 0', fontSize: '11px', fontWeight: 600, color: positive === true ? '#22c55e' : positive === false ? '#ef4444' : '#888888' }}>{sub}</p>
      )}
    </div>
  );
}

function SkeletonStat() {
  return (
    <div style={{ background: '#111111', border: '1px solid #1F1F1F', borderRadius: '14px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.4)', flex: 1, minWidth: 0 }}>
      <div style={skel(60, 10)} />
      <div style={{ ...skel('70%', 22), marginTop: '10px' }} />
    </div>
  );
}

function skel(w: number | string, h: number): React.CSSProperties {
  return {
    width: typeof w === 'number' ? `${w}px` : w, height: `${h}px`, borderRadius: '6px',
    background: 'linear-gradient(90deg,#1A1A1A 25%,#222222 50%,#1A1A1A 75%)',
    backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite',
  };
}

function SkeletonChart() {
  return (
    <div style={{ background: '#0d1117', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', height: '600px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px 20px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ width: '220px', height: '30px', borderRadius: '6px', background: 'rgba(255,255,255,0.06)', marginBottom: '12px' }} />
        <div style={{ display: 'flex', gap: '6px' }}>
          {['1m','5m','15m','1h','4h','1J','1S','1M'].map((tf) => (
            <div key={tf} style={{ width: '36px', height: '26px', borderRadius: '6px', background: 'rgba(255,255,255,0.04)' }} />
          ))}
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '5px', height: '80px' }}>
          {[42, 68, 55, 80, 47, 72, 38, 88, 60, 76, 44, 65, 52, 83].map((h, i) => (
            <div key={i} style={{ width: '10px', height: `${h}%`, background: i % 3 === 0 ? 'rgba(239,83,80,0.2)' : 'rgba(38,166,154,0.2)', borderRadius: '2px', animation: `alvio-flicker ${0.7 + i * 0.07}s ease-in-out infinite alternate` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

const TradingChart = dynamic(
  () => import('../../components/charts/TradingChart'),
  { ssr: false, loading: () => <SkeletonChart /> },
);

// ── Page ──────────────────────────────────────────────────────────────────────

const CoinDetailPage: NextPage = () => {
  const router = useRouter();
  const coinId = typeof router.query.id === 'string' ? router.query.id : null;

  const [coin,     setCoin]     = useState<CoinDetailData | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [descOpen, setDescOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const fetchCoin = useCallback(async () => {
    if (!coinId) return;
    try {
      const { data } = await marketsApi.getDetail(coinId);
      setCoin(data); setError(null);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 429) setError('__429__');
      else setError(err instanceof Error ? err.message : 'Erreur réseau');
    } finally {
      setLoading(false);
    }
  }, [coinId]);

  useEffect(() => { setCoin(null); setLoading(true); setError(null); }, [coinId]);
  useEffect(() => {
    void fetchCoin();
    const id = setInterval(() => { void fetchCoin(); }, 90_000);
    return () => clearInterval(id);
  }, [fetchCoin]);

  const md       = coin?.market_data;
  const positive = (md?.price_change_percentage_24h ?? 0) >= 0;
  const signal   = positive ? 'BUY' : 'SELL';

  const description = coin?.description?.en ? stripHtml(coin.description.en) : null;
  const website     = coin?.links?.homepage?.find((u) => u && u.startsWith('http')) ?? null;
  const rank        = coin?.market_cap_rank;

  const pageTitle = coin ? `${coin.name} (${coin.symbol.toUpperCase()}) — Alvio` : 'Marché — Alvio';

  return (
    <AppLayout>
      <PageSEO
        title={pageTitle}
        description={coin ? `Analyse détaillée de ${coin.name} (${coin.symbol.toUpperCase()}) sur Alvio. Prix en temps réel, graphiques OHLCV, données historiques et signaux IA.` : 'Analyse de marché crypto sur Alvio avec données en temps réel et signaux IA.'}
        canonical={`${SITE_URL}/markets/${router.query.id}`}
        ogImage={coin?.image?.large ?? `${SITE_URL}/og-markets.png`}
      />
      <Head>
        <title>{pageTitle}</title>
        <style>{`
          @keyframes shimmer       { 0% { background-position:-200% 0; } 100% { background-position:200% 0; } }
          @keyframes fadeUp        { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
          @keyframes toastIn       { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
          @keyframes alvio-flicker { from { opacity:0.2; } to { opacity:0.55; } }
        `}</style>
      </Head>

      {/* Toast */}
      {toastMsg && (
        <div style={{ position: 'fixed', bottom: '32px', left: '50%', transform: 'translateX(-50%)', zIndex: 9999, background: '#1A1A1A', border: '1px solid #2A2A2A', color: '#fff', padding: '12px 24px', borderRadius: '12px', fontSize: '13px', fontWeight: 600, boxShadow: '0 8px 24px rgba(0,0,0,0.6)', animation: 'toastIn 0.25s ease' }}>
          {toastMsg}
        </div>
      )}

      {/* Back nav */}
      <button onClick={() => router.back()} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', padding: '0 0 20px', color: '#666666', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
        onMouseEnter={(e) => (e.currentTarget.style.color = '#AAAAAA')}
        onMouseLeave={(e) => (e.currentTarget.style.color = '#666666')}>
        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Marchés
      </button>

      {/* HERO HEADER */}
      <div style={{ background: '#111111', border: '1px solid #1F1F1F', borderRadius: '20px', padding: '24px 28px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.4)', animation: 'fadeUp 0.3s ease' }}>
        {loading && !coin ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ ...skel(52, 52), borderRadius: '50%' }} />
            <div>
              <div style={skel(160, 22)} />
              <div style={{ ...skel(100, 14), marginTop: '8px' }} />
            </div>
          </div>
        ) : coin ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            {/* Left: logo + name + price */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Image src={coin.image.large} alt={coin.name} width={52} height={52} style={{ borderRadius: '50%', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.4)' }} />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em' }}>{coin.name}</h1>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#666666', background: '#1F1F1F', padding: '2px 8px', borderRadius: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{coin.symbol}</span>
                  {rank && <span style={{ fontSize: '11px', fontWeight: 600, color: '#555555' }}>#{rank}</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '32px', fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.03em', lineHeight: 1 }}>
                    {md ? fmtPrice(md.current_price.usd) : '—'}
                  </span>
                  {md && (
                    <span style={{ fontSize: '14px', fontWeight: 700, padding: '5px 12px', borderRadius: '8px', color: positive ? '#22c55e' : '#ef4444', background: positive ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)' }}>
                      {positive ? '▲' : '▼'} {Math.abs(md.price_change_percentage_24h).toFixed(2)}%
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right: BUY/SELL badge + action buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ padding: '10px 20px', borderRadius: '12px', background: positive ? 'rgba(34,197,94,0.10)' : 'rgba(239,68,68,0.10)', border: `1px solid ${positive ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: positive ? '#22c55e' : '#ef4444', display: 'inline-block', animation: 'alvio-pulse 1.6s ease-in-out infinite' }} />
                <span style={{ fontSize: '15px', fontWeight: 800, color: positive ? '#22c55e' : '#ef4444', letterSpacing: '0.05em' }}>{signal}</span>
              </div>
              <button onClick={() => showToast('Fonctionnalité bientôt disponible')}
                style={{ padding: '10px 18px', borderRadius: '10px', border: '1px solid #2A2A2A', background: '#1A1A1A', color: '#CCCCCC', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '6px', transition: 'background 0.15s' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#222222')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#1A1A1A')}>
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Ajouter au portefeuille
              </button>
              <button onClick={() => showToast('Fonctionnalité bientôt disponible')}
                style={{ padding: '10px 18px', borderRadius: '10px', border: 'none', background: '#2563eb', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '6px', transition: 'opacity 0.15s' }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}>
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                Créer une alerte
              </button>
            </div>
          </div>
        ) : null}

        {/* Error states */}
        {error === '__429__' && !coin && (
          <RateLimitCard context="détail de la crypto" onRetry={fetchCoin} retrySeconds={30} />
        )}
        {error && error !== '__429__' && !coin && (
          <div style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.20)', borderRadius: '12px', padding: '14px 18px', color: '#ef4444', fontSize: '13px' }}>
            ⚠ Impossible de charger {coinId} : {error}
          </div>
        )}
      </div>

      {/* CHART */}
      {coinId && (
        <div style={{ marginBottom: '20px', animation: 'fadeUp 0.35s ease 0.05s both' }}>
          <TradingChart coinId={coinId} coinName={coin?.name} coinSymbol={coin?.symbol}
            currentPrice={md?.current_price.usd} priceChange24h={md?.price_change_percentage_24h} height={600} />
        </div>
      )}

      {/* STATS ROW */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap', animation: 'fadeUp 0.35s ease 0.1s both' }}>
        {loading && !md
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonStat key={i} />)
          : md
          ? [
              { label: 'Plus haut 24h', value: fmtPrice(md.high_24h.usd),      sub: 'Maximum journalier', positive: true  },
              { label: 'Plus bas 24h',  value: fmtPrice(md.low_24h.usd),       sub: 'Minimum journalier', positive: false },
              { label: 'Volume 24h',    value: fmtLarge(md.total_volume.usd),   sub: 'USD' },
              { label: 'Market Cap',    value: fmtLarge(md.market_cap.usd),     sub: rank ? `Rang #${rank}` : undefined },
            ].map((s) => <StatCard key={s.label} {...s} />)
          : null
        }
      </div>

      {/* EXTENDED STATS */}
      {md && (
        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap', animation: 'fadeUp 0.35s ease 0.15s both' }}>
          <StatCard label="Supply en circulation" value={fmtSupply(md.circulating_supply, coin!.symbol)} />
          <StatCard label="All Time High" value={fmtPrice(md.ath.usd)} sub={`${md.ath_change_percentage.usd.toFixed(1)}% depuis l'ATH`} positive={md.ath_change_percentage.usd >= 0} />
          <StatCard label="Variation 24h" value={`${md.price_change_percentage_24h >= 0 ? '+' : ''}${md.price_change_percentage_24h.toFixed(2)}%`} positive={md.price_change_percentage_24h >= 0} />
        </div>
      )}

      {/* INFO SECTION */}
      {coin && (description || website) && (
        <div style={{ background: '#111111', border: '1px solid #1F1F1F', borderRadius: '20px', padding: '24px 28px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.4)', animation: 'fadeUp 0.35s ease 0.2s both' }}>
          <h2 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 700, color: '#FFFFFF' }}>Informations</h2>
          <div style={{ display: 'grid', gridTemplateColumns: website ? '1fr auto' : '1fr', gap: '20px', alignItems: 'start' }}>
            {description && (
              <div>
                <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.7, color: '#AAAAAA' }}>
                  {descOpen || description.length <= 280 ? description : `${description.slice(0, 280)}…`}
                </p>
                {description.length > 280 && (
                  <button onClick={() => setDescOpen((v) => !v)} style={{ marginTop: '8px', background: 'none', border: 'none', color: '#3b82f6', fontSize: '12px', fontWeight: 600, cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>
                    {descOpen ? 'Voir moins ↑' : 'Voir plus ↓'}
                  </button>
                )}
              </div>
            )}
            {website && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '160px' }}>
                {rank && (
                  <div style={{ background: '#1A1A1A', border: '1px solid #222222', borderRadius: '10px', padding: '10px 14px' }}>
                    <p style={{ margin: '0 0 2px', fontSize: '10px', fontWeight: 700, color: '#555555', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Rang CoinGecko</p>
                    <p style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#FFFFFF' }}>#{rank}</p>
                  </div>
                )}
                <a href={website} target="_blank" rel="noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', background: 'rgba(14,165,233,0.10)', border: '1px solid rgba(14,165,233,0.20)', color: '#38bdf8', fontSize: '12px', fontWeight: 600, textDecoration: 'none', transition: 'background 0.15s' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(14,165,233,0.16)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(14,165,233,0.10)')}>
                  <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                  Site officiel
                </a>
                <a href={`https://www.coingecko.com/en/coins/${coinId}`} target="_blank" rel="noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', background: 'rgba(5,150,105,0.10)', border: '1px solid rgba(5,150,105,0.20)', color: '#34d399', fontSize: '12px', fontWeight: 600, textDecoration: 'none', transition: 'background 0.15s' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(5,150,105,0.16)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(5,150,105,0.10)')}>
                  <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  CoinGecko
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FOOTER */}
      <p style={{ fontSize: '11px', color: '#444444', textAlign: 'center', marginTop: '8px' }}>
        Données :{' '}
        <a href="https://www.coingecko.com" target="_blank" rel="noreferrer" style={{ color: '#3b82f6', fontWeight: 600, textDecoration: 'none' }}>CoinGecko</a>
        {' · '}Graphique :{' '}
        <a href="https://tradingview.com/lightweight-charts" target="_blank" rel="noreferrer" style={{ color: '#3b82f6', fontWeight: 600, textDecoration: 'none' }}>TradingView Lightweight Charts</a>
      </p>

      <style>{`
        @keyframes alvio-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.3;transform:scale(0.6)} }
      `}</style>
    </AppLayout>
  );
};

export default CoinDetailPage;
