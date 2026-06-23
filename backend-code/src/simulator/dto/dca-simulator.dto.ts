import { IsNumber, IsString, IsOptional, IsIn, Min, Max } from 'class-validator';

export class DCASimulatorDto {
  @IsString()
  asset: string;

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
  volatility: number = 0.35;

  @IsOptional()
  @IsIn(['monte_carlo', 'fixed'])
  mode?: 'monte_carlo' | 'fixed';
}
