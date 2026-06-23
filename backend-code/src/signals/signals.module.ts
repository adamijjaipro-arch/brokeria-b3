import { Module } from '@nestjs/common';
import { SignalsController } from './signals.controller';
import { SignalsService } from './signals.service';
import { SignalSchedulerService } from './signal-scheduler.service';
import { DatabaseModule } from '../database/prisma.module';
import { EmailModule } from '../email/email.module';
import { PatternsModule } from '../patterns/patterns.module';

@Module({
  imports: [DatabaseModule, EmailModule, PatternsModule],
  controllers: [SignalsController],
  providers: [SignalsService, SignalSchedulerService],
  exports: [SignalsService, SignalSchedulerService],
})
export class SignalsModule {}
