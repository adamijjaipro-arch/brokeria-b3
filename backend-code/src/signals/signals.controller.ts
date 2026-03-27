import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { SignalsService } from './signals.service';
import { JwtGuard } from '../auth/jwt.guard';
import { CreateSignalDto } from './dto/create-signal.dto';

@Controller('signals')
@UseGuards(JwtGuard)
export class SignalsController {
  constructor(private signalsService: SignalsService) {}

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
}
