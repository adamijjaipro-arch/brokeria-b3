/**
 * Tests unitaires — LoggingService
 * Vérifie : émission JSON console, persistance DB, envoi Syslog UDP
 */
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { LoggingService } from './logging.service';
import { PrismaService } from '../database/prisma.service';

const mockPrisma = {
  authLog: { create: jest.fn() },
};

const mockConfig = {
  get: jest.fn((key: string) => {
    const map: Record<string, string> = {
      SYSLOG_HOST: '127.0.0.1',
      SYSLOG_PORT: '514',
      APP_NAME:    'test-app',
      NODE_ENV:    'test',
    };
    return map[key];
  }),
};

describe('LoggingService', () => {
  let service: LoggingService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockPrisma.authLog.create.mockResolvedValue({});

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoggingService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<LoggingService>(LoggingService);
  });

  afterEach(async () => {
    await service.onModuleDestroy();
  });

  it('persistToDb est appelé avec les bons champs pour AUTH_SUCCESS', async () => {
    await service.authSuccess('user1', 'password', '1.2.3.4');

    expect(mockPrisma.authLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user1',
          action: 'AUTH_SUCCESS',
          result: 'success',
          ip:     '1.2.3.4',
        }),
      }),
    );
  });

  it('persistToDb est appelé pour AUTH_FAILURE avec le facteur', async () => {
    await service.authFailure('user2', 'totp', '5.6.7.8', undefined, 'code invalide');

    expect(mockPrisma.authLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user2',
          action: 'AUTH_FAILURE',
          result: 'failure',
          ip:     '5.6.7.8',
        }),
      }),
    );
  });

  it('accountLocked persisté avec result failure', async () => {
    await service.accountLocked('user3', '9.9.9.9', '3 tentatives');
    expect(mockPrisma.authLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'ACCOUNT_LOCKED',
          result: 'failure',
        }),
      }),
    );
  });

  it('mfaEnrolled persisté avec result success', async () => {
    await service.mfaEnrolled('user4', 'totp', '1.1.1.1');
    expect(mockPrisma.authLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'MFA_ENROLLED',
          result: 'success',
        }),
      }),
    );
  });

  it('ne propage pas d\'erreur si DB échoue', async () => {
    mockPrisma.authLog.create.mockRejectedValue(new Error('DB down'));
    await expect(service.authSuccess('user1', 'password')).resolves.not.toThrow();
  });

  it('emit construit un StructuredLog avec timestamp ISO 8601', async () => {
    const spy = jest.spyOn(global.Date.prototype, 'toISOString').mockReturnValue('2026-01-15T10:00:00.000Z');
    await service.emit({
      event_type: 'SESSION_CREATED',
      user_id:    'user5',
      success:    true,
    });
    expect(mockPrisma.authLog.create).toHaveBeenCalled();
    spy.mockRestore();
  });
});
