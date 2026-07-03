/**
 * Tests d'intégration — SignalsController
 * Couverture : GET /signals, GET /signals/recent, GET /signals/statistics,
 *              POST /signals, POST /signals/generate, POST /signals/scan-now
 * JwtGuard remplacé par un mock injectant req.user directement.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request = require('supertest');
import { SignalsController } from './signals.controller';
import { SignalsService } from './signals.service';
import { SignalSchedulerService } from './signal-scheduler.service';
import { JwtGuard } from '../auth/jwt.guard';

// ─── Constantes ───────────────────────────────────────────────────────────────

const MOCK_USER_ID = 'user-ctrl-test-1';

const MOCK_SIGNAL = {
  id: 'sig-ctrl-001',
  userId: MOCK_USER_ID,
  asset: 'BTC/USDT',
  direction: 'BUY',
  status: 'OPEN',
  confidence: 80,
  entry_price: 50000,
  stop_loss: 49000,
  take_profit: 52000,
  exit_price: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  closedAt: null,
};

const VALID_CREATE_BODY = {
  asset: 'BTC/USDT',
  direction: 'BUY',
  confidence: 80,
  entryPrice: 50000,
  stopLoss: 49000,
  takeProfit: 52000,
};

const VALID_GENERATE_BODY = {
  strategyId: 'strat-ctrl-001',
  asset: 'BTC/USDT',
  timeframe: '1h',
};

// ─── Guard mock ───────────────────────────────────────────────────────────────

const MockJwtGuard = {
  canActivate: (ctx: any) => {
    ctx.switchToHttp().getRequest().user = { id: MOCK_USER_ID };
    return true;
  },
};

// ─── Mock services ────────────────────────────────────────────────────────────

const mockSignalsService = {
  getUserSignals: jest.fn(),
  getRecentSignals: jest.fn(),
  getSignalsStatistics: jest.fn(),
  createSignal: jest.fn(),
  generateSignal: jest.fn(),
};

const mockSchedulerService = {
  runScan: jest.fn(),
};

// ─── Suite principale ─────────────────────────────────────────────────────────

describe('SignalsController (intégration supertest)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SignalsController],
      providers: [
        { provide: SignalsService, useValue: mockSignalsService },
        { provide: SignalSchedulerService, useValue: mockSchedulerService },
      ],
    })
      .overrideGuard(JwtGuard)
      .useValue(MockJwtGuard)
      .compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => jest.clearAllMocks());

  // ── GET /signals ─────────────────────────────────────────────────────────────

  describe('GET /signals', () => {
    it('retourne 200 avec la liste des signaux de l\'utilisateur', async () => {
      const signals = [MOCK_SIGNAL, { ...MOCK_SIGNAL, id: 'sig-ctrl-002' }];
      mockSignalsService.getUserSignals.mockResolvedValue(signals);

      const res = await request(app.getHttpServer())
        .get('/signals')
        .expect(200);

      expect(res.body).toHaveLength(2);
      expect(res.body[0].id).toBe('sig-ctrl-001');
    });

    it('retourne 200 avec un tableau vide si l\'utilisateur n\'a aucun signal', async () => {
      mockSignalsService.getUserSignals.mockResolvedValue([]);

      const res = await request(app.getHttpServer())
        .get('/signals')
        .expect(200);

      expect(res.body).toEqual([]);
    });

    it('transmet uniquement le userId du guard JWT au service', async () => {
      mockSignalsService.getUserSignals.mockResolvedValue([]);

      await request(app.getHttpServer()).get('/signals');

      expect(mockSignalsService.getUserSignals).toHaveBeenCalledTimes(1);
      expect(mockSignalsService.getUserSignals).toHaveBeenCalledWith(MOCK_USER_ID);
    });
  });

  // ── GET /signals/recent + /statistics ────────────────────────────────────────

  describe('GET /signals/recent et /signals/statistics', () => {
    it('GET /signals/recent retourne 200 avec les 5 signaux les plus récents', async () => {
      const recent = Array.from({ length: 5 }, (_, i) => ({
        ...MOCK_SIGNAL,
        id: `sig-recent-${i}`,
      }));
      mockSignalsService.getRecentSignals.mockResolvedValue(recent);

      const res = await request(app.getHttpServer())
        .get('/signals/recent')
        .expect(200);

      expect(res.body).toHaveLength(5);
      expect(mockSignalsService.getRecentSignals).toHaveBeenCalledWith(MOCK_USER_ID, 5);
    });

    it('GET /signals/statistics retourne 200 avec la structure de statistiques attendue', async () => {
      const stats = {
        totalSignals: 10,
        buySignals: 7,
        sellSignals: 3,
        averageConfidence: 78.5,
      };
      mockSignalsService.getSignalsStatistics.mockResolvedValue(stats);

      const res = await request(app.getHttpServer())
        .get('/signals/statistics')
        .expect(200);

      expect(res.body).toMatchObject({
        totalSignals: 10,
        buySignals: 7,
        sellSignals: 3,
        averageConfidence: 78.5,
      });
    });

    it('GET /signals/statistics transmet le userId du guard au service', async () => {
      mockSignalsService.getSignalsStatistics.mockResolvedValue({
        totalSignals: 0,
        buySignals: 0,
        sellSignals: 0,
        averageConfidence: 0,
      });

      await request(app.getHttpServer()).get('/signals/statistics');

      expect(mockSignalsService.getSignalsStatistics).toHaveBeenCalledTimes(1);
      expect(mockSignalsService.getSignalsStatistics).toHaveBeenCalledWith(MOCK_USER_ID);
    });
  });

  // ── POST /signals ─────────────────────────────────────────────────────────────

  describe('POST /signals', () => {
    it('retourne 201 avec le signal créé pour un body valide', async () => {
      mockSignalsService.createSignal.mockResolvedValue(MOCK_SIGNAL);

      const res = await request(app.getHttpServer())
        .post('/signals')
        .send(VALID_CREATE_BODY)
        .expect(201);

      expect(res.body.id).toBe('sig-ctrl-001');
      expect(res.body.direction).toBe('BUY');
    });

    it('retourne 400 si le champ "asset" est absent du body', async () => {
      const { asset: _dropped, ...bodyWithoutAsset } = VALID_CREATE_BODY;

      await request(app.getHttpServer())
        .post('/signals')
        .send(bodyWithoutAsset)
        .expect(400);

      expect(mockSignalsService.createSignal).not.toHaveBeenCalled();
    });

    it('retourne 400 si le champ "direction" est absent du body', async () => {
      const { direction: _dropped, ...bodyWithoutDirection } = VALID_CREATE_BODY;

      await request(app.getHttpServer())
        .post('/signals')
        .send(bodyWithoutDirection)
        .expect(400);

      expect(mockSignalsService.createSignal).not.toHaveBeenCalled();
    });

    it('retourne 400 si "confidence" dépasse 100 (contrainte @Max)', async () => {
      await request(app.getHttpServer())
        .post('/signals')
        .send({ ...VALID_CREATE_BODY, confidence: 150 })
        .expect(400);

      expect(mockSignalsService.createSignal).not.toHaveBeenCalled();
    });

    it('retourne 400 si "confidence" est inférieur à 0 (contrainte @Min)', async () => {
      await request(app.getHttpServer())
        .post('/signals')
        .send({ ...VALID_CREATE_BODY, confidence: -5 })
        .expect(400);

      expect(mockSignalsService.createSignal).not.toHaveBeenCalled();
    });

    it('transmet le userId du guard et le DTO complet au service', async () => {
      mockSignalsService.createSignal.mockResolvedValue(MOCK_SIGNAL);

      await request(app.getHttpServer())
        .post('/signals')
        .send(VALID_CREATE_BODY)
        .expect(201);

      expect(mockSignalsService.createSignal).toHaveBeenCalledTimes(1);
      const [userId, dto] = mockSignalsService.createSignal.mock.calls[0];
      expect(userId).toBe(MOCK_USER_ID);
      expect(dto.asset).toBe('BTC/USDT');
      expect(dto.confidence).toBe(80);
    });
  });

  // ── POST /signals/generate + POST /signals/scan-now ──────────────────────────

  describe('POST /signals/generate et /signals/scan-now', () => {
    it('POST /signals/generate retourne 201 avec le résultat du service pour un body valide', async () => {
      const generateResult = { status: 'NO_SIGNAL', message: 'Aucun signal détecté.' };
      mockSignalsService.generateSignal.mockResolvedValue(generateResult);

      const res = await request(app.getHttpServer())
        .post('/signals/generate')
        .send(VALID_GENERATE_BODY)
        .expect(201);

      expect(res.body.status).toBe('NO_SIGNAL');
    });

    it('POST /signals/generate retourne 400 si "strategyId" est absent du body', async () => {
      const { strategyId: _dropped, ...bodyWithoutStrategyId } = VALID_GENERATE_BODY;

      await request(app.getHttpServer())
        .post('/signals/generate')
        .send(bodyWithoutStrategyId)
        .expect(400);

      expect(mockSignalsService.generateSignal).not.toHaveBeenCalled();
    });

    it('POST /signals/generate retourne 400 si "asset" est absent du body', async () => {
      const { asset: _dropped, ...bodyWithoutAsset } = VALID_GENERATE_BODY;

      await request(app.getHttpServer())
        .post('/signals/generate')
        .send(bodyWithoutAsset)
        .expect(400);

      expect(mockSignalsService.generateSignal).not.toHaveBeenCalled();
    });

    it('POST /signals/scan-now retourne 201 avec les résultats du scan du scheduler', async () => {
      const scanResults = [
        { strategyId: 'strat-001', status: 'ENTRY_SIGNAL', asset: 'BTC/USDT' },
        { strategyId: 'strat-002', status: 'NO_SIGNAL', asset: 'ETH/USDT' },
      ];
      mockSchedulerService.runScan.mockResolvedValue(scanResults);

      const res = await request(app.getHttpServer())
        .post('/signals/scan-now')
        .expect(201);

      expect(res.body).toHaveLength(2);
      expect(res.body[0].strategyId).toBe('strat-001');
    });

    it('POST /signals/scan-now délègue exclusivement à SignalSchedulerService.runScan()', async () => {
      mockSchedulerService.runScan.mockResolvedValue([]);

      await request(app.getHttpServer())
        .post('/signals/scan-now')
        .expect(201);

      expect(mockSchedulerService.runScan).toHaveBeenCalledTimes(1);
      expect(mockSignalsService.generateSignal).not.toHaveBeenCalled();
    });
  });
});
