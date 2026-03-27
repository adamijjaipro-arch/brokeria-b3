import { Injectable } from '@nestjs/common';
import { DCASimulatorDto } from './dto/dca-simulator.dto';

@Injectable()
export class SimulatorService {
  simulateDCA(dcaDto: DCASimulatorDto) {
    const {
      initialAmount,
      monthlyInvestment,
      months,
      annualReturn,
      volatility,
    } = dcaDto;

    const monthlyRate = annualReturn / 12;
    let balance = initialAmount;
    let totalInvested = initialAmount;
    const monthlyData = [];

    for (let month = 1; month <= months; month++) {
      balance += monthlyInvestment;
      totalInvested += monthlyInvestment;

      const randomReturn = this.getRandomReturn(monthlyRate, volatility);
      balance = balance * (1 + randomReturn);

      monthlyData.push({
        month,
        balance: Math.round(balance * 100) / 100,
        totalInvested: Math.round(totalInvested * 100) / 100,
        monthlyContribution: monthlyInvestment,
        gainLoss: balance - totalInvested,
      });
    }

    const totalGains = balance - totalInvested;
    const roi = (totalGains / totalInvested) * 100;

    return {
      initialAmount,
      monthlyInvestment,
      months,
      annualReturn,
      volatility,
      totalInvested: Math.round(totalInvested * 100) / 100,
      finalBalance: Math.round(balance * 100) / 100,
      totalGains: Math.round(totalGains * 100) / 100,
      roi: Math.round(roi * 100) / 100,
      monthlyData,
    };
  }

  private getRandomReturn(mean: number, stdDev: number): number {
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return mean + stdDev * z0;
  }
}
