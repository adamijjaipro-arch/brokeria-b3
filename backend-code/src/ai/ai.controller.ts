import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Param,
  Query,
} from '@nestjs/common';
import { JwtGuard } from '../auth/jwt.guard';
import { AIService } from './ai.service';

@Controller('api/ai')
@UseGuards(JwtGuard)
export class AIController {
  constructor(private aiService: AIService) {}

  @Post('analyze-strategy')
  async analyzeStrategy(@Body() body: any) {
    const { strategyCode, historicalData } = body;
    return await this.aiService.analyzeStrategy(
      strategyCode,
      historicalData,
    );
  }

  @Post('detect-patterns')
  async detectPatterns(@Body() body: any) {
    const { asset, candleData } = body;
    return await this.aiService.detectPatterns(asset, candleData);
  }

  @Post('generate-signal')
  async generateSignal(@Body() body: any) {
    const { asset, priceData, timeframe } = body;
    return await this.aiService.generateSignal(asset, priceData, timeframe);
  }

  @Get('patterns/:asset')
  async getPatternsHistory(@Param('asset') asset: string) {
    return await this.aiService.getPatternsHistory(asset);
  }

  @Get('signals/asset/:asset')
  async getSignalsForAsset(
    @Param('asset') asset: string,
    @Query('limit') limit: string = '10',
  ) {
    return await this.aiService.getSignalsForAsset(asset, parseInt(limit));
  }

  @Post('backtest')
  async backtestStrategy(@Body() body: any) {
    const { strategyCode, historicalData, initialCapital } = body;
    return await this.aiService.backtestStrategy(
      strategyCode,
      historicalData,
      initialCapital,
    );
  }

  @Get('health')
  async checkAIHealth() {
    return {
      status: 'healthy',
      modules: [
        'candlestick_patterns',
        'chart_patterns',
        'indicators',
        'scoring_engine',
        'signal_generator',
        'dca_simulator',
        'report_generator',
      ],
    };
  }
}
