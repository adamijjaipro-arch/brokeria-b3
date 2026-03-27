import { IsString, IsNumber, Min, Max } from 'class-validator';

export class CreateSignalDto {
  @IsString()
  asset: string;

  @IsString()
  direction: 'BUY' | 'SELL' | 'HOLD';

  @IsNumber()
  @Min(0)
  @Max(100)
  confidence: number;

  @IsNumber()
  entryPrice: number;

  @IsNumber()
  stopLoss: number;

  @IsNumber()
  takeProfit: number;

  detectedPatterns?: string[];
  indicators?: Record<string, any>;
}
