import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { SimulatorService } from './simulator.service';
import { JwtGuard } from '../auth/jwt.guard';
import { DCASimulatorDto } from './dto/dca-simulator.dto';

@Controller('simulator')
@UseGuards(JwtGuard)
export class SimulatorController {
  constructor(private simulatorService: SimulatorService) {}

  @Post('dca')
  async simulateDCA(@Body() dcaDto: DCASimulatorDto) {
    return this.simulatorService.simulateDCA(dcaDto);
  }
}
