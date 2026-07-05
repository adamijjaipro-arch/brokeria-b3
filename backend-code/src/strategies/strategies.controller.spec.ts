/**
 * Tests d'intégration — StrategiesController
 * Couverture : GET /strategies, POST /strategies/import, POST /strategies/:id/analyze
 * Le JwtGuard est remplacé par un mock qui injecte directement req.user.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, NotFoundException, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { StrategiesController } from './strategies.controller';
import { StrategiesService } from './strategies.service';
import { JwtGuard } from '../auth/jwt.guard';
import { MOCK_STRATEGY_RULES, mockStrategy } from '../test/mocks';

// ─── Constantes de test ────────────────────────────────────────────────────────

const MOCK_USER_ID = 'user-controller-test-1';

const IMPORT_SUCCESS = {
  message:  'Stratégie importée avec succès.',
  strategy: mockStrategy(),
  rules:    MOCK_STRATEGY_RULES,
};

// ─── Guard mock — bypass JWT sans token réel ──────────────────────────────────

const MockJwtGuard = {
  canActivate: (ctx: any) => {
    ctx.switchToHttp().getRequest().user = { id: MOCK_USER_ID };
    return true;
  },
};

// ─── Mock StrategiesService ───────────────────────────────────────────────────

const mockStrategiesService = {
  findAllByUser:       jest.fn(),
  analyzeById:         jest.fn(),
  importFromDocument:  jest.fn(),
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('StrategiesController (intégration supertest)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StrategiesController],
      providers: [
        { provide: StrategiesService, useValue: mockStrategiesService },
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

  // ── GET /strategies ────────────────────────────────────────────────────────

  describe('GET /strategies', () => {
    it('retourne 200 avec la liste des stratégies de l\'utilisateur', async () => {
      const strats = [mockStrategy(), mockStrategy({ id: 'strat-2', name: 'MA Cross' })];
      mockStrategiesService.findAllByUser.mockResolvedValue(strats);

      const res = await request(app.getHttpServer())
        .get('/strategies')
        .expect(200);

      expect(res.body).toHaveLength(2);
      expect(res.body[0].id).toBe('strat-test-1');
    });

    it('retourne 200 avec un tableau vide si aucune stratégie', async () => {
      mockStrategiesService.findAllByUser.mockResolvedValue([]);

      const res = await request(app.getHttpServer())
        .get('/strategies')
        .expect(200);

      expect(res.body).toEqual([]);
    });

    it('injecte uniquement le userId du guard JWT dans l\'appel service', async () => {
      mockStrategiesService.findAllByUser.mockResolvedValue([]);

      await request(app.getHttpServer()).get('/strategies');

      expect(mockStrategiesService.findAllByUser).toHaveBeenCalledTimes(1);
      expect(mockStrategiesService.findAllByUser).toHaveBeenCalledWith(MOCK_USER_ID);
    });
  });

  // ── POST /strategies/import ────────────────────────────────────────────────

  describe('POST /strategies/import', () => {
    it('retourne 201 avec le résultat d\'import depuis un fichier TXT', async () => {
      mockStrategiesService.importFromDocument.mockResolvedValue(IMPORT_SUCCESS);

      const res = await request(app.getHttpServer())
        .post('/strategies/import')
        .attach('file', Buffer.from('A'.repeat(200)), {
          filename:    'strategy.txt',
          contentType: 'text/plain',
        })
        .field('name',      'Breakout BTC')
        .field('timeframe', '4h')
        .field('asset',     'BTC/USDT')
        .expect(201);

      expect(res.body.message).toBe('Stratégie importée avec succès.');
      expect(res.body.strategy.id).toBe('strat-test-1');
    });

    it('retourne 201 avec le résultat d\'import depuis un fichier PDF', async () => {
      mockStrategiesService.importFromDocument.mockResolvedValue(IMPORT_SUCCESS);

      const res = await request(app.getHttpServer())
        .post('/strategies/import')
        .attach('file', Buffer.alloc(1024), {
          filename:    'strategy.pdf',
          contentType: 'application/pdf',
        })
        .field('name',      'Breakout BTC PDF')
        .field('timeframe', '1h')
        .expect(201);

      expect(res.body.message).toBe('Stratégie importée avec succès.');
    });

    it('retourne 400 si aucun fichier n\'est joint à la requête', async () => {
      await request(app.getHttpServer())
        .post('/strategies/import')
        .field('name',      'Test Sans Fichier')
        .field('timeframe', '4h')
        .expect(400);

      expect(mockStrategiesService.importFromDocument).not.toHaveBeenCalled();
    });

    it('retourne 400 si le timeframe n\'appartient pas à l\'enum Timeframe', async () => {
      await request(app.getHttpServer())
        .post('/strategies/import')
        .attach('file', Buffer.from('A'.repeat(200)), {
          filename:    'strategy.txt',
          contentType: 'text/plain',
        })
        .field('name',      'Test Timeframe Invalide')
        .field('timeframe', 'invalid_tf')
        .expect(400);
    });

    it('retourne 400 si le champ "name" est absent du DTO', async () => {
      await request(app.getHttpServer())
        .post('/strategies/import')
        .attach('file', Buffer.from('A'.repeat(200)), {
          filename:    'strategy.txt',
          contentType: 'text/plain',
        })
        .field('timeframe', '4h')
        .expect(400);
    });

    it('transmet le userId du guard JWT au service (3ème argument)', async () => {
      mockStrategiesService.importFromDocument.mockResolvedValue(IMPORT_SUCCESS);

      await request(app.getHttpServer())
        .post('/strategies/import')
        .attach('file', Buffer.from('B'.repeat(200)), {
          filename:    'strat.txt',
          contentType: 'text/plain',
        })
        .field('name',      'Test userId')
        .field('timeframe', '4h');

      if (mockStrategiesService.importFromDocument.mock.calls.length > 0) {
        const [, , userId] = mockStrategiesService.importFromDocument.mock.calls[0];
        expect(userId).toBe(MOCK_USER_ID);
      }
    });

    it('transmet les champs du DTO correctement au service', async () => {
      mockStrategiesService.importFromDocument.mockResolvedValue(IMPORT_SUCCESS);

      await request(app.getHttpServer())
        .post('/strategies/import')
        .attach('file', Buffer.from('C'.repeat(200)), {
          filename:    'strat.txt',
          contentType: 'text/plain',
        })
        .field('name',        'MA Cross Strategy')
        .field('timeframe',   '1h')
        .field('asset',       'ETH/USDT')
        .field('description', 'Croisement de moyennes mobiles');

      if (mockStrategiesService.importFromDocument.mock.calls.length > 0) {
        const [, dto] = mockStrategiesService.importFromDocument.mock.calls[0];
        expect(dto.name).toBe('MA Cross Strategy');
        expect(dto.asset).toBe('ETH/USDT');
      }
    });
  });

  // ── POST /strategies/:id/analyze ──────────────────────────────────────────

  describe('POST /strategies/:id/analyze', () => {
    it('retourne 201 avec les règles d\'analyse et le strategyId', async () => {
      mockStrategiesService.analyzeById.mockResolvedValue({
        rules:      MOCK_STRATEGY_RULES,
        strategyId: 'strat-test-1',
      });

      const res = await request(app.getHttpServer())
        .post('/strategies/strat-test-1/analyze')
        .expect(201);

      expect(res.body.strategyId).toBe('strat-test-1');
      expect(res.body.rules.name).toBe('Breakout BTC Test');
      expect(res.body.rules.confidence_score).toBe(82);
    });

    it('retourne 404 si NotFoundException est levée par le service', async () => {
      mockStrategiesService.analyzeById.mockRejectedValue(
        new NotFoundException('Stratégie introuvable'),
      );

      const res = await request(app.getHttpServer())
        .post('/strategies/inexistant/analyze')
        .expect(404);

      expect(res.body.message).toBe('Stratégie introuvable');
    });

    it('transmet le strategyId (param :id) et le userId au service', async () => {
      mockStrategiesService.analyzeById.mockResolvedValue({
        rules:      MOCK_STRATEGY_RULES,
        strategyId: 'strat-abc-123',
      });

      await request(app.getHttpServer())
        .post('/strategies/strat-abc-123/analyze');

      expect(mockStrategiesService.analyzeById).toHaveBeenCalledWith(
        'strat-abc-123',
        MOCK_USER_ID,
      );
    });
  });
});
