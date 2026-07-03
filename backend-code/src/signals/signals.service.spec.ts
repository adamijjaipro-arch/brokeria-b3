/**
 * Tests unitaires — SignalsService
 *
 * Couverture :
 *   Suite 1 : generateSignal — NO_SIGNAL (2 tests)
 *   Suite 2 : generateSignal — ENTRY_SIGNAL / BUY (6 tests)
 *   Suite 3 : generateSignal — EXIT_SIGNAL / SELL (3 tests)
 *   Suite 4 : createSignal (5 tests)
 *   Suite 5 : getUserSignals & getRecentSignals (4 tests)
 *   Suite 6 : getSignalsStatistics (5 tests)
 *   Suite 7 : notifyAllUsers — vérification email (3 tests)
 *
 * Total : 28 tests
 */

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { SignalsService } from './signals.service';
import { PrismaService } from '../database/prisma.service';
import { EmailService } from '../email/email.service';
import { PatternDetectionService } from '../patterns/pattern-detection.service';
import { CreateSignalDto } from './dto/create-signal.dto';
import { GenerateSignalDto } from './dto/generate-signal.dto';

// ─── Factories ─────────────────────────────────────────────────────────────────

const mockSignal = (overrides: Record<string, unknown> = {}) => ({
  id:          'sig-001',
  userId:      'user-001',
  strategyId:  'strat-001',
  asset:       'BTC/USDT',
  timeframe:   '1h',
  direction:   'BUY' as const,
  status:      'OPEN',
  confidence:  80,
  entry_price: 100,
  stop_loss:   98,
  take_profit: 104,
  exit_price:  null,
  patterns:    '["ENTRY_SIGNAL"]',
  indicators:  '{}',
  createdAt:   new Date('2026-01-01T00:00:00.000Z'),
  closedAt:    null,
  ...overrides,
});

const mockStrategy = (overrides: Record<string, unknown> = {}) => ({
  id:        'strat-001',
  userId:    'user-001',
  name:      'RSI Breakout',
  asset:     'BTC/USDT',
  timeframe: '1h',
  code:      '{}',
  status:    'active',
  ...overrides,
});

/** Résultat PatternDetection minimal valide */
const detectionBUY = (overrides: Record<string, unknown> = {}) => ({
  strategy_name:    'RSI Breakout',
  asset:            'BTC/USDT',
  timeframe:        '1h',
  evaluated_at:     '2026-01-01T00:00:00.000Z',
  global_status:    'ENTRY_SIGNAL' as const,
  confidence_score: 0.82,
  current_price:    100,
  candles_used:     20,
  indicators:       {},
  entry_conditions: [],
  exit_conditions:  [],
  risk_management:  { stop_loss: '2% sous le point d\'entrée', take_profit: '4% au-dessus' },
  ...overrides,
});

const detectionSELL = (overrides: Record<string, unknown> = {}) => ({
  ...detectionBUY(),
  global_status:   'EXIT_SIGNAL' as const,
  current_price:   110,
  ...overrides,
});

const detectionNO = () => ({
  ...detectionBUY(),
  global_status:   'NO_SIGNAL' as const,
  confidence_score: 0.30,
});

// ─── Setup ─────────────────────────────────────────────────────────────────────

describe('SignalsService', () => {
  let service: SignalsService;
  let prisma:  jest.Mocked<PrismaService>;
  let emailService: jest.Mocked<EmailService>;
  let patternDetection: jest.Mocked<PatternDetectionService>;

  beforeEach(async () => {
    const prismaMock = {
      strategy: {
        findUnique: jest.fn(),
      },
      signal: {
        create:    jest.fn(),
        update:    jest.fn(),
        findMany:  jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
      },
      user: {
        findMany: jest.fn(),
      },
    };

    const emailMock = {
      sendSignalNotification: jest.fn().mockResolvedValue(undefined),
    };

    const patternMock = {
      detectPattern: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SignalsService,
        { provide: PrismaService,           useValue: prismaMock    },
        { provide: EmailService,            useValue: emailMock     },
        { provide: PatternDetectionService, useValue: patternMock   },
      ],
    }).compile();

    service          = module.get<SignalsService>(SignalsService);
    prisma           = module.get(PrismaService);
    emailService     = module.get(EmailService);
    patternDetection = module.get(PatternDetectionService);

    // Par défaut, notifyAllUsers ne fait rien
    (prisma.user.findMany as jest.Mock).mockResolvedValue([]);
  });

  afterEach(() => jest.clearAllMocks());

  // ─── Suite 1 : NO_SIGNAL ────────────────────────────────────────────────────

  describe('generateSignal — NO_SIGNAL', () => {
    const dto: GenerateSignalDto = {
      strategyId: 'strat-001',
      asset:      'BTC/USDT',
      timeframe:  '1h',
      mockResult: detectionNO() as any,
    };

    it('retourne status=no_signal quand global_status vaut NO_SIGNAL', async () => {
      (prisma.strategy.findUnique as jest.Mock).mockResolvedValue(mockStrategy());

      const result = await service.generateSignal('user-001', dto);

      expect(result.status).toBe('no_signal');
      expect((result as any).global_status).toBe('NO_SIGNAL');
    });

    it('ne persiste aucun signal quand NO_SIGNAL', async () => {
      (prisma.strategy.findUnique as jest.Mock).mockResolvedValue(mockStrategy());

      await service.generateSignal('user-001', dto);

      expect(prisma.signal.create).not.toHaveBeenCalled();
      expect(prisma.signal.update).not.toHaveBeenCalled();
    });
  });

  // ─── Suite 2 : ENTRY_SIGNAL (BUY) ───────────────────────────────────────────

  describe('generateSignal — ENTRY_SIGNAL (BUY)', () => {
    const dto: GenerateSignalDto = {
      strategyId: 'strat-001',
      asset:      'BTC/USDT',
      timeframe:  '1h',
      mockResult: detectionBUY() as any,
    };

    beforeEach(() => {
      (prisma.strategy.findUnique as jest.Mock).mockResolvedValue(mockStrategy());
      (prisma.signal.findFirst  as jest.Mock).mockResolvedValue(null);
      (prisma.signal.create     as jest.Mock).mockResolvedValue(mockSignal());
    });

    it('retourne status=signal_created avec direction BUY', async () => {
      const result = await service.generateSignal('user-001', dto);

      expect(result.status).toBe('signal_created');
      expect((result as any).direction).toBe('BUY');
    });

    it('appelle prisma.signal.create avec entry_price, stop_loss et take_profit corrects', async () => {
      await service.generateSignal('user-001', dto);

      const payload = (prisma.signal.create as jest.Mock).mock.calls[0][0].data;
      expect(payload.entry_price).toBe(100);            // current_price du mock
      expect(payload.stop_loss).toBeCloseTo(98, 1);     // 100 × (1 - 0.02)
      expect(payload.take_profit).toBeCloseTo(104, 1);  // 100 × (1 + 0.04)
    });

    it('calcule confidence en pourcentage (confidence_score × 100)', async () => {
      await service.generateSignal('user-001', dto);

      const payload = (prisma.signal.create as jest.Mock).mock.calls[0][0].data;
      expect(payload.confidence).toBe(82); // 0.82 × 10000 / 100
    });

    it('retourne status=already_open si un signal BUY OPEN existe déjà', async () => {
      (prisma.signal.findFirst as jest.Mock).mockResolvedValue(mockSignal());

      const result = await service.generateSignal('user-001', dto);

      expect(result.status).toBe('already_open');
      expect(prisma.signal.create).not.toHaveBeenCalled();
    });

    it('lance NotFoundException si la stratégie est introuvable', async () => {
      (prisma.strategy.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.generateSignal('user-001', dto))
        .rejects.toThrow(NotFoundException);
    });

    it('utilise SL=2% et TP=4% par défaut quand risk_management est absent', async () => {
      const dtoNoRisk: GenerateSignalDto = {
        ...dto,
        mockResult: detectionBUY({ risk_management: {} }) as any,
      };

      await service.generateSignal('user-001', dtoNoRisk);

      const payload = (prisma.signal.create as jest.Mock).mock.calls[0][0].data;
      expect(payload.stop_loss).toBeCloseTo(98, 1);    // 2% par défaut
      expect(payload.take_profit).toBeCloseTo(104, 1); // 4% par défaut
    });
  });

  // ─── Suite 3 : EXIT_SIGNAL (SELL) ───────────────────────────────────────────

  describe('generateSignal — EXIT_SIGNAL (SELL)', () => {
    const dto: GenerateSignalDto = {
      strategyId: 'strat-001',
      asset:      'BTC/USDT',
      timeframe:  '1h',
      mockResult: detectionSELL() as any,
    };

    beforeEach(() => {
      (prisma.strategy.findUnique as jest.Mock).mockResolvedValue(mockStrategy());
    });

    it('clôture le signal BUY ouvert (status CLOSED, exit_price, closedAt)', async () => {
      const openSig = mockSignal();
      (prisma.signal.findFirst as jest.Mock).mockResolvedValue(openSig);
      (prisma.signal.update   as jest.Mock).mockResolvedValue({
        ...openSig,
        status:     'CLOSED',
        exit_price: 110,
        closedAt:   new Date(),
      });

      const result = await service.generateSignal('user-001', dto);

      expect(result.status).toBe('signal_closed');
      const updateCall = (prisma.signal.update as jest.Mock).mock.calls[0][0];
      expect(updateCall.where.id).toBe('sig-001');
      expect(updateCall.data.status).toBe('CLOSED');
      expect(updateCall.data.exit_price).toBe(110);
      expect(updateCall.data.closedAt).toBeInstanceOf(Date);
    });

    it('retourne status=no_open_position si aucun BUY OPEN trouvé', async () => {
      (prisma.signal.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await service.generateSignal('user-001', dto);

      expect(result.status).toBe('no_open_position');
      expect(prisma.signal.update).not.toHaveBeenCalled();
    });

    it('ne crée pas de nouveau signal lors d\'une clôture', async () => {
      (prisma.signal.findFirst as jest.Mock).mockResolvedValue(mockSignal());
      (prisma.signal.update   as jest.Mock).mockResolvedValue(mockSignal({ status: 'CLOSED' }));

      await service.generateSignal('user-001', dto);

      expect(prisma.signal.create).not.toHaveBeenCalled();
    });
  });

  // ─── Suite 4 : createSignal ──────────────────────────────────────────────────

  describe('createSignal', () => {
    const dto: CreateSignalDto = {
      asset:       'ETH/USDT',
      direction:   'BUY',
      confidence:  75,
      entryPrice:  2000,
      stopLoss:    1960,
      takeProfit:  2080,
    };

    beforeEach(() => {
      (prisma.signal.create as jest.Mock).mockResolvedValue(
        mockSignal({ asset: 'ETH/USDT', entry_price: 2000, stop_loss: 1960, take_profit: 2080 }),
      );
    });

    it('crée et retourne un signal avec tous les champs requis', async () => {
      const result = await service.createSignal('user-001', dto);

      expect(result).toMatchObject({ asset: 'ETH/USDT', entry_price: 2000 });
      expect(prisma.signal.create).toHaveBeenCalledTimes(1);
    });

    it('sérialise detectedPatterns en JSON', async () => {
      await service.createSignal('user-001', {
        ...dto,
        detectedPatterns: ['Hammer', 'Doji'],
      });

      const data = (prisma.signal.create as jest.Mock).mock.calls[0][0].data;
      expect(data.patterns).toBe('["Hammer","Doji"]');
    });

    it('sérialise indicators en JSON', async () => {
      await service.createSignal('user-001', {
        ...dto,
        indicators: { rsi: 65, ema: 200 },
      });

      const data = (prisma.signal.create as jest.Mock).mock.calls[0][0].data;
      expect(data.indicators).toBe('{"rsi":65,"ema":200}');
    });

    it('laisse patterns et indicators à undefined quand non fournis', async () => {
      await service.createSignal('user-001', dto);

      const data = (prisma.signal.create as jest.Mock).mock.calls[0][0].data;
      expect(data.patterns).toBeUndefined();
      expect(data.indicators).toBeUndefined();
    });

    it('déclenche notifyAllUsers en fire-and-forget (ne bloque pas la réponse)', async () => {
      (prisma.user.findMany as jest.Mock).mockResolvedValue([
        { email: 'a@test.com' },
        { email: 'b@test.com' },
      ]);
      (emailService.sendSignalNotification as jest.Mock).mockResolvedValue(undefined);

      const result = await service.createSignal('user-001', dto);

      // Le résultat est retourné immédiatement sans attendre l'email
      expect(result).toBeDefined();
      // Laisser la micro-tâche s'exécuter
      await Promise.resolve();
      await Promise.resolve();
    });
  });

  // ─── Suite 5 : getUserSignals & getRecentSignals ─────────────────────────────

  describe('getUserSignals', () => {
    it('retourne les signaux de l\'utilisateur triés par createdAt desc', async () => {
      const signals = [mockSignal(), mockSignal({ id: 'sig-002' })];
      (prisma.signal.findMany as jest.Mock).mockResolvedValue(signals);

      const result = await service.getUserSignals('user-001');

      expect(result).toHaveLength(2);
      const call = (prisma.signal.findMany as jest.Mock).mock.calls[0][0];
      expect(call.where.userId).toBe('user-001');
      expect(call.orderBy).toEqual({ createdAt: 'desc' });
      expect(call.take).toBe(50);
    });

    it('retourne un tableau vide si l\'utilisateur n\'a pas de signaux', async () => {
      (prisma.signal.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getUserSignals('user-001');

      expect(result).toEqual([]);
    });
  });

  describe('getRecentSignals', () => {
    it('respecte la limite passée en paramètre', async () => {
      (prisma.signal.findMany as jest.Mock).mockResolvedValue([mockSignal()]);

      await service.getRecentSignals('user-001', 5);

      const call = (prisma.signal.findMany as jest.Mock).mock.calls[0][0];
      expect(call.take).toBe(5);
    });

    it('filtre uniquement les signaux de cet utilisateur', async () => {
      (prisma.signal.findMany as jest.Mock).mockResolvedValue([]);

      await service.getRecentSignals('user-999', 10);

      const call = (prisma.signal.findMany as jest.Mock).mock.calls[0][0];
      expect(call.where.userId).toBe('user-999');
    });
  });

  // ─── Suite 6 : getSignalsStatistics ─────────────────────────────────────────

  describe('getSignalsStatistics', () => {
    it('retourne le total de signaux correct', async () => {
      (prisma.signal.findMany as jest.Mock).mockResolvedValue([
        mockSignal({ direction: 'BUY' }),
        mockSignal({ direction: 'BUY' }),
        mockSignal({ direction: 'SELL' }),
      ]);

      const stats = await service.getSignalsStatistics('user-001');

      expect(stats.totalSignals).toBe(3);
    });

    it('compte correctement buySignals et sellSignals', async () => {
      (prisma.signal.findMany as jest.Mock).mockResolvedValue([
        mockSignal({ direction: 'BUY'  }),
        mockSignal({ direction: 'BUY'  }),
        mockSignal({ direction: 'SELL' }),
      ]);

      const stats = await service.getSignalsStatistics('user-001');

      expect(stats.buySignals).toBe(2);
      expect(stats.sellSignals).toBe(1);
    });

    it('calcule correctement averageConfidence', async () => {
      (prisma.signal.findMany as jest.Mock).mockResolvedValue([
        mockSignal({ confidence: 60 }),
        mockSignal({ confidence: 80 }),
        mockSignal({ confidence: 100 }),
      ]);

      const stats = await service.getSignalsStatistics('user-001');

      expect(stats.averageConfidence).toBeCloseTo(80, 5);
    });

    it('retourne averageConfidence=0 quand aucun signal', async () => {
      (prisma.signal.findMany as jest.Mock).mockResolvedValue([]);

      const stats = await service.getSignalsStatistics('user-001');

      expect(stats.totalSignals).toBe(0);
      expect(stats.averageConfidence).toBe(0);
    });

    it('filtre les signaux par userId', async () => {
      (prisma.signal.findMany as jest.Mock).mockResolvedValue([]);

      await service.getSignalsStatistics('user-XYZ');

      const call = (prisma.signal.findMany as jest.Mock).mock.calls[0][0];
      expect(call.where.userId).toBe('user-XYZ');
    });
  });

  // ─── Suite 7 : notifyAllUsers (via createSignal) ─────────────────────────────

  describe('notifyAllUsers', () => {
    beforeEach(() => {
      (prisma.signal.create as jest.Mock).mockResolvedValue(
        mockSignal({
          asset:       'BTC/USDT',
          direction:   'BUY',
          entry_price: 100,
          stop_loss:   98,
          take_profit: 104,
          confidence:  80,
          patterns:    '["Hammer"]',
          indicators:  '{"tp2":105}',
        }),
      );
    });

    it('appelle emailService.sendSignalNotification avec les bons paramètres', async () => {
      (prisma.user.findMany as jest.Mock).mockResolvedValue([
        { email: 'alice@test.com' },
        { email: 'bob@test.com' },
      ]);

      await service.createSignal('user-001', {
        asset: 'BTC/USDT', direction: 'BUY', confidence: 80,
        entryPrice: 100, stopLoss: 98, takeProfit: 104,
      });
      // Attendre la résolution des micro-tâches fire-and-forget
      await new Promise(r => setImmediate(r));

      expect(emailService.sendSignalNotification).toHaveBeenCalledWith(
        ['alice@test.com', 'bob@test.com'],
        expect.objectContaining({
          asset:       'BTC/USDT',
          direction:   'BUY',
          entryPrice:  100,
          takeProfit:  104,
          stopLoss:    98,
          confidence:  80,
          pattern:     'Hammer',
          tp2:         105,
        }),
      );
    });

    it('ne lève pas d\'erreur et n\'envoie pas d\'email si aucun utilisateur', async () => {
      (prisma.user.findMany as jest.Mock).mockResolvedValue([]);

      await service.createSignal('user-001', {
        asset: 'BTC/USDT', direction: 'BUY', confidence: 80,
        entryPrice: 100, stopLoss: 98, takeProfit: 104,
      });
      await new Promise(r => setImmediate(r));

      expect(emailService.sendSignalNotification).not.toHaveBeenCalled();
    });

    it('filtre les emails null/vides avant envoi', async () => {
      (prisma.user.findMany as jest.Mock).mockResolvedValue([
        { email: 'valid@test.com' },
        { email: null },
        { email: '' },
      ]);

      await service.createSignal('user-001', {
        asset: 'BTC/USDT', direction: 'BUY', confidence: 80,
        entryPrice: 100, stopLoss: 98, takeProfit: 104,
      });
      await new Promise(r => setImmediate(r));

      const callArgs = (emailService.sendSignalNotification as jest.Mock).mock.calls[0];
      expect(callArgs[0]).toEqual(['valid@test.com']);
    });
  });
});
