import {
  Controller,
  Get,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  PatternDetectionService,
  PatternDetectionResult,
} from './pattern-detection.service';

@Controller('patterns')
@UseGuards(JwtAuthGuard)
export class PatternsController {
  constructor(private readonly patternDetection: PatternDetectionService) {}

  /**
   * GET /patterns/detect?strategyId=<id>&asset=BTC/USDT&timeframe=4h
   *
   * Fetches live OHLCV from CoinGecko, runs pattern_detector.py, returns signal.
   */
  @Get('detect')
  detect(
    @Query('strategyId') strategyId: string,
    @Query('asset')      asset: string,
    @Query('timeframe')  timeframe: string,
  ): Promise<PatternDetectionResult> {
    if (!strategyId) throw new BadRequestException('strategyId is required');
    if (!asset)      throw new BadRequestException('asset is required');
    if (!timeframe)  throw new BadRequestException('timeframe is required');

    return this.patternDetection.detectPattern(strategyId, asset, timeframe);
  }
}
