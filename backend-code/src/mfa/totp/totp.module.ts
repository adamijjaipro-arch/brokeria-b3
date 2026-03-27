import { Module } from '@nestjs/common';
import { TotpController } from './totp.controller';
import { TotpService } from './totp.service';
import { DatabaseModule } from '../../database/prisma.module';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [TotpController],
  providers: [TotpService],
  exports: [TotpService],
})
export class TotpModule {}
