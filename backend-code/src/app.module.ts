import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
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
import { FormationModule } from './formation/formation.module';
import { MarketsModule }   from './markets/markets.module';
import { PortfolioModule } from './portfolio/portfolio.module';
import { PatternsModule }  from './patterns/patterns.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
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
    // Formation
    FormationModule,
    // Markets (CoinGecko proxy + Redis cache)
    MarketsModule,
    // Portfolio (historique du capital + KPIs dashboard)
    PortfolioModule,
    // Patterns (Module 3 — détection de signaux via Python AI engine)
    PatternsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
