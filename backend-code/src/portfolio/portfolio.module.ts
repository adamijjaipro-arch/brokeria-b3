import { Module } from '@nestjs/common';
import { PortfolioController } from './portfolio.controller';
import { PortfolioService } from './portfolio.service';
import { PortfolioScheduler } from './portfolio.scheduler';
import { DatabaseModule } from '../database/prisma.module';

@Module({
  imports: [DatabaseModule],
  controllers: [PortfolioController],
  providers: [PortfolioService, PortfolioScheduler],
})
export class PortfolioModule {}
