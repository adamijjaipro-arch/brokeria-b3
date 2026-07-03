import React, { useState, useEffect, useCallback } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import axios from 'axios';
import AppLayout from '../../components/layout/AppLayout';
import { marketsApi, type CoinMarketData } from '../../api';
import RateLimitCard from '../../components/common/RateLimitCard';
import Image from 'next/image';
import PageSEO from '../../components/seo/PageSEO';
import { SITE_URL } from '../../lib/seo';

type CoinMarket = CoinMarketData;

const REFRESH_MS = 90_000;

function formatPrice(price: number): string {
  if (price >= 1000) return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (price >= 1)    return `$${price.toFixed(2)}`;
  return `$${price.toFixed(6)}`;
}

function formatLarge(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9)  return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6)  return `$${(n / 1e6).toFixed(2)}M`;
  return `$${n.toLocaleString('en-US')}`;
}

function Sparkline({ prices, positive }: { prices: number[]; positive: boolean }) {
  if (!prices || prices.length < 2) return <span style={{ color: '#333333' }}>—</span>;
  const W = 80, H = 32;
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const pts = prices.map((p, i) => `${((i / (prices.length - 1)) * W).toFixed(1)},${(H - ((p - min) / range) * H).toFixed(1)}`).join(' ');
  const color = positive ? '#22c55e' : '#ef4444';
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SkeletonRow({ rank }: { rank: number }) {
  return (
    <tr>
      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
        <span style={{ fontSize: '13px', color: '#333333' }}>{rank}</span>
      </td>
      {[180, 100, 80, 120, 130, 80].map((w, i) => (
        <td key={i} style={{ padding: '14px 16px' }}>
          <div style={{
            height: '14px', width: `${w}px`, maxWidth: '100%', borderRadius: '6px',
            background: 'linear-gradient(90deg, #1A1A1A 25%, #222222 50%, #1A1A1A 75%)',
            backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite',
          }} />
        </td>
      ))}
    </tr>
  );
}

const card: React.CSSProperties = {
  backgroundColor: '#111111',
  borderRadius: '16px',
  border: '1px solid #1F1F1F',
  boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
  overflow: 'hidden',
};

const th: React.CSSProperties = {
  padding: '12px 16px',
  fontSize: '11px',
  fontWeight: 700,
  color: '#666666',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  background: '#141414',
  whiteSpace: 'nowrap',
};

const Markets: NextPage = () => {
  const router = useRouter();
  const [coins,       setCoins]       = useState<CoinMarket[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [search,      setSearch]      = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [countdown,   setCountdown]   = useState(REFRESH_MS / 1000);

  const fetchCoins = useCallback(async () => {
    try {
      const { data } = await marketsApi.getTop();
      setCoins(data); setLastUpdated(new Date()); setError(null); setCountdown(REFRESH_MS / 1000);
    } catch (e) {
      setError(axios.isAxiosError(e) && e.response?.status === 429 ? '__429__' : e instanceof Error ? e.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCoins();
    const id = setInterval(fetchCoins, REFRESH_MS);
    return () => clearInterval(id);
  }, [fetchCoins]);

  useEffect(() => {
    if (loading) return;
    const id = setInterval(() => setCountdown((c) => (c <= 1 ? REFRESH_MS / 1000 : c - 1)), 1000);
    return () => clearInterval(id);
  }, [loading]);

  const filtered = coins.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.symbol.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <AppLayout title="Marchés" subtitle="Données de marché en temps réel · Top 20 par capitalisation">
      <PageSEO
        title="Marchés Crypto — Alvio"
        description="Marchés crypto Alvio. Analysez les prix BTC, ETH, SOL et 50+ altcoins en temps réel avec volumes, capitalisations et signaux IA intégrés."
        canonical={`${SITE_URL}/markets`}
        ogImage={`${SITE_URL}/og-markets.png`}
        noindex={false}
      />
      <Head><title>Marchés Crypto — Alvio</title></Head>
      <style>{`
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes pulse-dot { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.3; transform: scale(0.7); } }
      `}</style>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: '360px' }}>
          <svg style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#555555', pointerEvents: 'none' }}
            width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text" placeholder="Rechercher une crypto..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '10px 12px 10px 36px', border: '1px solid #1F1F1F', borderRadius: '12px', fontSize: '14px', color: '#FFFFFF', background: '#1A1A1A', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
          />
        </div>

        {/* LIVE badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#1A1A1A', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '12px', padding: '8px 14px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', display: 'inline-block', animation: 'pulse-dot 1.4s ease-in-out infinite' }} />
          <span style={{ fontSize: '12px', fontWeight: 800, color: '#ef4444', letterSpacing: '0.08em' }}>LIVE</span>
        </div>

        {/* Last update */}
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          {lastUpdated && (
            <p style={{ margin: 0, fontSize: '12px', color: '#888888' }}>
              Dernière MAJ : <strong style={{ color: '#CCCCCC' }}>{lastUpdated.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</strong>
            </p>
          )}
          {!loading && <p style={{ margin: 0, fontSize: '11px', color: '#555555' }}>Prochain rafraîchissement dans {countdown}s</p>}
        </div>
      </div>

      {/* Error */}
      {error === '__429__' && (
        <div style={{ marginBottom: '16px' }}>
          <RateLimitCard context="marchés" onRetry={fetchCoins} retrySeconds={30} />
        </div>
      )}
      {error && error !== '__429__' && (
        <div style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.20)', borderRadius: '12px', padding: '12px 16px', marginBottom: '16px', fontSize: '13px', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {error}
        </div>
      )}

      {/* Table */}
      <div style={card}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1F1F1F' }}>
              <th style={{ ...th, textAlign: 'center', width: '40px' }}>#</th>
              <th style={th}>Nom</th>
              <th style={th}>Prix</th>
              <th style={th}>Var. 24h</th>
              <th style={th}>Volume 24h</th>
              <th style={th}>Market Cap</th>
              <th style={th}>7 jours</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 12 }).map((_, i) => <SkeletonRow key={i} rank={i + 1} />)
              : filtered.map((coin, idx) => {
                  const positive = coin.price_change_percentage_24h >= 0;
                  return (
                    <tr key={coin.id} onClick={() => router.push(`/markets/${coin.id}`)}
                      style={{ borderBottom: '1px solid #141414', cursor: 'pointer', transition: 'background 0.1s' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(37,99,235,0.06)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '14px 16px', textAlign: 'center', fontSize: '13px', color: '#444444', fontWeight: 600 }}>{idx + 1}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <Image src={coin.image} alt={coin.name} width={32} height={32} style={{ borderRadius: '50%', flexShrink: 0 }} />
                          <div>
                            <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.3 }}>{coin.name}</p>
                            <p style={{ margin: 0, fontSize: '11px', color: '#555555', textTransform: 'uppercase', fontWeight: 600 }}>{coin.symbol}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: 700, color: '#FFFFFF', whiteSpace: 'nowrap' }}>
                        {formatPrice(coin.current_price)}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '13px', fontWeight: 700, color: positive ? '#22c55e' : '#ef4444', background: positive ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)', padding: '3px 10px', borderRadius: '20px', whiteSpace: 'nowrap' }}>
                          {positive ? '▲' : '▼'}{Math.abs(coin.price_change_percentage_24h).toFixed(2)}%
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '13px', color: '#888888', fontWeight: 500, whiteSpace: 'nowrap' }}>{formatLarge(coin.total_volume)}</td>
                      <td style={{ padding: '14px 16px', fontSize: '13px', color: '#888888', fontWeight: 500, whiteSpace: 'nowrap' }}>{formatLarge(coin.market_cap)}</td>
                      <td style={{ padding: '14px 16px' }}><Sparkline prices={coin.sparkline_in_7d?.price ?? []} positive={positive} /></td>
                    </tr>
                  );
                })}
          </tbody>
        </table>
        {!loading && filtered.length === 0 && (
          <div style={{ padding: '48px', textAlign: 'center', color: '#555555', fontSize: '14px' }}>
            Aucune crypto ne correspond à &ldquo;{search}&rdquo;
          </div>
        )}
      </div>

      <p style={{ marginTop: '12px', fontSize: '12px', color: '#444444', textAlign: 'center' }}>
        Données fournies par{' '}
        <a href="https://www.coingecko.com" target="_blank" rel="noreferrer" style={{ color: '#3b82f6', fontWeight: 600, textDecoration: 'none' }}>CoinGecko</a>
        {' '}· API publique gratuite · Limite : 10–30 req/min
      </p>
    </AppLayout>
  );
};

export default Markets;
