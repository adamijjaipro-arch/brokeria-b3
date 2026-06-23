import { Module } from '@nestjs/common';
import { SimulatorController } from './simulator.controller';
import { SimulatorService } from './simulator.service';
import { DatabaseModule } from '../database/prisma.module';

@Module({
  imports:     [DatabaseModule],
  controllers: [SimulatorController],
  providers:   [SimulatorService],
})
export class SimulatorModule {}
