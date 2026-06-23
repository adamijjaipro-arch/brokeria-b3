import React, { useState, useEffect, useRef, useCallback } from 'react';
import type {
  IChartApi,
  ISeriesApi,
  UTCTimestamp,
  MouseEventParams,
  Time,
} from 'lightweight-charts';
import axios from 'axios';
import api, {
  type OhlcApiResponse,
  type ChartMode,
  type CoinDetailData,
} from '../../api';
import RateLimitCard from '../common/RateLimitCard';

// ── Types ─────────────────────────────────────────────────────────────────────

export type Timeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1J' | '1S' | '1M';

interface CandleBar { time: UTCTimestamp; open: number; high: number; low: number; close: number }
interface LineBar    { time: UTCTimestamp; value: number }
interface HoveredCandle { time: string; open: number; high: number; low: number; close: number }
interface CandleShape { time: Time; open: number; high: number; low: number; close: number }
interface LineShape   { time: Time; value: number }

function isCandleShape(v: unknown): v is CandleShape {
  return typeof v === 'object' && v !== null && 'open' in v && 'high' in v && 'low' in v && 'close' in v;
}
function isLineShape(v: unknown): v is LineShape {
  return typeof v === 'object' && v !== null && 'value' in v && !('open' in v);
}

export interface TradingChartProps {
  coinId:          string;
  coinName?:       string;
  coinSymbol?:     string;
  currentPrice?:   number;
  priceChange24h?: number;
  height?:         number;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const CHART_HEIGHT = 600;
const TIMEFRAMES: Timeframe[] = ['1m', '5m', '15m', '1h', '4h', '1J', '1S', '1M'];
const TF_DAYS: Record<Timeframe, number> = {
  '1m': 1, '5m': 1, '15m': 1, '1h': 7, '4h': 30, '1J': 90, '1S': 180, '1M': 365,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function dedupe<T extends { time: UTCTimestamp }>(arr: T[]): T[] {
  const seen = new Set<number>();
  return arr
    .filter(({ time }) => { const t = time as number; if (seen.has(t)) return false; seen.add(t); return true; })
    .sort((a, b) => (a.time as number) - (b.time as number));
}

function parseCandleBars(raw: number[][]): CandleBar[] {
  return dedupe((raw as [number, number, number, number, number][]).map(([t, o, h, l, c]) => ({
    time: Math.floor(t / 1_000) as UTCTimestamp, open: o, high: h, low: l, close: c,
  })));
}

function parseLineBars(raw: number[][]): LineBar[] {
  return dedupe((raw as [number, number][]).map(([t, p]) => ({
    time: Math.floor(t / 1_000) as UTCTimestamp, value: p,
  })));
}

function fmtPrice(p: number): string {
  if (p >= 1_000) return `$${p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (p >= 1)     return `$${p.toFixed(4)}`;
  return `$${p.toFixed(8)}`;
}

function fmtTimestamp(t: UTCTimestamp): string {
  return new Date((t as number) * 1_000).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit',
  });
}

// ── Component ─────────────────────────────────────────────────────────────────

const TradingChart: React.FC<TradingChartProps> = ({
  coinId,
  coinName    = coinId,
  coinSymbol  = '',
  currentPrice,
  priceChange24h,
  height      = CHART_HEIGHT,
}) => {
  const [timeframe,     setTimeframe]     = useState<Timeframe>('1h');
  const [chartMode,     setChartMode]     = useState<ChartMode>('candle');
  const [candleBars,    setCandleBars]    = useState<CandleBar[]>([]);
  const [lineBars,      setLineBars]      = useState<LineBar[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [chartReady,    setChartReady]    = useState(false);
  const [fetchError,    setFetchError]    = useState<string | null>(null);
  const [noData,        setNoData]        = useState(false);
  const [rateLimited,   setRateLimited]   = useState(false);
  const [hoveredCandle, setHoveredCandle] = useState<HoveredCandle | null>(null);
  const [hoveredPrice,  setHoveredPrice]  = useState<number | null>(null);
  const [livePrice,     setLivePrice]     = useState<number | undefined>(currentPrice);
  const [liveChange,    setLiveChange]    = useState<number | undefined>(priceChange24h);

  const containerRef    = useRef<HTMLDivElement>(null);
  const chartRef        = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const lineSeriesRef   = useRef<ISeriesApi<'Line'> | null>(null);
  const candleBarsRef   = useRef<CandleBar[]>([]);
  const lineBarsRef     = useRef<LineBar[]>([]);
  const chartModeRef    = useRef<ChartMode>('candle');
  const chartInitRef    = useRef(false); // guard against StrictMode double-init

  // ── 1. Reset on coin change ────────────────────────────────────────────────
  useEffect(() => {
    setCandleBars([]);
    setLineBars([]);
    candleBarsRef.current = [];
    lineBarsRef.current   = [];
    setHoveredCandle(null);
    setHoveredPrice(null);
    setNoData(false);
    setFetchError(null);
    setRateLimited(false);
    candleSeriesRef.current?.setData([]);
    lineSeriesRef.current?.setData([]);
  }, [coinId]);

  // ── 2. Fetch OHLC ─────────────────────────────────────────────────────────
  const fetchOhlc = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    setNoData(false);
    setRateLimited(false);
    try {
      const days           = TF_DAYS[timeframe];
      const { data: json } = await api.get<OhlcApiResponse>(`/markets/ohlcv/${coinId}`, { params: { days } });

      if (!json.data || json.data.length === 0) {
        setNoData(true);
        setCandleBars([]);
        setLineBars([]);
        candleBarsRef.current = [];
        lineBarsRef.current   = [];
        setChartMode('line');
        chartModeRef.current  = 'line';
        return;
      }
      if (json.mode === 'candle') {
        const bars            = parseCandleBars(json.data);
        candleBarsRef.current = bars;
        setCandleBars(bars);
        setChartMode('candle');
        chartModeRef.current = 'candle';
      } else {
        const bars          = parseLineBars(json.data);
        lineBarsRef.current = bars;
        setLineBars(bars);
        setChartMode('line');
        chartModeRef.current = 'line';
      }
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 429) {
        setRateLimited(true);
      } else {
        setFetchError(err instanceof Error ? err.message : 'Erreur inconnue');
      }
    } finally {
      setLoading(false);
    }
  }, [coinId, timeframe]);

  useEffect(() => {
    void fetchOhlc();
    const id = setInterval(() => { void fetchOhlc(); }, 30_000);
    return () => clearInterval(id);
  }, [fetchOhlc]);

  // ── 3. Refresh live price ─────────────────────────────────────────────────
  const fetchPrice = useCallback(async () => {
    try {
      const { data } = await api.get<CoinDetailData>(`/markets/detail/${coinId}`);
      setLivePrice(data.market_data.current_price.usd);
      setLiveChange(data.market_data.price_change_percentage_24h);
    } catch { /* keep last known values */ }
  }, [coinId]);

  useEffect(() => {
    void fetchPrice();
    const id = setInterval(() => { void fetchPrice(); }, 30_000);
    return () => clearInterval(id);
  }, [fetchPrice]);

  // ── 4. Sync parent props ──────────────────────────────────────────────────
  useEffect(() => { if (currentPrice   !== undefined) setLivePrice(currentPrice); },   [currentPrice]);
  useEffect(() => { if (priceChange24h !== undefined) setLiveChange(priceChange24h); }, [priceChange24h]);

  // ── 5. Create chart ONCE ──────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || chartInitRef.current) return;
    chartInitRef.current = true;
    const container = containerRef.current;

    let chart: IChartApi | null = null;
    let ro: ResizeObserver | null = null;

    (async () => {
      const { createChart, ColorType, CrosshairMode } = await import('lightweight-charts');

      // Guard: component may have unmounted during the async import
      if (!containerRef.current) { chartInitRef.current = false; return; }

      chart = createChart(container, {
        width:  container.clientWidth,
        height, // fixed height prop (600 by default)
        layout: {
          background: { type: ColorType.Solid, color: '#0d1117' },
          textColor:  '#94a3b8',
          fontFamily: "'Inter', 'Segoe UI', sans-serif",
          fontSize:   12,
        },
        grid: {
          vertLines: { color: 'rgba(255,255,255,0.04)' },
          horzLines: { color: 'rgba(255,255,255,0.04)' },
        },
        crosshair: {
          mode: CrosshairMode.Normal,
          vertLine: { color: 'rgba(255,255,255,0.3)', labelBackgroundColor: '#1e293b', width: 1, style: 2 },
          horzLine: { color: 'rgba(255,255,255,0.3)', labelBackgroundColor: '#1e293b', width: 1, style: 2 },
        },
        rightPriceScale: { borderColor: 'rgba(255,255,255,0.08)', scaleMargins: { top: 0.06, bottom: 0.06 }, autoScale: true },
        timeScale:        { borderColor: 'rgba(255,255,255,0.08)', timeVisible: true, secondsVisible: false },
        handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: false },
        handleScale:  { mouseWheel: true, pinch: true, axisPressedMouseMove: true },
      });

      const candles = chart.addCandlestickSeries({
        upColor: '#26a69a', downColor: '#ef5350',
        borderUpColor: '#26a69a', borderDownColor: '#ef5350',
        wickUpColor:   '#26a69a', wickDownColor:   '#ef5350',
      });
      const line = chart.addLineSeries({
        color: '#6366f1', lineWidth: 2,
        crosshairMarkerVisible: true, crosshairMarkerRadius: 5,
        crosshairMarkerBorderColor: '#6366f1', crosshairMarkerBackgroundColor: '#0d1117',
        visible: false,
      });

      chartRef.current        = chart;
      candleSeriesRef.current = candles;
      lineSeriesRef.current   = line;
      setChartReady(true);

      // Push data that arrived before async init completed
      const mode = chartModeRef.current;
      if (mode === 'candle' && candleBarsRef.current.length > 0) {
        candles.setData(candleBarsRef.current);
        chart.timeScale().fitContent();
      } else if (mode === 'line' && lineBarsRef.current.length > 0) {
        candles.applyOptions({ visible: false });
        line.applyOptions({ visible: true });
        line.setData(lineBarsRef.current);
        chart.timeScale().fitContent();
      }

      // Crosshair listener
      chart.subscribeCrosshairMove((param: MouseEventParams) => {
        if (!param.time) { setHoveredCandle(null); setHoveredPrice(null); return; }
        if (chartModeRef.current === 'candle' && candleSeriesRef.current) {
          const raw = param.seriesData.get(candleSeriesRef.current);
          if (isCandleShape(raw)) {
            setHoveredCandle({ time: fmtTimestamp(param.time as UTCTimestamp), open: raw.open, high: raw.high, low: raw.low, close: raw.close });
          } else { setHoveredCandle(null); }
        } else if (chartModeRef.current === 'line' && lineSeriesRef.current) {
          const raw = param.seriesData.get(lineSeriesRef.current);
          if (isLineShape(raw)) setHoveredPrice(raw.value);
          else setHoveredPrice(null);
        }
      });

      // ResizeObserver — more reliable than window 'resize'
      ro = new ResizeObserver(() => {
        if (!containerRef.current || !chartRef.current) return;
        chartRef.current.applyOptions({ width: containerRef.current.clientWidth });
      });
      ro.observe(container);
    })();

    return () => {
      ro?.disconnect();
      chart?.remove();
      chartRef.current        = null;
      candleSeriesRef.current = null;
      lineSeriesRef.current   = null;
      chartInitRef.current    = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 6. Push data when state changes ──────────────────────────────────────
  useEffect(() => {
    const c = candleSeriesRef.current;
    const l = lineSeriesRef.current;
    if (!c || !l) return;
    if (chartMode === 'candle' && candleBars.length > 0) {
      l.applyOptions({ visible: false });
      c.applyOptions({ visible: true });
      c.setData(candleBars);
      chartRef.current?.timeScale().fitContent();
    } else if (chartMode === 'line' && lineBars.length > 0) {
      c.applyOptions({ visible: false });
      l.applyOptions({ visible: true });
      l.setData(lineBars);
      chartRef.current?.timeScale().fitContent();
    }
  }, [chartMode, candleBars, lineBars]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const positive   = (liveChange ?? 0) >= 0;
  const lastCandle = candleBars[candleBars.length - 1] ?? null;
  const lastLine   = lineBars[lineBars.length - 1] ?? null;
  const hasData    = chartMode === 'candle' ? candleBars.length > 0 : lineBars.length > 0;
  const displayCandle: HoveredCandle | null = hoveredCandle ?? (lastCandle
    ? { time: fmtTimestamp(lastCandle.time), open: lastCandle.open, high: lastCandle.high, low: lastCandle.low, close: lastCandle.close }
    : null);
  const displayPrice: number | null = hoveredPrice ?? lastLine?.value ?? null;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ background: '#0d1117', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden', fontFamily: "'Inter','Segoe UI',sans-serif", boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>

      {/* HEADER */}
      <div style={{ padding: '16px 20px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>

          {/* Left — name + price */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>{coinName}</span>
              {coinSymbol && (
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#475569', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {coinSymbol}
                </span>
              )}
              <span style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '2px 7px', borderRadius: '4px', background: chartMode === 'candle' ? 'rgba(38,166,154,0.15)' : 'rgba(99,102,241,0.15)', color: chartMode === 'candle' ? '#26a69a' : '#6366f1', border: chartMode === 'candle' ? '1px solid rgba(38,166,154,0.3)' : '1px solid rgba(99,102,241,0.3)' }}>
                {chartMode === 'candle' ? 'OHLCV' : 'Prix'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '28px', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.02em', lineHeight: 1 }}>
                {livePrice !== undefined ? fmtPrice(livePrice) : '—'}
              </span>
              {liveChange !== undefined && (
                <span style={{ fontSize: '12px', fontWeight: 700, padding: '4px 10px', borderRadius: '6px', color: positive ? '#26a69a' : '#ef5350', background: positive ? 'rgba(38,166,154,0.15)' : 'rgba(239,83,80,0.15)' }}>
                  {positive ? '▲' : '▼'} {Math.abs(liveChange).toFixed(2)}%
                </span>
              )}
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10px', fontWeight: 700, color: '#475569' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#26a69a', display: 'inline-block', animation: 'alvio-pulse 1.6s ease-in-out infinite' }} />
                LIVE
              </span>
            </div>
          </div>

          {/* Right — OHLCV tooltip */}
          {chartMode === 'candle' && displayCandle && (
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', paddingTop: '4px' }}>
              {hoveredCandle && <span style={{ fontSize: '10px', color: '#334155', borderRight: '1px solid rgba(255,255,255,0.06)', paddingRight: '14px' }}>{hoveredCandle.time}</span>}
              {([['O', 'open', '#94a3b8'], ['H', 'high', '#26a69a'], ['L', 'low', '#ef5350'], ['C', 'close', '#f1f5f9']] as const).map(([label, key, color]) => (
                <div key={key}>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#475569', marginRight: '4px' }}>{label}</span>
                  <span style={{ fontSize: '12px', fontWeight: 600, color }}>{fmtPrice(displayCandle[key])}</span>
                </div>
              ))}
            </div>
          )}
          {chartMode === 'line' && displayPrice !== null && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '8px' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#475569' }}>Prix</span>
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#6366f1' }}>{fmtPrice(displayPrice)}</span>
            </div>
          )}
        </div>

        {/* Timeframe buttons */}
        <div style={{ display: 'flex', gap: '2px', overflowX: 'auto', paddingBottom: '12px', scrollbarWidth: 'none' }}>
          {TIMEFRAMES.map((tf) => {
            const active = tf === timeframe;
            return (
              <button key={tf} onClick={() => setTimeframe(tf)} style={{ padding: '5px 13px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 700, fontFamily: 'inherit', whiteSpace: 'nowrap', transition: 'all 0.15s', background: active ? '#2563eb' : 'transparent', color: active ? '#ffffff' : '#475569' }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = '#94a3b8'; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = '#475569'; }}>
                {tf}
              </button>
            );
          })}
          {loading && (
            <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#334155', paddingRight: '4px', flexShrink: 0 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'alvio-spin 0.8s linear infinite' }}>
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" />
              </svg>
              Chargement
            </span>
          )}
        </div>
      </div>

      {/* CHART AREA */}
      <div style={{ position: 'relative' }}>
        {fetchError && (
          <div style={{ padding: '8px 20px', background: 'rgba(239,83,80,0.1)', borderBottom: '1px solid rgba(239,83,80,0.2)', fontSize: '12px', color: '#ef5350' }}>
            ⚠ {fetchError}
          </div>
        )}
        {!loading && chartMode === 'line' && lineBars.length > 0 && (
          <div style={{ padding: '6px 20px', background: 'rgba(99,102,241,0.08)', borderBottom: '1px solid rgba(99,102,241,0.15)', fontSize: '11px', color: '#6366f1', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>ℹ</span> Données OHLCV non disponibles — affichage du prix en ligne simple
          </div>
        )}

        {/* Canvas mount — fixed height so CSS and JS always agree */}
        <div ref={containerRef} style={{ width: '100%', height: `${height}px` }} />

        {/* Loading skeleton — shown until canvas is init'd AND first data is ready */}
        {(!chartReady || (loading && !hasData)) && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', background: '#0d1117' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '5px', height: '80px' }}>
              {[42, 68, 55, 80, 47, 72, 38, 88, 60, 76, 44, 65, 52, 83].map((h, i) => (
                <div key={i} style={{ width: '10px', height: `${h}%`, background: i % 3 === 0 ? 'rgba(239,83,80,0.25)' : 'rgba(38,166,154,0.25)', borderRadius: '2px', animation: `alvio-flicker ${0.7 + i * 0.07}s ease-in-out infinite alternate` }} />
              ))}
            </div>
            <span style={{ color: '#334155', fontSize: '13px', fontWeight: 500 }}>Chargement des données…</span>
          </div>
        )}

        {/* Rate-limit overlay */}
        {rateLimited && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 20, background: '#0d1117' }}>
            <RateLimitCard dark context="graphique" onRetry={() => { void fetchOhlc(); }} />
          </div>
        )}

        {/* No-data overlay */}
        {!loading && noData && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0d1117' }}>
            <div style={{ padding: '24px 32px', borderRadius: '14px', border: '1px solid rgba(99,102,241,0.2)', background: 'rgba(99,102,241,0.06)', textAlign: 'center', maxWidth: '340px' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>📊</div>
              <p style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: 700, color: '#94a3b8', lineHeight: 1.5 }}>Données OHLCV non disponibles pour cette crypto</p>
              <button onClick={() => { void fetchOhlc(); }} style={{ marginTop: '16px', padding: '8px 20px', borderRadius: '8px', border: '1px solid rgba(99,102,241,0.3)', background: 'rgba(99,102,241,0.1)', color: '#6366f1', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                Réessayer
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes alvio-spin    { to { transform: rotate(360deg); } }
        @keyframes alvio-pulse   { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.3; transform:scale(0.6); } }
        @keyframes alvio-flicker { from { opacity:0.25; } to { opacity:0.6; } }
        div::-webkit-scrollbar   { display: none; }
      `}</style>
    </div>
  );
};

export default TradingChart;
