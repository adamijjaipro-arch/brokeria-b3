import {
  Injectable,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as https from 'https';
import type { IncomingMessage } from 'http';
import { RedisService } from '../redis/redis.service';

// Bypass self-signed / corporate SSL certs in dev (same pattern as the Next.js proxy routes).
// In production Docker, the system CA is fine and this agent is unused.
const DEV_AGENT = new https.Agent({ rejectUnauthorized: false });

// ── Public types (also used by the controller) ────────────────────────────────

export interface CoinMarket {
  id:                          string;
  symbol:                      string;
  name:                        string;
  image:                       string;
  current_price:               number;
  price_change_percentage_24h: number;
  total_volume:                number;
  market_cap:                  number;
  sparkline_in_7d:             { price: number[] };
}

export interface CoinDetail {
  id:               string;
  name:             string;
  symbol:           string;
  market_cap_rank?: number;
  image:            { large: string; small: string };
  description?:     { en?: string };
  links?:           { homepage?: string[]; subreddit_url?: string };
  market_data: {
    current_price:               { usd: number };
    price_change_percentage_24h:  number;
    high_24h:                    { usd: number };
    low_24h:                     { usd: number };
    total_volume:                { usd: number };
    market_cap:                  { usd: number };
    circulating_supply:           number;
    ath:                         { usd: number };
    ath_change_percentage:       { usd: number };
  };
}

export type ChartMode = 'candle' | 'line';

export interface OhlcApiResponse {
  mode: ChartMode;
  /** candle → [ts_ms, open, high, low, close][]  ·  line → [ts_ms, price][] */
  data: number[][];
}

// ── Internal CoinGecko shapes ─────────────────────────────────────────────────

interface MarketChartBody {
  prices: [number, number][];
}

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable()
export class MarketsService {
  private readonly logger = new Logger(MarketsService.name);
  private readonly BASE   = 'https://api.coingecko.com/api/v3';
  private readonly apiKey: string;

  constructor(
    private readonly config: ConfigService,
    private readonly redis:  RedisService,
  ) {
    this.apiKey = this.config.get<string>('COINGECKO_API_KEY') ?? '';
    if (!this.apiKey) {
      this.logger.warn(
        'COINGECKO_API_KEY not set — requests will use anonymous tier (30 req/min)',
      );
    }
  }

  // ── Public methods ──────────────────────────────────────────────────────────

  async getTopCoins(): Promise<CoinMarket[]> {
    const key = 'markets:top20';
    const hit = await this.cacheGet<CoinMarket[]>(key);
    if (hit) return hit;

    try {
      const data = await this.fetchCoinGecko<CoinMarket[]>(
        '/coins/markets',
        {
          vs_currency: 'usd',
          order:       'market_cap_desc',
          per_page:    20,
          sparkline:   'true',
        },
        key,
      );
      await this.cacheSet(key, data, 60);
      return data;
    } catch (err) {
      if (this.isRateLimit(err)) {
        const stale = await this.cacheGetStale<CoinMarket[]>(key);
        if (stale) {
          this.logger.warn(`[getTopCoins] Rate limited — serving stale cache`);
          return stale;
        }
      }
      console.error('[MarketsService.getTopCoins]', err);
      throw err;
    }
  }

  async getCoinDetail(coinId: string): Promise<CoinDetail> {
    const key = `markets:detail:${coinId}`;
    const hit = await this.cacheGet<CoinDetail>(key);
    if (hit) return hit;

    try {
      const data = await this.fetchCoinGecko<CoinDetail>(
        `/coins/${coinId}`,
        { localization: 'false', tickers: 'false', community_data: 'false', developer_data: 'false' },
        key,
      );
      await this.cacheSet(key, data, 30);
      return data;
    } catch (err) {
      if (this.isRateLimit(err)) {
        const stale = await this.cacheGetStale<CoinDetail>(key);
        if (stale) {
          this.logger.warn(`[getCoinDetail/${coinId}] Rate limited — serving stale cache`);
          return stale;
        }
      }
      console.error(`[MarketsService.getCoinDetail/${coinId}]`, err);
      throw err;
    }
  }

  async getOhlcv(coinId: string, days: number): Promise<OhlcApiResponse> {
    const key = `markets:ohlcv:${coinId}:${days}`;
    const ttl = this.ohlcTtl(days);
    const hit = await this.cacheGet<OhlcApiResponse>(key);
    if (hit) return hit;

    // ── Attempt 1: /ohlc ───────────────────────────────────────────────────
    try {
      const raw = await this.fetchCoinGecko<number[][]>(
        `/coins/${coinId}/ohlc`,
        { vs_currency: 'usd', days: String(days) },
        key,
      );
      if (Array.isArray(raw) && raw.length > 0) {
        const response: OhlcApiResponse = { mode: 'candle', data: raw };
        await this.cacheSet(key, response, ttl);
        return response;
      }
      this.logger.warn(
        `[getOhlcv/${coinId}] /ohlc returned empty — trying market_chart fallback`,
      );
    } catch (err) {
      if (this.isRateLimit(err)) {
        const stale = await this.cacheGetStale<OhlcApiResponse>(key);
        if (stale) return stale;
      }
      console.error(`[MarketsService.getOhlcv/${coinId}] /ohlc failed`, err);
    }

    // ── Attempt 2: /market_chart fallback ─────────────────────────────────
    try {
      const effectiveDays = Math.min(days, 365);
      const params: Record<string, string | number | boolean> = {
        vs_currency: 'usd',
        days:        String(effectiveDays),
      };
      if (effectiveDays <= 90) params['interval'] = 'hourly';

      const chart = await this.fetchCoinGecko<MarketChartBody>(
        `/coins/${coinId}/market_chart`,
        params,
        key,
      );
      if (chart?.prices?.length > 0) {
        const response: OhlcApiResponse = { mode: 'line', data: chart.prices };
        await this.cacheSet(key, response, ttl);
        return response;
      }
    } catch (err) {
      if (this.isRateLimit(err)) {
        const stale = await this.cacheGetStale<OhlcApiResponse>(key);
        if (stale) return stale;
        throw err;
      }
      console.error(`[MarketsService.getOhlcv/${coinId}] market_chart failed`, err);
      throw err;
    }

    // Both endpoints returned empty
    return { mode: 'line', data: [] };
  }

  // ── Private: HTTP ──────────────────────────────────────────────────────────

  /** Core HTTPS GET with API-key header. Retries once on 429. */
  private async fetchCoinGecko<T>(
    path:     string,
    params:   Record<string, string | number | boolean> = {},
    cacheKey?: string,
  ): Promise<T> {
    const url = this.buildUrl(path, params);

    let result = await this.httpsGet<T>(url);

    if (result.status === 429) {
      this.logger.warn(
        `CoinGecko 429 on ${path} — waiting 2 s before retry`,
      );
      await this.sleep(2_000);
      result = await this.httpsGet<T>(url);
    }

    if (result.status === 429) {
      // Second 429 — serve stale or throw
      if (cacheKey) {
        const stale = await this.cacheGetStale<T>(cacheKey);
        if (stale !== null) {
          this.logger.warn(
            `CoinGecko still rate-limited, serving stale for ${cacheKey}`,
          );
          return stale;
        }
      }
      throw new HttpException(
        'CoinGecko rate limit exceeded (429)',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (result.status === 404) {
      throw new HttpException(
        `Coin not found on CoinGecko`,
        HttpStatus.NOT_FOUND,
      );
    }

    if (result.status >= 400) {
      console.error(
        `[MarketsService] CoinGecko HTTP ${result.status} for ${path}`,
      );
      throw new HttpException(
        `CoinGecko upstream error ${result.status}`,
        HttpStatus.BAD_GATEWAY,
      );
    }

    return result.body;
  }

  /** Low-level Node.js https.get wrapper — typed, with timeout. */
  private httpsGet<T>(url: string): Promise<{ status: number; body: T }> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error(`CoinGecko request timed out: ${url}`)),
        10_000,
      );

      const headers: Record<string, string> = {
        Accept:       'application/json',
        'User-Agent': 'Alvio/1.0',
      };
      if (this.apiKey) headers['x-cg-demo-api-key'] = this.apiKey;

      const agent = process.env.NODE_ENV !== 'production' ? DEV_AGENT : undefined;
      const req = https.get(url, { headers, agent }, (res: IncomingMessage) => {
        const chunks: Buffer[] = [];
        res.on('data', (c: Buffer) => chunks.push(c));
        res.on('end', () => {
          clearTimeout(timer);
          const code = res.statusCode ?? 200;
          if (code === 429) {
            resolve({ status: 429, body: null as unknown as T });
            return;
          }
          try {
            const body = JSON.parse(
              Buffer.concat(chunks).toString('utf8'),
            ) as T;
            resolve({ status: code, body });
          } catch (e) {
            reject(new Error(`JSON parse error for ${url}: ${String(e)}`));
          }
        });
        res.on('error', (e) => { clearTimeout(timer); reject(e); });
      });

      req.on('error', (e) => { clearTimeout(timer); reject(e); });
    });
  }

  // ── Private: helpers ───────────────────────────────────────────────────────

  private buildUrl(path: string, params: Record<string, string | number | boolean> = {}): string {
    const qs = Object.entries(params)
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
      .join('&');
    return `${this.BASE}${path}${qs ? '?' + qs : ''}`;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
  }

  private isRateLimit(err: unknown): boolean {
    return (
      err instanceof HttpException && err.getStatus() === HttpStatus.TOO_MANY_REQUESTS
    );
  }

  /** TTL for OHLC cache based on requested `days` span. */
  private ohlcTtl(days: number): number {
    if (days <= 1)  return 60;   // 1 min — intraday
    if (days <= 7)  return 180;  // 3 min
    if (days <= 30) return 600;  // 10 min
    return 1_800;                // 30 min
  }

  // ── Private: Redis cache helpers ───────────────────────────────────────────

  private async cacheGet<T>(key: string): Promise<T | null> {
    try {
      const raw = await this.redis.get(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }

  /**
   * Stores the value under two keys:
   *   `key`        — fresh copy with the supplied TTL
   *   `key:stale`  — fallback copy retained for 1 hour (served on 429)
   */
  private async cacheSet<T>(key: string, value: T, ttl: number): Promise<void> {
    const serialised = JSON.stringify(value);
    await this.redis.set(key, serialised, ttl);
    await this.redis.set(`${key}:stale`, serialised, 3_600);
  }

  private async cacheGetStale<T>(key: string): Promise<T | null> {
    try {
      const raw = await this.redis.get(`${key}:stale`);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }
}
