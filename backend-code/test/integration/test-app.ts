/**
 * Helper partagé pour les tests d'intégration (vraie base Postgres/Redis de test,
 * cf docker-compose.test.yml + .env.test). Réplique la config de production
 * (main.ts) : ValidationPipe, HttpExceptionFilter, TransformInterceptor,
 * cookie-parser — pour que les assertions reflètent le vrai comportement HTTP
 * (notamment l'enveloppe `{ data: ... }` posée par TransformInterceptor).
 */
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule, SchedulerRegistry } from '@nestjs/schedule';
import cookieParser from 'cookie-parser';

import { AuthModule } from '../../src/auth/auth.module';
import { SignalsModule } from '../../src/signals/signals.module';
import { RedisModule } from '../../src/redis/redis.module';
import { PrismaService } from '../../src/database/prisma.service';
import { HttpExceptionFilter } from '../../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../../src/common/interceptors/transform.interceptor';

export interface IntegrationTestContext {
  app: INestApplication;
  prisma: PrismaService;
}

export async function createIntegrationTestApp(): Promise<IntegrationTestContext> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [
      // ignoreEnvFile: les variables viennent uniquement de .env.test (chargé
      // par jest-env-setup.ts). Sans ça, ConfigModule charge aussi le .env
      // local par défaut — ce qui masque en local des variables manquantes
      // de .env.test qui feraient planter le module en CI (où .env n'existe
      // pas). C'est exactement ce qui s'est passé avec GITHUB_CLIENT_ID.
      ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
      // SignalSchedulerService injecte SchedulerRegistry (@nestjs/schedule) —
      // il faut ce module pour que la DI se résolve, même si on ne veut pas
      // du vrai scan périodique pendant les tests (cf. nettoyage ci-dessous).
      ScheduleModule.forRoot(),
      RedisModule,
      AuthModule,
      SignalsModule,
    ],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());
  await app.init();

  // SignalSchedulerService.onModuleInit() enregistre un setInterval (scan
  // périodique, 15min par défaut) via SchedulerRegistry — on le supprime tout
  // de suite pour ne pas garder le process Jest vivant après les tests.
  const schedulerRegistry = moduleFixture.get<SchedulerRegistry>(SchedulerRegistry, { strict: false });
  if (schedulerRegistry.getIntervals().includes('signal-scan')) {
    schedulerRegistry.deleteInterval('signal-scan');
  }

  const prisma = moduleFixture.get<PrismaService>(PrismaService);
  return { app, prisma };
}

/** Vide les tables touchées par les tests d'intégration (ordre FK-safe). */
export async function cleanDatabase(prisma: PrismaService): Promise<void> {
  await prisma.signal.deleteMany({});
  await prisma.authLog.deleteMany({});
  await prisma.user.deleteMany({});
}
