import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateSignalDto } from './dto/create-signal.dto';
import { GenerateSignalDto } from './dto/generate-signal.dto';
import { EmailService } from '../email/email.service';
import {
  PatternDetectionService,
  PatternDetectionResult,
} from '../patterns/pattern-detection.service';

type GenerateSignalResult =
  | { status: 'no_signal';        global_status: 'NO_SIGNAL'; confidence_score: number; message: string }
  | { status: 'already_open';     signal: Record<string, unknown>; message: string }
  | { status: 'no_open_position'; message: string }
  | {
      status: 'signal_created' | 'signal_closed';
      direction: 'BUY' | 'SELL';
      signal: Record<string, unknown>;
      detection_summary: {
        global_status: string;
        confidence_score: number;
        current_price: number;
        candles_used: number;
        evaluated_at: string;
      };
    };

@Injectable()
export class SignalsService {
  private readonly logger = new Logger(SignalsService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private patternDetection: PatternDetectionService,
  ) {}

  // ── Signal generation (Module 4) ──────────────────────────────────────────

  async generateSignal(
    userId: string,
    dto: GenerateSignalDto,
  ): Promise<GenerateSignalResult> {
    const { strategyId, asset, timeframe } = dto;

    // 1. Verify strategy exists
    const strategy = await this.prisma.strategy.findUnique({
      where: { id: strategyId },
    });
    if (!strategy) {
      throw new NotFoundException(`Strategy ${strategyId} not found`);
    }

    // 2. Run pattern detection — or use injected mock for testing
    let detection: PatternDetectionResult;
    if (dto.mockResult) {
      detection = dto.mockResult as unknown as PatternDetectionResult;
    } else {
      detection = await this.patternDetection.detectPattern(strategyId, asset, timeframe);
    }

    // 3. NO_SIGNAL → no persistence
    if (detection.global_status === 'NO_SIGNAL') {
      return {
        status: 'no_signal',
        global_status: 'NO_SIGNAL',
        confidence_score: detection.confidence_score,
        message: 'No pattern detected — no signal created.',
      };
    }

    // 4. Map global_status → direction
    const direction: 'BUY' | 'SELL' =
      detection.global_status === 'ENTRY_SIGNAL' ? 'BUY' : 'SELL';

    const detectionSummary = {
      global_status:    detection.global_status,
      confidence_score: detection.confidence_score,
      current_price:    detection.current_price,
      candles_used:     detection.candles_used,
      evaluated_at:     detection.evaluated_at,
    };

    // ── ENTRY_SIGNAL (BUY) ────────────────────────────────────────────────────
    if (direction === 'BUY') {
      // Déduplication : vérifie s'il existe déjà un Signal OPEN pour cette stratégie + asset
      const existingOpen = await this.prisma.signal.findFirst({
        where: { strategyId, asset, direction: 'BUY', status: 'OPEN' },
      });

      if (existingOpen) {
        return {
          status: 'already_open',
          signal: existingOpen as unknown as Record<string, unknown>,
          message: `Signal BUY already OPEN for strategy ${strategyId} on ${asset} (id: ${existingOpen.id})`,
        };
      }

      // Dérive entry / SL / TP
      const entryPrice = detection.current_price;
      const riskMgmt   = detection.risk_management as Record<string, string> | undefined;
      const slPct      = this.parsePct(riskMgmt?.stop_loss)   ?? 0.02;
      const tpPct      = this.parsePct(riskMgmt?.take_profit) ?? 0.04;

      const indicatorsPayload = {
        strategy_name:    detection.strategy_name,
        evaluated_at:     detection.evaluated_at,
        candles_used:     detection.candles_used,
        indicators:       detection.indicators,
        entry_conditions: detection.entry_conditions,
        exit_conditions:  detection.exit_conditions,
      };

      const signal = await this.prisma.signal.create({
        data: {
          userId:      strategy.userId,
          strategyId,
          asset,
          timeframe,
          direction:   'BUY',
          status:      'OPEN',
          confidence:  Math.round(detection.confidence_score * 10000) / 100,
          entry_price: entryPrice,
          stop_loss:   Math.round(entryPrice * (1 - slPct) * 100) / 100,
          take_profit: Math.round(entryPrice * (1 + tpPct) * 100) / 100,
          patterns:    JSON.stringify(['ENTRY_SIGNAL']),
          indicators:  JSON.stringify(indicatorsPayload),
        },
      });

      this.notifyAllUsers(signal).catch((err) =>
        this.logger.error('Failed to notify users of new signal', err),
      );

      return {
        status: 'signal_created',
        direction: 'BUY',
        signal: signal as unknown as Record<string, unknown>,
        detection_summary: detectionSummary,
      };
    }

    // ── EXIT_SIGNAL (SELL) ────────────────────────────────────────────────────
    //
    // Choix de design : on NE crée PAS un Signal SELL distinct.
    // On clôture le Signal BUY existant (status → CLOSED, exit_price, closedAt).
    // Justification :
    //   - La stratégie est long-only (mean-reversion RSI+EMA) : 1 position à la fois.
    //   - Le Signal tracke le cycle complet d'un trade (entrée → sortie).
    //   - Évite le double-comptage dans les statistiques (totalSignals = nombre de trades).
    //   - exit_price + closedAt suffisent pour calculer le P&L : (exit_price - entry_price).
    //   - Si un historique de signaux SELL distincts est nécessaire à l'avenir,
    //     on ajoutera un Signal SELL séparé via une migration ciblée.

    const openBuy = await this.prisma.signal.findFirst({
      where: { strategyId, asset, direction: 'BUY', status: 'OPEN' },
    });

    if (!openBuy) {
      return {
        status: 'no_open_position',
        message: `No open BUY position found for strategy ${strategyId} on ${asset}.`,
      };
    }

    const closedSignal = await this.prisma.signal.update({
      where: { id: openBuy.id },
      data: {
        status:     'CLOSED',
        exit_price: detection.current_price,
        closedAt:   new Date(),
      },
    });

    return {
      status:    'signal_closed',
      direction: 'SELL',
      signal:    closedSignal as unknown as Record<string, unknown>,
      detection_summary: detectionSummary,
    };
  }

  // ── Existing methods ──────────────────────────────────────────────────────

  async createSignal(userId: string, createSignalDto: CreateSignalDto) {
    const signal = await this.prisma.signal.create({
      data: {
        userId,
        asset: createSignalDto.asset,
        direction: createSignalDto.direction,
        confidence: createSignalDto.confidence,
        entry_price: createSignalDto.entryPrice,
        stop_loss: createSignalDto.stopLoss,
        take_profit: createSignalDto.takeProfit,
        patterns: createSignalDto.detectedPatterns
          ? JSON.stringify(createSignalDto.detectedPatterns)
          : undefined,
        indicators: createSignalDto.indicators
          ? JSON.stringify(createSignalDto.indicators)
          : undefined,
      },
    });

    // Notify all registered users by email (fire-and-forget)
    this.notifyAllUsers(signal).catch((err) =>
      this.logger.error('Failed to notify users of new signal', err),
    );

    return signal;
  }

  private async notifyAllUsers(signal: any) {
    const users = await this.prisma.user.findMany({
      select: { email: true },
    });

    const emails = users.map((u: any) => u.email).filter(Boolean);
    if (!emails.length) return;

    let tp2: number | null = null;
    let pattern: string | undefined;

    try {
      const ind = signal.indicators ? JSON.parse(signal.indicators) : {};
      tp2 = ind.tp2 ?? null;
    } catch {}

    try {
      const patterns = signal.patterns ? JSON.parse(signal.patterns) : [];
      pattern = Array.isArray(patterns) ? patterns[0] : patterns;
    } catch {}

    await this.emailService.sendSignalNotification(emails, {
      asset: signal.asset,
      direction: signal.direction,
      entryPrice: signal.entry_price,
      takeProfit: signal.take_profit,
      tp2,
      stopLoss: signal.stop_loss,
      confidence: signal.confidence,
      pattern,
    });
  }

  async getUserSignals(userId: string) {
    return this.prisma.signal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async getRecentSignals(userId: string, limit: number) {
    return this.prisma.signal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getSignalsStatistics(userId: string) {
    const signals = await this.prisma.signal.findMany({
      where: { userId },
    });

    const buySignals = signals.filter((s: any) => s.direction === 'BUY').length;
    const sellSignals = signals.filter((s: any) => s.direction === 'SELL').length;
    const avgConfidence =
      signals.reduce((acc: number, s: any) => acc + s.confidence, 0) /
        signals.length || 0;

    return {
      totalSignals: signals.length,
      buySignals,
      sellSignals,
      averageConfidence: avgConfidence,
    };
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  /** Extracts the first percentage from a text like "2% sous le point d'entrée" → 0.02 */
  private parsePct(text?: string): number | null {
    if (!text) return null;
    const m = text.match(/(\d+(?:\.\d+)?)\s*%/);
    return m ? parseFloat(m[1]) / 100 : null;
  }
}
