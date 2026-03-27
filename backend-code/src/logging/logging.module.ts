import { Global, Module } from '@nestjs/common';
import { LoggingService } from './logging.service';
import { DatabaseModule } from '../database/prisma.module';
import { MetricsModule } from '../metrics/metrics.module';

@Global()
@Module({
  imports: [DatabaseModule, MetricsModule],
  providers: [LoggingService],
  exports: [LoggingService],
})
export class LoggingModule {}
