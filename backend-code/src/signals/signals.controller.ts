import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { SignalsService } from './signals.service';
import { SignalSchedulerService } from './signal-scheduler.service';
import { JwtGuard } from '../auth/jwt.guard';
import { CreateSignalDto } from './dto/create-signal.dto';
import { GenerateSignalDto } from './dto/generate-signal.dto';

@Controller('signals')
@UseGuards(JwtGuard)
export class SignalsController {
  constructor(
    private signalsService: SignalsService,
    private scheduler: SignalSchedulerService,
  ) {}

  @Get()
  async getSignals(@Request() req: any) {
    return this.signalsService.getUserSignals(req.user.id);
  }

  @Get('recent')
  async getRecentSignals(@Request() req: any) {
    return this.signalsService.getRecentSignals(req.user.id, 5);
  }

  @Post()
  async createSignal(
    @Body() createSignalDto: CreateSignalDto,
    @Request() req: any,
  ) {
    return this.signalsService.createSignal(req.user.id, createSignalDto);
  }

  @Get('statistics')
  async getSignalsStatistics(@Request() req: any) {
    return this.signalsService.getSignalsStatistics(req.user.id);
  }

  /**
   * GET /signals/:id
   * Kept after 'recent' / 'statistics' so those static paths aren't shadowed
   * by this dynamic param route.
   */
  @Get(':id')
  async getSignalById(@Param('id') id: string, @Request() req: any) {
    return this.signalsService.getSignalById(req.user.id, id);
  }

  /**
   * POST /signals/generate
   * Body: { strategyId, asset, timeframe, mockResult? }
   *
   * Runs pattern detection (Module 3) then maps + persists a Signal if applicable.
   * mockResult bypasses CoinGecko and injects a PatternDetectionResult directly (tests).
   */
  @Post('generate')
  async generateSignal(
    @Body() dto: GenerateSignalDto,
    @Request() req: any,
  ) {
    return this.signalsService.generateSignal(req.user.id, dto);
  }

  /**
   * POST /signals/scan-now
   * Triggers an immediate scheduler scan of all active strategies.
   * Runs the same logic as the periodic cron, returns per-strategy results.
   */
  @Post('scan-now')
  async scanNow() {
    return this.scheduler.runScan();
  }
}
