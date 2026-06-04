import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import type { IChartApi, ISeriesApi, UTCTimestamp } from 'lightweight-charts';
import AppLayout from '../../components/layout/AppLayout';

// ── Types ────────────────────────────────────────────────────────────────────

interface CoinDetail {
  id: string;
  name: string;
  symbol: string;
  image: { large: string; small: string };
  market_data: {
    current_price: { usd: number };
    price_change_percentage_24h: number;
    high_24h: { usd: number };
    low_24h: { usd: number };
    total_volume: { usd: number };
    market_cap: { usd: number };
    circulating_supply: number;
    ath: { usd: number };
  };
}

type OhlcRow = [number, number, number, number, number];

interface CandleBar {
  time: UTCTimestamp;
  open: number;
  high: number;
  low: number;
  close: number;
}

const TIMEFRAMES = [
  { label: '1H', days: 1 },
  { label: '4H', days: 7 },
  { label: '1J', days: 14 },
  { label: '1S', days: 30 },
  { label: '1M', days: 90 },
] as const;

type TfLabel = (typeof TIMEFRAMES)[number]['label'];

// ── Formatters ───────────────────────────────────────────────────────────────

function fmtPrice(p: number): string {
  if (p >= 1000)
    return `$${p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (p >= 1) return `$${p.toFixed(4)}`;
  return `$${p.toFixed(8)}`;
}

function fmtLarge(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  return `$${n.toLocaleString('en-US')}`;
}

function fmtSupply(n: number, symbol: string): string {
  const v =
    n >= 1e9
      ? `${(n / 1e9).toFixed(2)}B`
      : n >= 1e6
      ? `${(n / 1e6).toFixed(2)}M`
      : n >= 1e3
      ? `${(n / 1e3).toFixed(0)}K`
      : n.toFixed(0);
  return `${v} ${symbol.toUpperCase()}`;
}

// ── Chart helpers ────────────────────────────────────────────────────────────

function buildBars(raw: OhlcRow[]): CandleBar[] {
  const seen = new Set<number>();
  return raw
    .filter(([t]) => {
      const s = Math.floor(t / 1000);
      if (seen.has(s)) return false;
      seen.add(s);
      return true;
    })
    .map(([t, o, h, l, c]) => ({
      time: Math.floor(t / 1000) as unknown as UTCTimestamp,
      open: o,
      high: h,
      low: l,
      close: c,
    }))
    .sort((a, b) => (a.time as unknown as number) - (b.time as unknown as number));
}

// ── Skeleton components ──────────────────────────────────────────────────────

function SkeletonBox({ w, h, radius = 8 }: { w: number | string; h: number; radius?: number }) {
  return (
    <div
      style={{
        width: typeof w === 'number' ? `${w}px` : w,
        height: `${h}px`,
        borderRadius: `${radius}px`,
        background: 'linear-gradient(90deg, #e5e7eb 25%, #d1d5db 50%, #e5e7eb 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
      }}
    />
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

const CoinDetailPage: NextPage = () => {
  const router = useRouter();
  const coinId = typeof router.query.id === 'string' ? router.query.id : null;

  const [coin, setCoin] = useState<CoinDetail | null>(null);
  const [ohlcData, setOhlcData] = useState<CandleBar[]>([]);
  const [timeframe, setTimeframe] = useState<TfLabel>('1J');
  const [loadingCoin, setLoadingCoin] = useState(true);
  const [loadingChart, setLoadingChart] = useState(true);
  const [chartError, setChartError] = useState<string | null>(null);
  const [coinError, setCoinError] = useState<string | null>(null);

  // Chart refs — IChartApi / ISeriesApi imported as types only (no SSR issues)
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  // Ref mirror so chart init can access latest data even before the effect fires
  const ohlcRef = useRef<CandleBar[]>([]);

  // ── Reset when navigating to a different coin ──────────────────────────────
  useEffect(() => {
    if (!coinId) return;
    setCoin(null);
    setOhlcData([]);
    ohlcRef.current = [];
    setLoadingCoin(true);
    setLoadingChart(true);
    setCoinError(null);
    setChartError(null);
  }, [coinId]);

  // ── Fetch coin detail ──────────────────────────────────────────────────────
  const fetchCoin = useCallback(async () => {
    if (!coinId) return;
    try {
      const r = await fetch(`/api/coingecko/coins/${coinId}`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setCoin((await r.json()) as CoinDetail);
      setCoinError(null);
    } catch (e) {
      setCoinError(e instanceof Error ? e.message : 'Erreur réseau');
    } finally {
      setLoadingCoin(false);
    }
  }, [coinId]);

  useEffect(() => {
    fetchCoin();
    const id = setInterval(fetchCoin, 90_000); // 90 s — aligné sur le cache serveur
    return () => clearInterval(id);
  }, [fetchCoin]);

  // ── Fetch OHLC ────────────────────────────────────────────────────────────
  const fetchOhlc = useCallback(async () => {
    if (!coinId) return;
    const days = TIMEFRAMES.find((t) => t.label === timeframe)?.days ?? 14;
    setLoadingChart(true);
    try {
      const r = await fetch(`/api/coingecko/ohlc/${coinId}?days=${days}`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const raw = (await r.json()) as OhlcRow[];
      setOhlcData(buildBars(raw));
      setChartError(null);
    } catch (e) {
      setChartError(e instanceof Error ? e.message : 'Impossible de charger les données OHLC');
    } finally {
      setLoadingChart(false);
    }
  }, [coinId, timeframe]);

  useEffect(() => {
    fetchOhlc();
  }, [fetchOhlc]);

  // ── Chart init — runs once on mount, client-side only ─────────────────────
  useEffect(() => {
    if (!containerRef.current) return;
    let instance: IChartApi | null = null;

    (async () => {
      if (!containerRef.current) return;

      const lw = await import('lightweight-charts');

      instance = lw.createChart(containerRef.current, {
        width: containerRef.current.clientWidth,
        height: 420,
        layout: {
          background: { type: lw.ColorType.Solid, color: '#0d1117' },
          textColor: '#9ca3af',
          fontFamily: "'Inter', sans-serif",
        },
        grid: {
          vertLines: { color: '#161b22' },
          horzLines: { color: '#161b22' },
        },
        crosshair: {
          vertLine: { color: '#4b5563', labelBackgroundColor: '#1f2937' },
          horzLine: { color: '#4b5563', labelBackgroundColor: '#1f2937' },
        },
        rightPriceScale: {
          borderColor: '#1f2937',
          scaleMargins: { top: 0.08, bottom: 0.08 },
        },
        timeScale: {
          borderColor: '#1f2937',
          timeVisible: true,
          secondsVisible: false,
        },
        handleScroll: { mouseWheel: true, pressedMouseMove: true },
        handleScale: { mouseWheel: true, pinch: true },
      });

      const series = instance.addCandlestickSeries({
        upColor: '#10b981',
        downColor: '#ef4444',
        borderUpColor: '#10b981',
        borderDownColor: '#ef4444',
        wickUpColor: '#10b981',
        wickDownColor: '#ef4444',
      });

      chartRef.current = instance;
      seriesRef.current = series;

      // Apply data that may have loaded before the chart was ready
      if (ohlcRef.current.length > 0) {
        series.setData(ohlcRef.current);
        instance.timeScale().fitContent();
      }
    })();

    const onResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: containerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      instance?.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Push data into chart whenever ohlcData changes ────────────────────────
  useEffect(() => {
    ohlcRef.current = ohlcData;
    if (!seriesRef.current || ohlcData.length === 0) return;
    seriesRef.current.setData(ohlcData);
    chartRef.current?.timeScale().fitContent();
  }, [ohlcData]);

  // ── Derived values ────────────────────────────────────────────────────────
  const positive = (coin?.market_data.price_change_percentage_24h ?? 0) >= 0;

  const metrics = coin
    ? [
        { label: 'Plus haut 24h', value: fmtPrice(coin.market_data.high_24h.usd) },
        { label: 'Plus bas 24h', value: fmtPrice(coin.market_data.low_24h.usd) },
        { label: 'Volume 24h', value: fmtLarge(coin.market_data.total_volume.usd) },
        { label: 'Market Cap', value: fmtLarge(coin.market_data.market_cap.usd) },
        { label: 'Supply en circ.', value: fmtSupply(coin.market_data.circulating_supply, coin.symbol) },
        { label: 'All Time High', value: fmtPrice(coin.market_data.ath.usd) },
      ]
    : [];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <AppLayout>
      <Head>
        <title>{coin ? `${coin.name} (${coin.symbol.toUpperCase()}) — TradingAI` : 'Chargement… — TradingAI'}</title>
      </Head>

      <style>{`
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.3; transform: scale(0.7); }
        }
      `}</style>

      {/* ── Back ────────────────────────────────────────────────── */}
      <button
        onClick={() => router.back()}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          background: 'none', border: 'none', padding: 0, marginBottom: '20px',
          color: '#6b7280', fontSize: '14px', fontWeight: 600,
          cursor: 'pointer', fontFamily: 'inherit',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = '#111827')}
        onMouseLeave={(e) => (e.currentTarget.style.color = '#6b7280')}
      >
        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        ← Marchés
      </button>

      {/* ── Header ──────────────────────────────────────────────── */}
      {loadingCoin ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
          <SkeletonBox w={52} h={52} radius={26} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <SkeletonBox w={180} h={28} />
            <SkeletonBox w={240} h={40} />
          </div>
        </div>
      ) : coin ? (
        <div
          style={{
            display: 'flex', alignItems: 'flex-start',
            justifyContent: 'space-between', flexWrap: 'wrap',
            gap: '16px', marginBottom: '24px',
          }}
        >
          {/* Left: logo + name + price */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={coin.image.large}
              alt={coin.name}
              width={56}
              height={56}
              style={{ borderRadius: '50%', flexShrink: 0 }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                <h1
                  style={{
                    margin: 0, fontSize: '24px', fontWeight: 800, color: '#111827',
                    fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif", lineHeight: 1.2,
                  }}
                >
                  {coin.name}
                </h1>
                <span
                  style={{
                    fontSize: '12px', fontWeight: 700, color: '#6b7280',
                    background: '#f3f4f6', padding: '3px 10px',
                    borderRadius: '20px', textTransform: 'uppercase',
                  }}
                >
                  {coin.symbol}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span
                  style={{
                    fontSize: '34px', fontWeight: 800, color: '#111827', lineHeight: 1,
                    fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                  }}
                >
                  {fmtPrice(coin.market_data.current_price.usd)}
                </span>
                <span
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                    fontSize: '15px', fontWeight: 700,
                    color: positive ? '#10b981' : '#ef4444',
                    background: positive ? '#f0fdf4' : '#fef2f2',
                    padding: '5px 12px', borderRadius: '20px',
                  }}
                >
                  {positive ? '▲' : '▼'}
                  {Math.abs(coin.market_data.price_change_percentage_24h).toFixed(2)}%
                  <span style={{ fontWeight: 400, fontSize: '12px', opacity: 0.7 }}>24h</span>
                </span>
              </div>
            </div>
          </div>

          {/* Right: LIVE badge */}
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: '8px', alignSelf: 'center',
              background: 'white', border: '1px solid #fecaca',
              borderRadius: '12px', padding: '8px 14px',
            }}
          >
            <span
              style={{
                width: '8px', height: '8px', borderRadius: '50%',
                background: '#ef4444', display: 'inline-block',
                animation: 'pulse-dot 1.4s ease-in-out infinite',
              }}
            />
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#ef4444', letterSpacing: '0.08em' }}>
              LIVE
            </span>
            <span style={{ fontSize: '11px', color: '#9ca3af' }}>MAJ 30s</span>
          </div>
        </div>
      ) : coinError ? (
        <div
          style={{
            background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px',
            padding: '16px', marginBottom: '24px', color: '#dc2626', fontSize: '14px',
          }}
        >
          ⚠️ Impossible de charger {coinId} : {coinError}
        </div>
      ) : null}

      {/* ── Chart card ──────────────────────────────────────────── */}
      <div
        style={{
          backgroundColor: '#0d1117', borderRadius: '16px',
          overflow: 'hidden', marginBottom: '20px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
        }}
      >
        {/* Toolbar: timeframes */}
        <div
          style={{
            display: 'flex', alignItems: 'center',
            padding: '12px 20px', borderBottom: '1px solid #161b22', gap: '6px',
          }}
        >
          <span style={{ fontSize: '11px', color: '#4b5563', fontWeight: 700, marginRight: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Période
          </span>
          {TIMEFRAMES.map(({ label }) => (
            <button
              key={label}
              onClick={() => setTimeframe(label)}
              style={{
                padding: '5px 14px', borderRadius: '8px', border: 'none',
                cursor: 'pointer', fontSize: '13px', fontWeight: 700,
                fontFamily: 'inherit',
                background: timeframe === label ? '#2563eb' : '#161b22',
                color: timeframe === label ? '#ffffff' : '#4b5563',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => { if (timeframe !== label) e.currentTarget.style.color = '#9ca3af'; }}
              onMouseLeave={(e) => { if (timeframe !== label) e.currentTarget.style.color = '#4b5563'; }}
            >
              {label}
            </button>
          ))}
          {loadingChart && (
            <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#4b5563', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4b5563" strokeWidth="2.5">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" />
              </svg>
              Chargement…
            </span>
          )}
        </div>

        {/* Chart error inside card */}
        {chartError && (
          <div style={{ padding: '16px 20px', background: 'rgba(239,68,68,0.1)', borderBottom: '1px solid #1f2937', color: '#ef4444', fontSize: '13px' }}>
            ⚠️ {chartError} — CoinGecko peut limiter les requêtes (rate limit).
          </div>
        )}

        {/* Wrapper: position relative so the overlay can sit on top */}
        <div style={{ position: 'relative' }}>
          {/* Actual chart mount point */}
          <div ref={containerRef} style={{ width: '100%', minHeight: '420px' }} />

          {/* Loading overlay while waiting for first data */}
          {loadingChart && ohlcData.length === 0 && (
            <div
              style={{
                position: 'absolute', inset: 0, zIndex: 10,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: '12px',
                background: '#0d1117',
              }}
            >
              {/* Animated candlestick placeholder */}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '80px' }}>
                {[40, 65, 50, 80, 55, 70, 45, 90, 60, 75].map((h, i) => (
                  <div
                    key={i}
                    style={{
                      width: '12px', height: `${h}%`,
                      background: i % 3 === 0 ? '#ef4444' : '#10b981',
                      borderRadius: '3px', opacity: 0.3,
                      animation: `pulse-dot ${1 + i * 0.1}s ease-in-out infinite`,
                    }}
                  />
                ))}
              </div>
              <span style={{ color: '#4b5563', fontSize: '14px', fontWeight: 500 }}>
                Chargement des chandeliers…
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Metrics grid ────────────────────────────────────────── */}
      {loadingCoin ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.07)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <SkeletonBox w={100} h={12} />
              <SkeletonBox w={140} h={22} />
            </div>
          ))}
        </div>
      ) : metrics.length > 0 ? (
        <div
          style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '12px', marginBottom: '20px',
          }}
        >
          {metrics.map(({ label, value }) => (
            <div
              key={label}
              style={{
                backgroundColor: 'white', borderRadius: '16px',
                padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
              }}
            >
              <p
                style={{
                  margin: '0 0 6px', fontSize: '11px', fontWeight: 700,
                  color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em',
                }}
              >
                {label}
              </p>
              <p style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#111827' }}>
                {value}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      {/* ── Footer ──────────────────────────────────────────────── */}
      <p style={{ marginTop: '8px', fontSize: '12px', color: '#9ca3af', textAlign: 'center' }}>
        Données :{' '}
        <a href="https://www.coingecko.com" target="_blank" rel="noreferrer"
          style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>
          CoinGecko
        </a>
        {' · '}
        Graphique :{' '}
        <a href="https://tradingview.com/lightweight-charts" target="_blank" rel="noreferrer"
          style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>
          TradingView Lightweight Charts
        </a>
      </p>
    </AppLayout>
  );
};

export default CoinDetailPage;
