import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { spawn } from 'child_process';
import { PrismaService } from '../database/prisma.service';
import { MarketsService, OhlcApiResponse } from '../markets/markets.service';

interface OhlcRecord {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface PatternDetectorInput {
  strategy: Record<string, unknown>;
  market_data: OhlcRecord[];
}

export interface ConditionResult {
  condition: string;
  type: 'evaluable' | 'meta' | 'price_level';
  met: boolean;
  skip?: boolean;
  indicator?: string;
  indicator_value?: number;
  threshold_label?: string;
  threshold_value?: number;
  operator?: string;
  margin?: number;
  margin_pct?: number;
}

export interface PatternDetectionResult {
  strategy_name: string;
  asset: string;
  timeframe: string;
  evaluated_at: string;
  current_price: number;
  candles_used: number;
  global_status: 'ENTRY_SIGNAL' | 'EXIT_SIGNAL' | 'NO_SIGNAL';
  confidence_score: number;
  indicators: Record<string, unknown>;
  entry_conditions: ConditionResult[];
  exit_conditions: ConditionResult[];
  risk_management: Record<string, unknown>;
  sessions: unknown[];
}

@Injectable()
export class PatternDetectionService {
  private readonly logger = new Logger(PatternDetectionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly markets: MarketsService,
  ) {}

  async detectPattern(
    strategyId: string,
    asset: string,
    timeframe: string,
  ): Promise<PatternDetectionResult> {
    const strategy = await this.prisma.strategy.findUnique({ where: { id: strategyId } });
    if (!strategy) {
      throw new NotFoundException(`Strategy ${strategyId} not found`);
    }

    let strategyJson: Record<string, unknown>;
    try {
      strategyJson = JSON.parse(strategy.code) as Record<string, unknown>;
    } catch {
      throw new Error(`Strategy ${strategyId} has invalid JSON in its code field`);
    }

    const coinId = this.assetToCoinId(asset);
    const days   = this.timeframeToDays(timeframe);
    const ohlcv  = await this.markets.getOhlcv(coinId, days);

    const marketData = this.transformOhlcv(ohlcv);
    if (marketData.length === 0) {
      throw new Error(
        `No OHLCV data returned for ${asset} (coinId=${coinId}, days=${days})`,
      );
    }

    this.logger.log(
      `Detecting pattern — strategy=${strategyId} asset=${asset}(${coinId}) ` +
      `timeframe=${timeframe} days=${days} candles=${marketData.length}`,
    );

    return this.runPatternDetector({ strategy: strategyJson, market_data: marketData });
  }

  // ── Private helpers ──────────────────────────────────────────────────────────

  private assetToCoinId(asset: string): string {
    const base = asset.toUpperCase().split('/')[0];
    const MAP: Record<string, string> = {
      BTC:   'bitcoin',
      ETH:   'ethereum',
      SOL:   'solana',
      BNB:   'binancecoin',
      ADA:   'cardano',
      XRP:   'ripple',
      DOT:   'polkadot',
      MATIC: 'matic-network',
      DOGE:  'dogecoin',
      AVAX:  'avalanche-2',
      LINK:  'chainlink',
      UNI:   'uniswap',
      LTC:   'litecoin',
      ATOM:  'cosmos',
      NEAR:  'near',
      FTM:   'fantom',
      ALGO:  'algorand',
    };
    return MAP[base] ?? base.toLowerCase();
  }

  // CoinGecko /ohlc granularity (verified on Demo plan):
  //   days 3-30  → 4h candles, exactly 6 per day  (7d=42, 14d=84, 30d=180)
  //   days 90+   → daily but very sparse on Demo  (90d→only ~23 pts)
  // → stay ≤ 30 for any timeframe needing 4h candles.
  // The pattern_detector.py guard handles any remaining insufficiency.
  private timeframeToDays(timeframe: string): number {
    const tf = timeframe.toLowerCase();
    if (['1m', '5m', '15m', '30m'].includes(tf)) return 7;   // 42 4h candles
    if (tf === '1h')                               return 14;  // 84 4h or hourly via fallback
    if (tf === '4h')                               return 30;  // 180 4h candles ✓
    if (['1d', 'd'].includes(tf))                  return 90;  // daily, guard handles low count
    if (['1w', 'w'].includes(tf))                  return 90;  // same
    return 30;
  }

  private transformOhlcv(response: OhlcApiResponse): OhlcRecord[] {
    return response.data.map(row => {
      if (response.mode === 'candle') {
        const [timestamp, open, high, low, close] = row;
        return { timestamp, open, high, low, close, volume: 0 };
      }
      // line mode: [ts_ms, price] — synthesise OHLC from close only
      const [timestamp, close] = row;
      return { timestamp, open: close, high: close, low: close, close, volume: 0 };
    });
  }

  private runPatternDetector(input: PatternDetectorInput): Promise<PatternDetectionResult> {
    return new Promise((resolve, reject) => {
      const proc = spawn('python3', ['/app/ai-module/pattern_detector.py'], {
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      const stdoutChunks: Buffer[] = [];
      const stderrChunks: Buffer[] = [];

      proc.stdout.on('data', (chunk: Buffer) => stdoutChunks.push(chunk));
      proc.stderr.on('data', (chunk: Buffer) => stderrChunks.push(chunk));

      proc.on('close', (code) => {
        const stderr = Buffer.concat(stderrChunks).toString('utf-8').trim();
        const stdout = Buffer.concat(stdoutChunks).toString('utf-8').trim();

        if (code !== 0) {
          this.logger.error(`pattern_detector.py exited ${code}: ${stderr}`);
          reject(new Error(`Pattern detector failed (exit ${code}): ${stderr || stdout}`));
          return;
        }

        if (stderr) {
          this.logger.warn(`pattern_detector.py stderr: ${stderr}`);
        }

        try {
          resolve(JSON.parse(stdout) as PatternDetectionResult);
        } catch {
          reject(
            new Error(
              `Failed to parse pattern_detector output: ${stdout.slice(0, 300)}`,
            ),
          );
        }
      });

      proc.on('error', (err) => {
        reject(new Error(`Failed to spawn python3: ${err.message}`));
      });

      proc.stdin.write(JSON.stringify(input), 'utf-8');
      proc.stdin.end();
    });
  }
}
