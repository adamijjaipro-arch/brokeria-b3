import { IsNumber, Min, Max } from 'class-validator';

export class DCASimulatorDto {
  @IsNumber()
  @Min(0)
  initialAmount: number;

  @IsNumber()
  @Min(0)
  monthlyInvestment: number;

  @IsNumber()
  @Min(1)
  @Max(240)
  months: number;

  @IsNumber()
  @Min(-0.5)
  @Max(1)
  annualReturn: number = 0.08;

  @IsNumber()
  @Min(0)
  @Max(1)
  volatility: number = 0.15;
}
