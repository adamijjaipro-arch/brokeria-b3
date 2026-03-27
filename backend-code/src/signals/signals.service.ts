import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateSignalDto } from './dto/create-signal.dto';
import { EmailService } from '../email/email.service';

@Injectable()
export class SignalsService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

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
    this.notifyAllUsers(signal).catch(() => {});

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
}
