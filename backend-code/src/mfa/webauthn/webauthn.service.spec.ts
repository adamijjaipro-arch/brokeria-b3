/**
 * Tests unitaires — WebAuthnService
 * Couverture : registrationOptions, registrationVerify, authenticationOptions,
 *              authenticationVerify, listCredentials, removeCredential
 */
import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WebAuthnService } from './webauthn.service';
import { PrismaService }   from '../../database/prisma.service';
import { RedisService }    from '../../redis/redis.service';
import { LoggingService }  from '../../logging/logging.service';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const MOCK_CREDENTIAL = {
  id:           'cred-db-id',
  userId:       'user1',
  credentialId: 'base64url-credential-id',
  publicKey:    Buffer.alloc(77).toString('base64url'),
  counter:      0,
  deviceType:   'singleDevice',
  backedUp:     false,
  transports:   '["usb"]',
  aaguid:       null,
  createdAt:    new Date(),
  lastUsedAt:   null,
};

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
  },
  webAuthnCredential: {
    create:     jest.fn(),
    findMany:   jest.fn(),
    findUnique: jest.fn(),
    update:     jest.fn(),
    delete:     jest.fn(),
  },
};

const mockRedis = {
  get: jest.fn(),
  set: jest.fn().mockResolvedValue(undefined),
  del: jest.fn().mockResolvedValue(undefined),
};

const mockLogging = {
  authSuccess:  jest.fn().mockResolvedValue(undefined),
  authFailure:  jest.fn().mockResolvedValue(undefined),
  mfaEnrolled:  jest.fn().mockResolvedValue(undefined),
  mfaRevoked:   jest.fn().mockResolvedValue(undefined),
};

const mockConfig = {
  get: jest.fn((key: string) => {
    const map: Record<string, string> = {
      WEBAUTHN_RP_NAME: 'BrokerIA Test',
      WEBAUTHN_RP_ID:   'localhost',
      WEBAUTHN_ORIGIN:  'http://localhost:3006',
    };
    return map[key];
  }),
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('WebAuthnService', () => {
  let service: WebAuthnService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebAuthnService,
        { provide: PrismaService,  useValue: mockPrisma },
        { provide: RedisService,   useValue: mockRedis },
        { provide: LoggingService, useValue: mockLogging },
        { provide: ConfigService,  useValue: mockConfig },
      ],
    }).compile();

    service = module.get<WebAuthnService>(WebAuthnService);
  });

  // ── registrationOptions ────────────────────────────────────────────────────

  describe('registrationOptions', () => {
    it('génère les options et stocke le challenge dans Redis', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id:                  'user1',
        email:               'test@example.com',
        username:            'tester',
        webAuthnCredentials: [],
      });

      const result = await service.registrationOptions('user1');

      expect(result).toHaveProperty('challenge');
      expect(result).toHaveProperty('rp');
      expect((result as any).rp.name).toBe('BrokerIA Test');
      expect((result as any).rp.id).toBe('localhost');
      expect(mockRedis.set).toHaveBeenCalledWith(
        'webauthn_challenge:reg:user1',
        expect.any(String),
        300,
      );
    });

    it('exclut les credentials déjà enregistrés', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id:    'user1',
        email: 'test@example.com',
        username: 'tester',
        webAuthnCredentials: [MOCK_CREDENTIAL],
      });

      const result = await service.registrationOptions('user1');
      expect((result as any).excludeCredentials).toHaveLength(1);
    });

    it('lève NotFoundException si utilisateur inexistant', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(service.registrationOptions('unknown')).rejects.toThrow(NotFoundException);
    });
  });

  // ── registrationVerify ─────────────────────────────────────────────────────

  describe('registrationVerify', () => {
    it('lève BadRequestException si le challenge Redis est expiré', async () => {
      mockRedis.get.mockResolvedValue(null);

      await expect(
        service.registrationVerify('user1', {} as any, '1.2.3.4'),
      ).rejects.toThrow(BadRequestException);
    });

    it('lève UnauthorizedException si verifyRegistrationResponse échoue', async () => {
      mockRedis.get.mockResolvedValue('some-challenge');

      // verifyRegistrationResponse est importée depuis @simplewebauthn/server
      // On simule un échec de vérification en passant une réponse vide
      await expect(
        service.registrationVerify('user1', { response: {} } as any, '1.2.3.4'),
      ).rejects.toThrow();
    });
  });

  // ── authenticationOptions ──────────────────────────────────────────────────

  describe('authenticationOptions', () => {
    it('génère les options et stocke le challenge dans Redis', async () => {
      mockPrisma.webAuthnCredential.findMany.mockResolvedValue([MOCK_CREDENTIAL]);

      const result = await service.authenticationOptions('user1');

      expect(result).toHaveProperty('challenge');
      expect(mockRedis.set).toHaveBeenCalledWith(
        'webauthn_challenge:auth:user1',
        expect.any(String),
        300,
      );
    });

    it('lève BadRequestException si aucun credential enregistré', async () => {
      mockPrisma.webAuthnCredential.findMany.mockResolvedValue([]);

      await expect(service.authenticationOptions('user1')).rejects.toThrow(BadRequestException);
    });
  });

  // ── authenticationVerify ───────────────────────────────────────────────────

  describe('authenticationVerify', () => {
    it('lève BadRequestException si le challenge Redis est expiré', async () => {
      mockRedis.get.mockResolvedValue(null);

      await expect(
        service.authenticationVerify('user1', { id: 'cred-id' } as any, '1.2.3.4'),
      ).rejects.toThrow(BadRequestException);
    });

    it('lève UnauthorizedException si credential inconnu', async () => {
      mockRedis.get.mockResolvedValue('some-challenge');
      mockPrisma.webAuthnCredential.findUnique.mockResolvedValue(null);

      await expect(
        service.authenticationVerify('user1', { id: 'unknown-cred' } as any, '1.2.3.4'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('lève UnauthorizedException si credential appartient à un autre user', async () => {
      mockRedis.get.mockResolvedValue('some-challenge');
      mockPrisma.webAuthnCredential.findUnique.mockResolvedValue({
        ...MOCK_CREDENTIAL,
        userId: 'other-user',
      });

      await expect(
        service.authenticationVerify('user1', { id: MOCK_CREDENTIAL.credentialId } as any, '1.2.3.4'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ── listCredentials ────────────────────────────────────────────────────────

  describe('listCredentials', () => {
    it('retourne les credentials de l\'utilisateur', async () => {
      mockPrisma.webAuthnCredential.findMany.mockResolvedValue([
        {
          id:           MOCK_CREDENTIAL.id,
          credentialId: MOCK_CREDENTIAL.credentialId,
          deviceType:   MOCK_CREDENTIAL.deviceType,
          backedUp:     MOCK_CREDENTIAL.backedUp,
          createdAt:    MOCK_CREDENTIAL.createdAt,
          lastUsedAt:   MOCK_CREDENTIAL.lastUsedAt,
          aaguid:       MOCK_CREDENTIAL.aaguid,
        },
      ]);

      const result = await service.listCredentials('user1');
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('credentialId');
      expect(result[0]).not.toHaveProperty('publicKey'); // non exposé
    });

    it('retourne un tableau vide si aucun credential', async () => {
      mockPrisma.webAuthnCredential.findMany.mockResolvedValue([]);
      const result = await service.listCredentials('user1');
      expect(result).toEqual([]);
    });
  });

  // ── removeCredential ───────────────────────────────────────────────────────

  describe('removeCredential', () => {
    it('supprime le credential et logue MFA_REVOKED', async () => {
      mockPrisma.webAuthnCredential.findUnique.mockResolvedValue(MOCK_CREDENTIAL);
      mockPrisma.webAuthnCredential.delete.mockResolvedValue(MOCK_CREDENTIAL);

      await service.removeCredential('user1', 'cred-db-id', '1.2.3.4');

      expect(mockPrisma.webAuthnCredential.delete).toHaveBeenCalledWith({
        where: { id: 'cred-db-id' },
      });
      expect(mockLogging.mfaRevoked).toHaveBeenCalledWith('user1', 'webauthn', '1.2.3.4');
    });

    it('lève NotFoundException si credential inexistant', async () => {
      mockPrisma.webAuthnCredential.findUnique.mockResolvedValue(null);
      await expect(
        service.removeCredential('user1', 'bad-id', '1.2.3.4'),
      ).rejects.toThrow(NotFoundException);
    });

    it('lève NotFoundException si credential appartient à un autre user', async () => {
      mockPrisma.webAuthnCredential.findUnique.mockResolvedValue({
        ...MOCK_CREDENTIAL,
        userId: 'other-user',
      });
      await expect(
        service.removeCredential('user1', 'cred-db-id', '1.2.3.4'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── Configuration sécurité ─────────────────────────────────────────────────

  describe('configuration', () => {
    it('utilise userVerification: required pour forcer la biométrie/inhérence', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id:    'user1',
        email: 'test@example.com',
        username: 'tester',
        webAuthnCredentials: [],
      });

      const result = await service.registrationOptions('user1');

      // authenticatorSelection doit exiger userVerification required
      expect((result as any).authenticatorSelection?.userVerification).toBe('required');
    });

    it('configure le bon rpId et rpName depuis les variables d\'environnement', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user1', email: 'test@example.com',
        username: 'tester', webAuthnCredentials: [],
      });

      const result = await service.registrationOptions('user1');

      expect((result as any).rp.id).toBe('localhost');
      expect((result as any).rp.name).toBe('BrokerIA Test');
    });
  });

  // ── removeCredential — propriété ──────────────────────────────────────────

  describe('removeCredential — vérification ownership', () => {
    it('ne supprime pas si le credential existe mais appartient à un autre user', async () => {
      mockPrisma.webAuthnCredential.findUnique.mockResolvedValue({
        ...MOCK_CREDENTIAL,
        userId: 'adversaire',
      });

      await expect(
        service.removeCredential('user1', 'cred-db-id', '1.2.3.4'),
      ).rejects.toThrow(NotFoundException);

      expect(mockPrisma.webAuthnCredential.delete).not.toHaveBeenCalled();
    });
  });
});
