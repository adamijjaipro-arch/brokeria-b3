import type { NextApiRequest, NextApiResponse } from 'next';
import https from 'https';
import axios from 'axios';
import * as cache from '../../../../utils/serverCache';

const agent = new https.Agent({ rejectUnauthorized: false });
const BASE  = 'https://api.coingecko.com/api/v3';
const TTL   = 5 * 60_000; // 5 min

export type ChartMode = 'candle' | 'line';

export interface OhlcApiResponse {
  mode: ChartMode;
  /**
   * candle → [timestamp_ms, open, high, low, close][]
   * line   → [timestamp_ms, price][]
   */
  data: number[][];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id, days } = req.query;
  if (typeof id !== 'string') return res.status(400).json({ error: 'id invalide' });

  const d   = typeof days === 'string' ? days : '14';
  // Bumped key so old flat-array cache entries never collide with the new wrapper shape
  const key = `ohlcv2:${id}:${d}`;

  const cached = cache.get(key) as OhlcApiResponse | undefined;
  if (cached) {
    res.setHeader('X-Cache', 'HIT');
    return res.status(200).json(cached);
  }

  // ── Attempt 1 : /coins/{id}/ohlc  (real OHLCV candlesticks) ──────────────

  try {
    const { data } = await axios.get<number[][]>(`${BASE}/coins/${id}/ohlc`, {
      params:     { vs_currency: 'usd', days: d },
      httpsAgent: agent,
      timeout:    10_000,
    });

    if (Array.isArray(data) && data.length > 0) {
      const response: OhlcApiResponse = { mode: 'candle', data };
      cache.set(key, response, TTL);
      res.setHeader('X-Cache', 'MISS');
      return res.status(200).json(response);
    }

    // CoinGecko returned [] → this coin has no OHLC data, fall through
    console.error(`[ohlc/${id}] /ohlc returned empty array — trying market_chart fallback`);
  } catch (err) {
    const status = axios.isAxiosError(err) ? (err.response?.status ?? 0) : 0;

    // On rate-limit, serve stale rather than hitting the fallback
    if (status === 429) {
      const stale = cache.getStale(key) as OhlcApiResponse | undefined;
      if (stale) {
        res.setHeader('X-Cache', 'STALE');
        return res.status(200).json(stale);
      }
    }

    console.error(
      `[ohlc/${id}] /ohlc failed (${status}) — trying market_chart fallback`,
    );
  }

  // ── Attempt 2 : /coins/{id}/market_chart  (price line fallback) ───────────

  try {
    const numDays = Math.min(Number(d) || 14, 365);

    // CoinGecko free-tier: interval=hourly only honoured for days ≤ 90
    const mcParams: Record<string, string | number> = {
      vs_currency: 'usd',
      days:        numDays,
    };
    if (numDays <= 90) mcParams['interval'] = 'hourly';

    const { data } = await axios.get<{ prices: [number, number][] }>(
      `${BASE}/coins/${id}/market_chart`,
      { params: mcParams, httpsAgent: agent, timeout: 10_000 },
    );

    if (data?.prices?.length > 0) {
      const response: OhlcApiResponse = { mode: 'line', data: data.prices };
      cache.set(key, response, TTL);
      res.setHeader('X-Cache', 'MISS-FALLBACK');
      return res.status(200).json(response);
    }
  } catch (err) {
    const status  = axios.isAxiosError(err) ? (err.response?.status ?? 502) : 502;
    const message = axios.isAxiosError(err) ? err.message : String(err);
    console.error(`[ohlc/${id}] market_chart fallback failed (${status}): ${message}`);
    return res
      .status(status)
      .json({ mode: 'line', data: [] } as OhlcApiResponse);
  }

  // Both endpoints returned nothing
  return res.status(200).json({ mode: 'line', data: [] } as OhlcApiResponse);
}
