/**
 * Tests d'intégration légers — AuthService
 * Vérifie les flux complets : register, login, 2FA, PIN
 * Les dépendances sont mockées pour rester en tests unitaires rapides.
 */
import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { AuthService } from './auth.service';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../redis/redis.service';
import { EmailService } from '../email/email.service';
import { LoggingService } from '../logging/logging.service';
import { RegisterDto } from './dto/register.dto';

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

    it("précise le message si c'est l'email qui est en conflit", async () => {
      mockPrisma.user.create.mockRejectedValue({ code: 'P2002', meta: { target: ['email'] } });

      await expect(
        service.register({ email: 'dup@example.com', username: 'newuser', password: 'P@ssw0rd!' }, mockRes, '127.0.0.1'),
      ).rejects.toThrow(/déjà utilisé/);
    });

    it('précise le message si c\'est le username qui est en conflit', async () => {
      mockPrisma.user.create.mockRejectedValue({ code: 'P2002', meta: { target: ['username'] } });

      await expect(
        service.register({ email: 'new@example.com', username: 'dupuser', password: 'P@ssw0rd!' }, mockRes, '127.0.0.1'),
      ).rejects.toThrow(/existe déjà/);
    });
  });

  // ── login ──────────────────────────────────────────────────────────────────

  describe('login', () => {
    it('retourne requiresMFA + preAuthToken si credentials corrects', async () => {
      const hash = await bcrypt.hash('P@ssw0rd!23', 12);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u1', email: 'alice@example.com', username: 'alice', passwordHash: hash,
      });
      mockRedis.get.mockResolvedValue(null); // pas lockée

      const result = await service.login({ email: 'alice@example.com', password: 'P@ssw0rd!23' }, mockRes, '127.0.0.1');

      expect(result.requiresMFA).toBe(true);
      expect(result.preAuthToken).toBeDefined();
      expect(result.message).toContain('Code OTP');
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

    it('verrouille le compte au 3e échec (maxFailures par défaut = 3)', async () => {
      const hash = await bcrypt.hash('correct', 12);
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u9', email: 'brute@example.com', passwordHash: hash });
      mockRedis.get.mockImplementation((key: string) => {
        if (key.startsWith('locked:')) return Promise.resolve(null); // pas encore verrouillé
        if (key.startsWith('fail:password:')) return Promise.resolve('2'); // 2 échecs déjà enregistrés
        return Promise.resolve(null);
      });

      await expect(
        service.login({ email: 'brute@example.com', password: 'wrong' }, mockRes, '127.0.0.1'),
      ).rejects.toMatchObject({ status: 423 });

      expect(mockRedis.set).toHaveBeenCalledWith('locked:u9', 'true', 1800);
    });

    it('efface le compteur d\'échecs (clearFailures) après un login réussi', async () => {
      const hash = await bcrypt.hash('P@ssw0rd!23', 12);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u1', email: 'alice@example.com', username: 'alice', passwordHash: hash,
      });
      mockRedis.get.mockResolvedValue(null); // pas lockée

      await service.login({ email: 'alice@example.com', password: 'P@ssw0rd!23' }, mockRes, '127.0.0.1');

      expect(mockRedis.del).toHaveBeenCalledWith('fail:password:u1');
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

    it("requiresPinSetup vaut true si l'utilisateur n'a pas encore de PIN", async () => {
      const stored = JSON.stringify({ userId: 'u1', email: 'alice@example.com', otp: '123456' });
      mockRedis.get.mockImplementation((key: string) =>
        key.startsWith('preauth:') ? Promise.resolve(stored) : Promise.resolve(null),
      );
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1', pin: null });

      const result = await service.verify2FA('pre-token', '123456', '127.0.0.1');

      expect(result.requiresPinSetup).toBe(true);
    });

    it('requiresPinSetup vaut false si un PIN existe déjà', async () => {
      const stored = JSON.stringify({ userId: 'u1', email: 'alice@example.com', otp: '123456' });
      mockRedis.get.mockImplementation((key: string) =>
        key.startsWith('preauth:') ? Promise.resolve(stored) : Promise.resolve(null),
      );
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1', pin: 'existing-hash' });

      const result = await service.verify2FA('pre-token', '123456', '127.0.0.1');

      expect(result.requiresPinSetup).toBe(false);
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

    it("lève BadRequestException si aucun PIN n'est configuré sur le compte", async () => {
      const stored = JSON.stringify({ userId: 'u1', email: 'alice@example.com' });
      mockRedis.get.mockImplementation((key: string) =>
        key.startsWith('pinauth:') ? Promise.resolve(stored) : Promise.resolve(null),
      );
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1', pin: null });

      const mockRes = { cookie: jest.fn() } as unknown as import('express').Response;

      await expect(
        service.verifyPin('pin-token', '1234', mockRes, '127.0.0.1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ── setupPin ──────────────────────────────────────────────────────────────

  describe('setupPin', () => {
    it('hache le PIN avant stockage et émet les tokens', async () => {
      const stored = JSON.stringify({ userId: 'u1', email: 'alice@example.com' });
      mockRedis.get.mockImplementation((key: string) =>
        key.startsWith('pinauth:') ? Promise.resolve(stored) : Promise.resolve(null),
      );
      mockPrisma.user.update.mockResolvedValue({});
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1', email: 'alice@example.com', username: 'alice' });

      const result = await service.setupPin('pin-token', '1234', mockRes, '127.0.0.1');

      expect(result).toHaveProperty('accessToken');
      const updateCall = mockPrisma.user.update.mock.calls[0][0];
      expect(updateCall.data.pin).not.toBe('1234'); // jamais stocké en clair
      expect(await bcrypt.compare('1234', updateCall.data.pin)).toBe(true);
    });

    it("lève UnauthorizedException si le token d'enrôlement PIN est expiré", async () => {
      mockRedis.get.mockResolvedValue(null);

      await expect(
        service.setupPin('expired-token', '1234', mockRes, '127.0.0.1'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('lève 423 si le compte est verrouillé au moment du setup PIN', async () => {
      const stored = JSON.stringify({ userId: 'u9', email: 'locked@example.com' });
      mockRedis.get.mockImplementation((key: string) => {
        if (key.startsWith('pinauth:')) return Promise.resolve(stored);
        if (key.startsWith('locked:')) return Promise.resolve('true');
        return Promise.resolve(null);
      });

      await expect(
        service.setupPin('pin-token', '1234', mockRes, '127.0.0.1'),
      ).rejects.toMatchObject({ status: 423 });
    });
  });

  // ── refresh ───────────────────────────────────────────────────────────────

  describe('refresh', () => {
    it('lève UnauthorizedException si le cookie refresh_token est absent', async () => {
      const req = { cookies: {} } as any;

      await expect(service.refresh(req, mockRes)).rejects.toThrow('Refresh token manquant');
    });

    it('lève UnauthorizedException si le refresh token est invalide ou expiré', async () => {
      const req = { cookies: { refresh_token: 'bad-token' } } as any;
      mockJwt.verify.mockImplementationOnce(() => { throw new Error('jwt expired'); });

      await expect(service.refresh(req, mockRes)).rejects.toThrow('Refresh token invalide ou expiré');
    });

    it('lève UnauthorizedException si le refresh token a été révoqué (absent de Redis)', async () => {
      const req = { cookies: { refresh_token: 'valid-but-revoked' } } as any;
      mockJwt.verify.mockReturnValueOnce({ sub: 'u1', email: 'alice@example.com', jti: 'jti-1' });
      mockRedis.get.mockResolvedValueOnce(null); // clé absente de Redis => révoqué/expiré

      await expect(service.refresh(req, mockRes)).rejects.toThrow('Session expirée, reconnectez-vous');
    });

    it("émet un nouvel accessToken et supprime l'ancienne clé Redis (rotation du jti)", async () => {
      const req = { cookies: { refresh_token: 'valid-token' } } as any;
      mockJwt.verify.mockReturnValueOnce({ sub: 'u1', email: 'alice@example.com', jti: 'jti-1' });
      mockRedis.get.mockResolvedValueOnce('u1'); // jti trouvé, correspond au sub

      const result = await service.refresh(req, mockRes);

      expect(result).toHaveProperty('accessToken');
      expect(mockRedis.del).toHaveBeenCalledWith('refresh:jti-1');
    });
  });

  // ── logout ────────────────────────────────────────────────────────────────

  describe('logout', () => {
    it('supprime le refresh token de Redis avec la clé refresh:{jti}', async () => {
      const req = { cookies: { refresh_token: 'valid-token' } } as any;
      const res = { clearCookie: jest.fn() } as any;
      mockJwt.verify.mockReturnValueOnce({ jti: 'jti-42', sub: 'u1' });

      await service.logout(req, res);

      expect(mockRedis.del).toHaveBeenCalledWith('refresh:jti-42');
    });

    it("ne plante pas si aucun cookie refresh_token n'est présent", async () => {
      const req = { cookies: {} } as any;
      const res = { clearCookie: jest.fn() } as any;

      await expect(service.logout(req, res)).resolves.toBeUndefined();
      expect(res.clearCookie).toHaveBeenCalled();
    });

    it('efface le cookie refresh_token avec httpOnly/sameSite/path corrects', async () => {
      const req = { cookies: {} } as any;
      const res = { clearCookie: jest.fn() } as any;

      await service.logout(req, res);

      expect(res.clearCookie).toHaveBeenCalledWith('refresh_token', { httpOnly: true, sameSite: 'lax', path: '/' });
    });
  });
});

// ─── Validation DTO (class-validator) — complète les tests service-level ─────
// La force du mot de passe est appliquée par ValidationPipe via RegisterDto,
// pas par AuthService.register() lui-même : on teste donc le DTO directement.

describe('RegisterDto — validation (class-validator)', () => {
  it('rejette un mot de passe de moins de 6 caractères (MinLength)', async () => {
    const dto = plainToInstance(RegisterDto, { email: 'test@example.com', username: 'user', password: 'weak' });
    const errors = await validate(dto);

    expect(errors.some((e) => e.property === 'password')).toBe(true);
  });

  it('accepte un mot de passe valide (>= 6 caractères)', async () => {
    const dto = plainToInstance(RegisterDto, { email: 'test@example.com', username: 'user', password: 'P@ssw0rd!' });
    const errors = await validate(dto);

    expect(errors.length).toBe(0);
  });
});
