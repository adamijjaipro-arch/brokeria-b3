import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export enum Timeframe {
  ONE_M     = '1m',
  FIVE_M    = '5m',
  FIFTEEN_M = '15m',
  ONE_H     = '1h',
  FOUR_H    = '4h',
  ONE_D     = '1D',
}

export class ImportStrategyDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(Timeframe, { message: 'timeframe doit être : 1m, 5m, 15m, 1h, 4h ou 1D' })
  timeframe: Timeframe;

  @IsOptional()
  @IsString()
  asset?: string;
}
