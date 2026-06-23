import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { JwtAuthGuard }  from '../auth/guards/jwt-auth.guard';
import { MarketsService } from './markets.service';

@Controller('markets')
@UseGuards(JwtAuthGuard)
export class MarketsController {
  constructor(private readonly markets: MarketsService) {}

  /**
   * GET /markets/top
   * Top 20 cryptos by market cap (CoinGecko + Redis cache 60 s)
   */
  @Get('top')
  getTop() {
    return this.markets.getTopCoins();
  }

  /**
   * GET /markets/detail/:coinId
   * Full coin detail: price, 24h change, high/low, volume, market cap, ATH
   * Redis cache 30 s
   */
  @Get('detail/:coinId')
  getDetail(@Param('coinId') coinId: string) {
    return this.markets.getCoinDetail(coinId);
  }

  /**
   * GET /markets/ohlcv/:coinId?days=7
   * OHLCV data: tries /ohlc first (candle mode), falls back to /market_chart (line mode)
   * TTL: 60 s (days=1) → 3 min → 10 min → 30 min (days≥90)
   */
  @Get('ohlcv/:coinId')
  getOhlcv(
    @Param('coinId') coinId: string,
    @Query('days', new DefaultValuePipe(14), ParseIntPipe) days: number,
  ) {
    return this.markets.getOhlcv(coinId, days);
  }
}
