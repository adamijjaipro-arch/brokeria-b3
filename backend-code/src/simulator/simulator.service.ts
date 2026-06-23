import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { DCASimulatorDto } from './dto/dca-simulator.dto';

@Injectable()
export class SimulatorService {
  constructor(private readonly prisma: PrismaService) {}

  async simulateDCA(userId: string, dto: DCASimulatorDto) {
    const {
      asset,
      initialAmount,
      monthlyInvestment,
      months,
      annualReturn,
      volatility,
    } = dto;
    const mode = dto.mode ?? 'monte_carlo';

    const monthlyRate = annualReturn / 12;
    let balance = initialAmount;
    let totalInvested = initialAmount;
    const monthlyData = [];

    for (let month = 1; month <= months; month++) {
      balance += monthlyInvestment;
      totalInvested += monthlyInvestment;

      if (mode === 'fixed') {
        balance = balance * (1 + monthlyRate);
      } else {
        balance = balance * (1 + this.getRandomReturn(monthlyRate, volatility));
      }

      monthlyData.push({
        month,
        balance:  Math.round(balance * 100) / 100,
        invested: Math.round(totalInvested * 100) / 100,
        monthlyContribution: monthlyInvestment,
        gainLoss: Math.round((balance - totalInvested) * 100) / 100,
      });
    }

    const totalGains = balance - totalInvested;
    const roi = (totalGains / totalInvested) * 100;

    const summary = {
      totalInvested: Math.round(totalInvested * 100) / 100,
      finalBalance:  Math.round(balance * 100) / 100,
      totalGains:    Math.round(totalGains * 100) / 100,
      roi:           Math.round(roi * 100) / 100,
    };

    this.prisma.simulationResult.create({
      data: {
        userId,
        asset,
        params:      JSON.stringify({ initialAmount, monthlyInvestment, months, annualReturn, volatility, mode }),
        result:      JSON.stringify(summary),
        monthlyData: JSON.stringify(monthlyData),
      },
    }).catch(() => { /* non-fatal */ });

    return {
      asset,
      initialAmount,
      monthlyInvestment,
      months,
      annualReturn,
      volatility,
      mode,
      ...summary,
      monthlyData,
    };
  }

  async getHistory(userId: string) {
    return this.prisma.simulationResult.findMany({
      where:   { userId },
      orderBy: { createdAt: 'desc' },
      take:    20,
      select:  { id: true, asset: true, params: true, result: true, monthlyData: true, createdAt: true },
    });
  }

  // Box-Muller Gaussian noise
  private getRandomReturn(mean: number, stdDev: number): number {
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return mean + stdDev * z0;
  }
}
