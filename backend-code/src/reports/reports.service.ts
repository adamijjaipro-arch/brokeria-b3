import { Injectable } from '@nestjs/common';
import { Signal } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';

// ── Définition buy/sell/hold pour un modèle long-only (direction toujours BUY) ──
//
// Pour la stratégie RSI+EMA (et toutes les stratégies long-only du système) :
//   - direction='BUY'  toujours  → on ne peut PAS segmenter par direction
//   - Le cycle d'un trade est : Signal créé (OPEN) → Signal fermé (CLOSED, exit_price renseigné)
//
// Définition retenue pour un mois (year, month) donné :
//   buy_signals  = Signal dont createdAt est dans le mois  → "entrées déclenchées ce mois"
//   sell_signals = Signal dont closedAt  est dans le mois  → "sorties déclenchées ce mois"
//   hold_signals = Signal OPEN créés avant ou pendant le mois, toujours ouverts en fin de mois
//   total_signals = buy_signals + sell_signals (activité distincte, sans double-comptage)
//
// win_rate = % de Signal CLOSED ce mois avec exit_price > entry_price
//   (base : uniquement les clôtures du mois, pas les ouvertures)

export interface MonthlyStats {
  year:                    number;
  month:                   number;
  total_signals:           number;
  buy_signals:             number;
  sell_signals:            number;
  hold_signals:            number;
  win_rate:                number;
  avg_confidence:          number;
  best_signal_confidence:  number;
  worst_signal_confidence: number;
  total_pnl_estimate:      number;
  total_trades_expected:   number;
  high_confidence_signals: number;
  patterns_detected:       Record<string, number>;
  indicators_used:         string[];
  summary:                 string | null;
}

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getMonthlyStats(userId: string, year: number, month: number): Promise<MonthlyStats> {
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd   = new Date(year, month, 1); // exclusive upper bound

    // All signals for this user — we need several overlapping date windows
    const allSignals: Signal[] = await this.prisma.signal.findMany({
      where: { userId },
    });

    // buy_signals : entrées créées ce mois
    const buySignals = allSignals.filter(
      (s) => s.createdAt >= monthStart && s.createdAt < monthEnd,
    );

    // sell_signals : sorties (closedAt) ce mois
    const sellSignals = allSignals.filter(
      (s) => s.closedAt != null && s.closedAt >= monthStart && s.closedAt < monthEnd,
    );

    // hold_signals : toujours OPEN, créés avant ou pendant le mois
    const holdSignals = allSignals.filter(
      (s) => s.status === 'OPEN' && s.createdAt < monthEnd,
    );

    const totalSignals          = buySignals.length + sellSignals.length;
    const buyCount              = buySignals.length;
    const sellCount             = sellSignals.length;
    const holdCount             = holdSignals.length;

    // Confidence stats — sur les Signal créés ce mois (les entrées)
    const confidences = buySignals.map((s) => s.confidence);
    const avgConfidence  = confidences.length > 0
      ? confidences.reduce((a, b) => a + b, 0) / confidences.length
      : 0;
    const bestConfidence  = confidences.length > 0 ? Math.max(...confidences) : 0;
    const worstConfidence = confidences.length > 0 ? Math.min(...confidences) : 0;
    const highConfidence  = confidences.filter((c) => c > 80).length;

    // win_rate : % de clôtures gagnantes parmi les sorties du mois
    const closedThisMonth = sellSignals.filter((s) => s.exit_price != null);
    const winningTrades   = closedThisMonth.filter(
      (s) => (s.exit_price as number) > s.entry_price,
    );
    const winRate = closedThisMonth.length > 0
      ? Math.round((winningTrades.length / closedThisMonth.length) * 10000) / 100
      : 0;

    // total_pnl_estimate : somme des P&L des clôtures du mois
    const totalPnl = closedThisMonth.reduce(
      (sum, s) => sum + ((s.exit_price as number) - s.entry_price),
      0,
    );

    // total_trades_expected = max(buy, sell) — nb de trades complets possibles
    const totalTradesExpected = Math.max(buyCount, sellCount);

    // patterns_detected : depuis le champ JSON `patterns` des Signal du mois
    const patternCounts: Record<string, number> = {};
    for (const sig of buySignals) {
      if (!sig.patterns) continue;
      try {
        const arr = JSON.parse(sig.patterns as string) as string[];
        for (const p of arr) {
          patternCounts[p] = (patternCounts[p] ?? 0) + 1;
        }
      } catch { /* skip malformed */ }
    }

    // indicators_used : depuis le champ JSON `indicators` des Signal du mois
    const indicatorsSet = new Set<string>();
    for (const sig of buySignals) {
      if (!sig.indicators) continue;
      try {
        const obj = JSON.parse(sig.indicators as string) as Record<string, unknown>;
        const inds = obj['indicators'];
        if (Array.isArray(inds)) {
          for (const ind of inds as Array<{ name?: string }>) {
            if (ind?.name) indicatorsSet.add(ind.name);
          }
        }
      } catch { /* skip malformed */ }
    }

    const monthName = new Date(year, month - 1, 1)
      .toLocaleString('fr-FR', { month: 'long' });

    const summary = totalSignals > 0
      ? `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${year} : ` +
        `${buyCount} entrée(s), ${sellCount} sortie(s), ${holdCount} position(s) en cours. ` +
        `Confiance moyenne : ${Math.round(avgConfidence * 10) / 10}%. ` +
        `Win rate : ${winRate}%. ` +
        `P&L estimé : ${Math.round(totalPnl)} $.`
      : null;

    return {
      year,
      month,
      total_signals:           totalSignals,
      buy_signals:             buyCount,
      sell_signals:            sellCount,
      hold_signals:            holdCount,
      win_rate:                winRate,
      avg_confidence:          Math.round(avgConfidence * 100) / 100,
      best_signal_confidence:  bestConfidence,
      worst_signal_confidence: worstConfidence,
      total_pnl_estimate:      Math.round(totalPnl * 100) / 100,
      total_trades_expected:   totalTradesExpected,
      high_confidence_signals: highConfidence,
      patterns_detected:       patternCounts,
      indicators_used:         Array.from(indicatorsSet).sort(),
      summary,
    };
  }
}
