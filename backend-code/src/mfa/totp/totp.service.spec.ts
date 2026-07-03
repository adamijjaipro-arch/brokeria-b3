/**
 * Tests unitaires — TotpService
 * Couverture : enrollInit, enrollConfirm, verify, disable, chiffrement AES
 */
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { authenticator } from 'otplib';
import { TotpService } from './totp.service';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { LoggingService } from '../../logging/logging.service';

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    update:     jest.fn(),
  },
};

const mockRedis = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
};

const mockLogging = {
  authSuccess:  jest.fn(),
  authFailure:  jest.fn(),
  mfaEnrolled:  jest.fn(),
  mfaRevoked:   jest.fn(),
};

const MOCK_ENCRYPTION_KEY = 'a'.repeat(64); // 32 bytes en hex

const mockConfig = {
  get: jest.fn((key: string) => {
    const map: Record<string, string> = {
      TOTP_ENCRYPTION_KEY: MOCK_ENCRYPTION_KEY,
      APP_NAME: 'TestApp',
    };
    return map[key];
  }),
};

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('TotpService', () => {
  let service: TotpService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TotpService,
        { provide: PrismaService,  useValue: mockPrisma },
        { provide: RedisService,   useValue: mockRedis },
        { provide: LoggingService, useValue: mockLogging },
        { provide: ConfigService,  useValue: mockConfig },
      ],
    }).compile();
    service = module.get<TotpService>(TotpService);
  });

  // ── enrollInit ─────────────────────────────────────────────────────────────

  describe('enrollInit', () => {
    it('retourne un qrCode et un secret pour un utilisateur sans TOTP', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user1',
        email: 'test@example.com',
        username: 'tester',
        totpEnabled: false,
      });
      mockRedis.set.mockResolvedValue(undefined);

      const result = await service.enrollInit('user1');

      expect(result.qrCodeDataUrl).toMatch(/^data:image\/png;base64,/);
      expect(result.secret).toHaveLength(32); // base32, 20 bytes
      expect(mockRedis.set).toHaveBeenCalledWith(
        'totp_enroll:user1',
        result.secret,
        600,
      );
    });

    it('rejette si le TOTP est déjà activé', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user1',
        email: 'test@example.com',
        totpEnabled: true,
      });

      await expect(service.enrollInit('user1')).rejects.toThrow(BadRequestException);
    });

    it('rejette si l\'utilisateur est introuvable', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(service.enrollInit('unknown')).rejects.toThrow();
    });
  });

  // ── enrollConfirm ──────────────────────────────────────────────────────────

  describe('enrollConfirm', () => {
    it('active le TOTP avec un code valide', async () => {
      const secret = authenticator.generateSecret();
      const validCode = authenticator.generate(secret);

      mockRedis.get.mockResolvedValue(secret);
      mockPrisma.user.update.mockResolvedValue({});
      mockRedis.del.mockResolvedValue(undefined);

      await service.enrollConfirm('user1', validCode, '127.0.0.1');

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user1' },
          data: expect.objectContaining({ totpEnabled: true }),
        }),
      );
      expect(mockLogging.mfaEnrolled).toHaveBeenCalledWith('user1', 'totp', '127.0.0.1');
      expect(mockRedis.del).toHaveBeenCalledWith('totp_enroll:user1');
    });

    it('rejette un code invalide', async () => {
      const secret = authenticator.generateSecret();
      mockRedis.get.mockResolvedValue(secret);

      await expect(
        service.enrollConfirm('user1', '000000', '127.0.0.1'),
      ).rejects.toThrow(UnauthorizedException);
      expect(mockLogging.authFailure).toHaveBeenCalled();
    });

    it('rejette si le secret Redis est expiré', async () => {
      mockRedis.get.mockResolvedValue(null);
      await expect(
        service.enrollConfirm('user1', '123456', '127.0.0.1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ── verify ─────────────────────────────────────────────────────────────────

  describe('verify', () => {
    it('valide un code TOTP correct', async () => {
      const secret = authenticator.generateSecret();
      const validCode = authenticator.generate(secret);

      // On doit simuler le cycle encrypt/decrypt : utiliser un secret chiffré réel
      const encryptedSecret = (service as unknown as { encrypt(s: string): string }).encrypt(secret);

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user1',
        totpEnabled: true,
        totpSecret: encryptedSecret,
      });

      const result = await service.verify('user1', validCode, '127.0.0.1');
      expect(result).toBe(true);
      expect(mockLogging.authSuccess).toHaveBeenCalledWith('user1', 'totp', '127.0.0.1');
    });

    it('rejette un code invalide', async () => {
      const secret = authenticator.generateSecret();
      const encryptedSecret = (service as unknown as { encrypt(s: string): string }).encrypt(secret);

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user1',
        totpEnabled: true,
        totpSecret: encryptedSecret,
      });

      await expect(
        service.verify('user1', '000000', '127.0.0.1'),
      ).rejects.toThrow(UnauthorizedException);
      expect(mockLogging.authFailure).toHaveBeenCalled();
    });

    it('rejette si TOTP n\'est pas configuré', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user1',
        totpEnabled: false,
        totpSecret: null,
      });
      await expect(
        service.verify('user1', '123456', '127.0.0.1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ── disable ────────────────────────────────────────────────────────────────

  describe('disable', () => {
    it('désactive le TOTP avec un code valide', async () => {
      const secret = authenticator.generateSecret();
      const validCode = authenticator.generate(secret);
      const encryptedSecret = (service as unknown as { encrypt(s: string): string }).encrypt(secret);

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user1',
        totpEnabled: true,
        totpSecret: encryptedSecret,
      });
      mockPrisma.user.update.mockResolvedValue({});
      mockLogging.authSuccess.mockResolvedValue(undefined);

      await service.disable('user1', validCode, '127.0.0.1');

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { totpSecret: null, totpEnabled: false },
        }),
      );
      expect(mockLogging.mfaRevoked).toHaveBeenCalledWith('user1', 'totp', '127.0.0.1');
    });

    it('lève UnauthorizedException si le code TOTP fourni est invalide', async () => {
      const secret = authenticator.generateSecret();
      const encryptedSecret = (service as unknown as { encrypt(s: string): string }).encrypt(secret);

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user1',
        totpEnabled: true,
        totpSecret: encryptedSecret,
      });

      await expect(
        service.disable('user1', '000000', '127.0.0.1'),
      ).rejects.toThrow(UnauthorizedException);

      expect(mockPrisma.user.update).not.toHaveBeenCalled();
      expect(mockLogging.authFailure).toHaveBeenCalled();
    });
  });

  // ── Chiffrement AES-256-GCM ────────────────────────────────────────────────

  describe('encrypt/decrypt', () => {
    it('chiffre et déchiffre correctement un secret', () => {
      const original = authenticator.generateSecret();
      const encrypt = (s: string) => (service as unknown as { encrypt(s: string): string }).encrypt(s);
      const decrypt = (s: string) => (service as unknown as { decrypt(s: string): string }).decrypt(s);

      const encrypted = encrypt(original);
      expect(encrypted).not.toBe(original);
      expect(encrypted).toMatch(/^[0-9a-f]+:[0-9a-f]+:[0-9a-f]+$/);

      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(original);
    });

    it('produit des chiffrés différents pour le même plaintext (IV aléatoire)', () => {
      const encrypt = (s: string) => (service as unknown as { encrypt(s: string): string }).encrypt(s);
      const secret = 'MYSECRET123456789';
      const e1 = encrypt(secret);
      const e2 = encrypt(secret);
      expect(e1).not.toBe(e2); // IV différent → chiffrés différents
    });
  });
});
