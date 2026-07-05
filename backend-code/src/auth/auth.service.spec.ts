/**
 * Tests d'intégration légers — AuthService
 * Vérifie les flux complets : register, login, 2FA, PIN
 * Les dépendances sont mockées pour rester en tests unitaires rapides.
 */
import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../redis/redis.service';
import { EmailService } from '../email/email.service';
import { LoggingService } from '../logging/logging.service';

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockPrisma = {
  user:    { findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), findFirst: jest.fn() },
  authLog: { create: jest.fn().mockResolvedValue({}) },
};

const mockRedis = {
  get: jest.fn(),
  set: jest.fn().mockResolvedValue(undefined),
  del: jest.fn().mockResolvedValue(undefined),
  exists: jest.fn().mockResolvedValue(false),
};

const mockEmail = {
  sendOTP:       jest.fn().mockResolvedValue(undefined),
  sendMagicLink: jest.fn().mockResolvedValue(undefined),
};

const mockJwt = {
  sign:   jest.fn().mockReturnValue('mock-jwt-token'),
  verify: jest.fn(),
};

const mockConfig = {
  get: jest.fn((key: string) => {
    const map: Record<string, string> = {
      JWT_SECRET:         'test-secret',
      JWT_REFRESH_SECRET: 'test-refresh-secret',
      NODE_ENV:           'test',
      FRONTEND_URL:       'http://localhost:3006',
    };
    return map[key];
  }),
};

const mockLogging = {
  authSuccess:    jest.fn().mockResolvedValue(undefined),
  authFailure:    jest.fn().mockResolvedValue(undefined),
  mfaEnrolled:    jest.fn().mockResolvedValue(undefined),
  mfaRevoked:     jest.fn().mockResolvedValue(undefined),
  accountLocked:  jest.fn().mockResolvedValue(undefined),
  sessionCreated: jest.fn().mockResolvedValue(undefined),
  sessionExpired: jest.fn().mockResolvedValue(undefined),
  suspiciousIp:   jest.fn().mockResolvedValue(undefined),
};

const mockRes = { cookie: jest.fn() } as unknown as import('express').Response;

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RedisService,  useValue: mockRedis },
        { provide: EmailService,  useValue: mockEmail },
        { provide: JwtService,    useValue: mockJwt },
        { provide: ConfigService, useValue: mockConfig },
        { provide: LoggingService, useValue: mockLogging },
      ],
    }).compile();
    service = module.get<AuthService>(AuthService);
  });

  // ── register ───────────────────────────────────────────────────────────────

  describe('register', () => {
    it('crée un utilisateur et retourne un accessToken', async () => {
      const newUser = { id: 'u1', email: 'bob@example.com', username: 'bob' };
      mockPrisma.user.create.mockResolvedValue(newUser);

      const result = await service.register(
        { email: 'bob@example.com', username: 'bob', password: 'P@ssw0rd!23' },
        mockRes,
        '127.0.0.1',
      );

      expect(result).toHaveProperty('accessToken');
      expect(typeof result.accessToken).toBe('string');
      expect(result.user).toMatchObject({ id: 'u1', email: 'bob@example.com' });
    });

    it('lève ConflictException si email/username existe déjà', async () => {
      mockPrisma.user.create.mockRejectedValue({ code: 'P2002' });

      await expect(
        service.register({ email: 'dup@example.com', username: 'dup', password: 'P@ssw0rd!' }, mockRes, '127.0.0.1'),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ── login ──────────────────────────────────────────────────────────────────

  describe('login', () => {
    it('retourne un accessToken si credentials corrects', async () => {
      const hash = await bcrypt.hash('P@ssw0rd!23', 12);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u1', email: 'alice@example.com', username: 'alice', passwordHash: hash,
      });
      mockRedis.get.mockResolvedValue(null); // pas lockée

      const result = await service.login({ email: 'alice@example.com', password: 'P@ssw0rd!23' }, mockRes, '127.0.0.1');

      expect(result).toHaveProperty('accessToken');
      expect(result.user).toMatchObject({ id: 'u1', email: 'alice@example.com' });
    });

    it('lève UnauthorizedException si mot de passe incorrect', async () => {
      const hash = await bcrypt.hash('correct', 12);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u2', email: 'bob@example.com', passwordHash: hash,
      });
      mockRedis.get.mockResolvedValue(null); // pas lockée

      await expect(
        service.login({ email: 'bob@example.com', password: 'wrong' }, mockRes, '127.0.0.1'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('lève UnauthorizedException si email inconnu', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(
        service.login({ email: 'ghost@example.com', password: 'any' }, mockRes, '127.0.0.1'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('lève 423 si le compte est verrouillé', async () => {
      const hash = await bcrypt.hash('p', 12);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u3', email: 'locked@example.com', passwordHash: hash,
      });
      // Simule le compte verrouillé dans Redis
      mockRedis.get.mockResolvedValue('true');

      await expect(
        service.login({ email: 'locked@example.com', password: 'p' }, mockRes, '127.0.0.1'),
      ).rejects.toMatchObject({ status: 423 });
    });
  });

  // ── verify2FA ─────────────────────────────────────────────────────────────

  describe('verify2FA', () => {
    it('retourne un pinAuthToken si OTP correct', async () => {
      const stored = JSON.stringify({ userId: 'u1', email: 'alice@example.com', otp: '123456' });
      mockRedis.get.mockImplementation((key: string) => {
        if (key.startsWith('preauth:')) return Promise.resolve(stored);
        return Promise.resolve(null); // pas lockée
      });
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1', pin: 'hash' });

      const result = await service.verify2FA('pre-token', '123456', '127.0.0.1');

      expect(result).toHaveProperty('pinAuthToken');
      expect(typeof result.requiresPinSetup).toBe('boolean');
    });

    it('lève UnauthorizedException si OTP incorrect', async () => {
      const stored = JSON.stringify({ userId: 'u1', email: 'alice@example.com', otp: '999999' });
      mockRedis.get.mockImplementation((key: string) => {
        if (key.startsWith('preauth:')) return Promise.resolve(stored);
        return Promise.resolve(null);
      });

      await expect(
        service.verify2FA('pre-token', '000000', '127.0.0.1'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('lève UnauthorizedException si preAuthToken expiré', async () => {
      mockRedis.get.mockResolvedValue(null);
      await expect(
        service.verify2FA('expired-token', '123456', '127.0.0.1'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ── verifyPin ─────────────────────────────────────────────────────────────

  describe('verifyPin', () => {
    it('émet les tokens si PIN correct', async () => {
      const pinHash = await bcrypt.hash('1234', 10);
      const stored  = JSON.stringify({ userId: 'u1', email: 'alice@example.com' });

      mockRedis.get.mockImplementation((key: string) => {
        if (key.startsWith('pinauth:')) return Promise.resolve(stored);
        return Promise.resolve(null);
      });
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u1', email: 'alice@example.com', username: 'alice', pin: pinHash,
      });

      const mockRes = {
        cookie: jest.fn(),
      } as unknown as import('express').Response;

      const result = await service.verifyPin('pin-token', '1234', mockRes, '127.0.0.1');

      expect(result).toHaveProperty('accessToken');
      expect(result.user).toMatchObject({ id: 'u1', email: 'alice@example.com' });
    });

    it('lève UnauthorizedException si PIN incorrect', async () => {
      const pinHash = await bcrypt.hash('correct', 10);
      const stored  = JSON.stringify({ userId: 'u1', email: 'alice@example.com' });

      mockRedis.get.mockImplementation((key: string) => {
        if (key.startsWith('pinauth:')) return Promise.resolve(stored);
        return Promise.resolve(null);
      });
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1', pin: pinHash });

      const mockRes = { cookie: jest.fn() } as unknown as import('express').Response;

      await expect(
        service.verifyPin('pin-token', 'wrong', mockRes, '127.0.0.1'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('lève UnauthorizedException si le pinAuthToken est expiré (absent de Redis)', async () => {
      mockRedis.get.mockResolvedValue(null); // token expiré — clé absente de Redis

      const mockRes = { cookie: jest.fn() } as unknown as import('express').Response;

      await expect(
        service.verifyPin('expired-pin-token', '1234', mockRes, '127.0.0.1'),
      ).rejects.toThrow(UnauthorizedException);

      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
    });

    it('pose un cookie httpOnly lors d\'une vérification PIN réussie', async () => {
      const pinHash = await bcrypt.hash('9999', 10);
      const stored  = JSON.stringify({ userId: 'u5', email: 'cookie@example.com' });

      mockRedis.get.mockImplementation((key: string) =>
        key.startsWith('pinauth:') ? Promise.resolve(stored) : Promise.resolve(null),
      );
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u5', email: 'cookie@example.com', username: 'cookieuser', pin: pinHash,
      });

      const mockRes = { cookie: jest.fn() } as unknown as import('express').Response;

      await service.verifyPin('pin-token', '9999', mockRes, '127.0.0.1');

      expect(mockRes.cookie).toHaveBeenCalled();
      const [cookieName, , cookieOptions] = (mockRes.cookie as jest.Mock).mock.calls[0];
      expect(typeof cookieName).toBe('string');
      expect(cookieOptions).toMatchObject({ httpOnly: true });
    });
  });
});
