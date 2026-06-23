import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import { SignalsService } from './signals.service';

export interface ScanEntry {
  strategy: string;
  asset: string;
  timeframe: string;
  status: string;
  error?: string;
}

@Injectable()
export class SignalSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(SignalSchedulerService.name);

  constructor(
    private schedulerRegistry: SchedulerRegistry,
    private prisma: PrismaService,
    private signalsService: SignalsService,
    private config: ConfigService,
  ) {}

  onModuleInit() {
    const intervalMs = parseInt(
      this.config.get<string>('SIGNAL_SCAN_INTERVAL', '900000'), // default: 15min
    );
    const interval = setInterval(() => this.runScan(), intervalMs);
    this.schedulerRegistry.addInterval('signal-scan', interval);
    this.logger.log(
      `Signal scanner registered — interval: ${intervalMs}ms (${intervalMs / 60000}min)`,
    );
  }

  async runScan(): Promise<{ scanned: number; results: ScanEntry[] }> {
    const strategies = await this.prisma.strategy.findMany({
      where: { status: 'active' },
    });

    this.logger.log(`[scan] ${strategies.length} active strategy/ies found`);

    const results: ScanEntry[] = [];

    for (const strategy of strategies) {
      try {
        const result = await this.signalsService.generateSignal(strategy.userId, {
          strategyId: strategy.id,
          asset: strategy.asset,
          timeframe: strategy.timeframe,
        });

        const entry: ScanEntry = {
          strategy: strategy.name,
          asset: strategy.asset,
          timeframe: strategy.timeframe,
          status: result.status,
        };
        results.push(entry);
        this.logger.log(
          `[scan] ${strategy.name} (${strategy.asset} ${strategy.timeframe}): ${result.status}`,
        );
      } catch (err: any) {
        const entry: ScanEntry = {
          strategy: strategy.name,
          asset: strategy.asset,
          timeframe: strategy.timeframe,
          status: 'error',
          error: err.message,
        };
        results.push(entry);
        this.logger.error(`[scan] ${strategy.name}: ${err.message}`);
      }
    }

    return { scanned: strategies.length, results };
  }
}
