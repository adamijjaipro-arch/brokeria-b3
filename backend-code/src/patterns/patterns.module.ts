import { Module } from '@nestjs/common';
import { PatternsController } from './patterns.controller';
import { PatternDetectionService } from './pattern-detection.service';
import { DatabaseModule } from '../database/prisma.module';
import { MarketsModule } from '../markets/markets.module';

@Module({
  imports: [DatabaseModule, MarketsModule],
  controllers: [PatternsController],
  providers: [PatternDetectionService],
  exports: [PatternDetectionService],
})
export class PatternsModule {}
