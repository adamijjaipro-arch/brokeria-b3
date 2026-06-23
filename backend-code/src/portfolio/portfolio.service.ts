import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

const MONTH_NAMES = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

@Injectable()
export class PortfolioService {
  constructor(private prisma: PrismaService) {}

  async getHistory(userId: string) {
    const snapshots = await this.prisma.portfolioSnapshot.findMany({
      where: { userId },
      orderBy: [{ year: 'asc' }, { month: 'asc' }],
      take: 6,
    });

    if (snapshots.length === 0) return { months: [], values: [] };

    return {
      months: snapshots.map((s: any) => MONTH_NAMES[s.month - 1]),
      values: snapshots.map((s: any) => s.capital as number),
    };
  }

  async getStats(userId: string) {
    const snapshots = await this.prisma.portfolioSnapshot.findMany({
      where: { userId },
      orderBy: [{ year: 'asc' }, { month: 'asc' }],
    });

    let capitalTotal: number | null = null;
    let capitalGrowthPercent: number | null = null;
    let performance: number | null = null;

    if (snapshots.length >= 1) {
      capitalTotal = snapshots[snapshots.length - 1].capital;
    }
    if (snapshots.length >= 2) {
      const first = snapshots[0].capital;
      const last = snapshots[snapshots.length - 1].capital;
      capitalGrowthPercent = Math.round(((last - first) / first) * 1000) / 10;

      const prev = snapshots[snapshots.length - 2].capital;
      performance = Math.round(((last - prev) / prev) * 1000) / 10;
    }

    // Win rate : signaux des 30 derniers jours, confidence >= 70 = victoire
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentSignals = await this.prisma.signal.findMany({
      where: { userId, createdAt: { gte: thirtyDaysAgo } },
      select: { confidence: true },
    });

    let winRate: number | null = null;

    if (recentSignals.length > 0) {
      const wins = recentSignals.filter((s: any) => s.confidence >= 70).length;
      winRate = Math.round((wins / recentSignals.length) * 1000) / 10;
    } else {
      // Fallback : dernier rapport mensuel si disponible
      const latestReport = await this.prisma.report.findFirst({
        where: { userId },
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
        select: { win_rate: true },
      });
      if (latestReport) winRate = latestReport.win_rate;
    }

    return { capitalTotal, capitalGrowthPercent, winRate, performance };
  }
}
