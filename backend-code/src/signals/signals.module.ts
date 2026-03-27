import { Module } from '@nestjs/common';
import { SignalsController } from './signals.controller';
import { SignalsService } from './signals.service';
import { DatabaseModule } from '../database/prisma.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [DatabaseModule, EmailModule],
  controllers: [SignalsController],
  providers: [SignalsService],
})
export class SignalsModule {}
