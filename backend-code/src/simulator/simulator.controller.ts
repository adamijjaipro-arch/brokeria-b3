import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { SimulatorService } from './simulator.service';
import { JwtGuard } from '../auth/jwt.guard';
import { DCASimulatorDto } from './dto/dca-simulator.dto';

@Controller('simulator')
@UseGuards(JwtGuard)
export class SimulatorController {
  constructor(private readonly simulatorService: SimulatorService) {}

  @Post('dca')
  simulateDCA(@Body() dto: DCASimulatorDto, @Request() req: any) {
    return this.simulatorService.simulateDCA(req.user.id, dto);
  }

  @Get('history')
  getHistory(@Request() req: any) {
    return this.simulatorService.getHistory(req.user.id);
  }
}
