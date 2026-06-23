import { IsString, IsOptional, IsObject } from 'class-validator';

export class GenerateSignalDto {
  @IsString()
  strategyId: string;

  @IsString()
  asset: string;

  @IsString()
  timeframe: string;

  /**
   * Optionnel — permet d'injecter directement un résultat PatternDetectionService
   * pour tester la logique de mapping + persistance sans appeler CoinGecko.
   */
  @IsOptional()
  @IsObject()
  mockResult?: Record<string, unknown>;
}
