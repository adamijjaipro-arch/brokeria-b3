import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { DatabaseModule } from '../database/prisma.module';
import { EmailModule } from '../email/email.module';
import { LoggingModule } from '../logging/logging.module';

// Stratégies Passport
import { JwtStrategy } from './strategies/jwt.strategy';
import { GithubStrategy } from './strategies/github.strategy';

// Guards exportés pour usage dans les autres modules
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Module({
  imports: [
    DatabaseModule,
    EmailModule,
    LoggingModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    ConfigModule,
    // JwtModule configuré avec ConfigService → lit JWT_SECRET depuis .env
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') ?? 'dev-secret-change-me',
        // Note : pas d'expiresIn global — chaque sign() le précise
        // pour gérer les deux durées différentes (access vs refresh)
        signOptions: {},
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    GithubStrategy,
    JwtAuthGuard,
  ],
  exports: [AuthService, JwtAuthGuard, JwtModule],
})
export class AuthModule {}
