import { Module } from '@nestjs/common';
import { WebAuthnController } from './webauthn.controller';
import { WebAuthnService } from './webauthn.service';
import { DatabaseModule } from '../../database/prisma.module';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [WebAuthnController],
  providers: [WebAuthnService],
  exports: [WebAuthnService],
})
export class WebAuthnModule {}
