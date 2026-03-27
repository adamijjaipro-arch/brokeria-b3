import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/prisma.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { StrategiesModule } from './strategies/strategies.module';
import { SignalsModule } from './signals/signals.module';
import { AIModule } from './ai/ai.module';
import { SimulatorModule } from './simulator/simulator.module';
import { ReportsModule } from './reports/reports.module';
import { PaymentsModule } from './payments/payments.module';
// ── Nouveaux modules MFA + Observabilité ──────────────────────────────────────
import { MetricsModule } from './metrics/metrics.module';
import { LoggingModule } from './logging/logging.module';
import { TotpModule } from './mfa/totp/totp.module';
import { WebAuthnModule } from './mfa/webauthn/webauthn.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // @Global() modules — disponibles partout sans import explicite
    RedisModule,
    MetricsModule,
    LoggingModule,
    // Core
    DatabaseModule,
    AuthModule,
    UsersModule,
    StrategiesModule,
    SignalsModule,
    AIModule,
    SimulatorModule,
    ReportsModule,
    PaymentsModule,
    // MFA
    TotpModule,
    WebAuthnModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
