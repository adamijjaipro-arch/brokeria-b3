/**
 * Tests unitaires — StrategiesService
 * Couverture : findAllByUser, analyzeById, importFromDocument (TXT/PDF/erreurs)
 */
import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { StrategiesService } from './strategies.service';
import { PrismaService } from '../database/prisma.service';
import { AIService } from '../ai/ai.service';
import { Timeframe } from './dto/import-strategy.dto';
import {
  createMockPrismaService,
  createMockAIService,
  MOCK_STRATEGY_RULES,
  mockStrategy,
  makeMulterFile,
} from '../test/mocks';
import { PDFParse } from 'pdf-parse';

// Mock pdf-parse — intercepte require('pdf-parse') dans extractText()
// getText() résout un TextResult ({ text, pages, total }), pas un string brut.
jest.mock('pdf-parse', () => ({
  PDFParse: jest.fn().mockImplementation(() => ({
    getText: jest.fn().mockResolvedValue({ text: 'Contenu PDF par défaut — mock initial. '.repeat(5) }),
    destroy: jest.fn().mockResolvedValue(undefined),
  })),
}));

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('StrategiesService', () => {
  let service: StrategiesService;
  let mockPrisma: ReturnType<typeof createMockPrismaService>;
  let mockAI: ReturnType<typeof createMockAIService>;

  const BASE_DTO = { name: 'Breakout BTC', timeframe: Timeframe.FOUR_H, asset: 'BTC/USDT' };

  beforeEach(async () => {
    mockPrisma = createMockPrismaService();
    mockAI     = createMockAIService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StrategiesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AIService,     useValue: mockAI },
      ],
    }).compile();

    service = module.get<StrategiesService>(StrategiesService);
  });

  // ── findAllByUser ──────────────────────────────────────────────────────────

  describe('findAllByUser', () => {
    it('retourne les stratégies de l\'utilisateur triées par date décroissante', async () => {
      const strats = [
        mockStrategy({ id: 'strat-1', createdAt: new Date('2026-03-01') }),
        mockStrategy({ id: 'strat-2', createdAt: new Date('2026-01-01') }),
      ];
      mockPrisma.strategy.findMany.mockResolvedValue(strats);

      const result = await service.findAllByUser('user-test-1');

      expect(mockPrisma.strategy.findMany).toHaveBeenCalledWith({
        where:   { userId: 'user-test-1' },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('strat-1');
    });

    it('retourne un tableau vide si l\'utilisateur n\'a aucune stratégie', async () => {
      mockPrisma.strategy.findMany.mockResolvedValue([]);

      const result = await service.findAllByUser('user-sans-strategies');

      expect(result).toEqual([]);
    });

    it('filtre uniquement par le userId demandé (isolation inter-utilisateurs)', async () => {
      mockPrisma.strategy.findMany.mockResolvedValue([]);

      await service.findAllByUser('user-A');

      const [callArgs] = mockPrisma.strategy.findMany.mock.calls;
      expect(callArgs[0].where.userId).toBe('user-A');
      expect(callArgs[0].where.userId).not.toBe('user-B');
    });

    it('propage les erreurs Prisma sans les masquer', async () => {
      mockPrisma.strategy.findMany.mockRejectedValue(new Error('DB connection timeout'));

      await expect(service.findAllByUser('user-test-1')).rejects.toThrow('DB connection timeout');
    });
  });

  // ── analyzeById ────────────────────────────────────────────────────────────

  describe('analyzeById', () => {
    it('retourne les règles Claude et met à jour la stratégie en base', async () => {
      const strat = mockStrategy();
      mockPrisma.strategy.findUnique.mockResolvedValue(strat);
      mockAI.analyzeStrategyDocument.mockResolvedValue(MOCK_STRATEGY_RULES);
      mockPrisma.strategy.update.mockResolvedValue(strat);

      const result = await service.analyzeById('strat-test-1', 'user-test-1');

      expect(result).toEqual({ rules: MOCK_STRATEGY_RULES, strategyId: 'strat-test-1' });
      expect(mockPrisma.strategy.update).toHaveBeenCalledWith({
        where: { id: 'strat-test-1' },
        data:  { code: JSON.stringify(MOCK_STRATEGY_RULES) },
      });
      expect(mockAI.analyzeStrategyDocument).toHaveBeenCalledWith(strat.code);
    });

    it('lève NotFoundException si la stratégie n\'existe pas en base', async () => {
      mockPrisma.strategy.findUnique.mockResolvedValue(null);

      await expect(
        service.analyzeById('inexistant', 'user-test-1'),
      ).rejects.toThrow(NotFoundException);

      expect(mockAI.analyzeStrategyDocument).not.toHaveBeenCalled();
    });

    it('lève NotFoundException si la stratégie appartient à un autre utilisateur', async () => {
      mockPrisma.strategy.findUnique.mockResolvedValue(
        mockStrategy({ userId: 'user-intrus' }),
      );

      await expect(
        service.analyzeById('strat-test-1', 'user-test-1'),
      ).rejects.toThrow(NotFoundException);

      // Vérifie qu'on ne consulte pas l'IA sur une stratégie étrangère
      expect(mockAI.analyzeStrategyDocument).not.toHaveBeenCalled();
    });

    it('propage l\'erreur si AIService.analyzeStrategyDocument échoue', async () => {
      mockPrisma.strategy.findUnique.mockResolvedValue(mockStrategy());
      mockAI.analyzeStrategyDocument.mockRejectedValue(
        new InternalServerErrorException('Claude API rate limit'),
      );

      await expect(
        service.analyzeById('strat-test-1', 'user-test-1'),
      ).rejects.toThrow(InternalServerErrorException);

      expect(mockPrisma.strategy.update).not.toHaveBeenCalled();
    });

    it('propage l\'erreur si Prisma.update échoue après l\'analyse Claude', async () => {
      mockPrisma.strategy.findUnique.mockResolvedValue(mockStrategy());
      mockAI.analyzeStrategyDocument.mockResolvedValue(MOCK_STRATEGY_RULES);
      mockPrisma.strategy.update.mockRejectedValue(new Error('DB write failure'));

      await expect(
        service.analyzeById('strat-test-1', 'user-test-1'),
      ).rejects.toThrow('DB write failure');
    });
  });

  // ── importFromDocument ─────────────────────────────────────────────────────

  describe('importFromDocument', () => {

    // ── Fichiers texte (TXT/plain) ────────────────────────────────────────────

    describe('fichier texte (TXT/plain)', () => {
      it('importe et persiste une stratégie avec succès depuis un fichier TXT', async () => {
        const content = 'Stratégie RSI breakout sur BTC. '.repeat(10);
        const strat   = mockStrategy();
        mockAI.analyzeStrategyDocument.mockResolvedValue(MOCK_STRATEGY_RULES);
        mockPrisma.strategy.create.mockResolvedValue(strat);

        const result = await service.importFromDocument(
          makeMulterFile(content),
          BASE_DTO,
          'user-test-1',
        );

        expect(result.message).toBe('Stratégie importée avec succès.');
        expect(result.strategy.id).toBe('strat-test-1');
        expect(result.rules).toEqual(MOCK_STRATEGY_RULES);
        expect(mockAI.analyzeStrategyDocument).toHaveBeenCalledWith(content);
      });

      it('tronque le texte à 15 000 caractères avant d\'appeler Claude', async () => {
        const longContent = 'A'.repeat(20_000);
        mockAI.analyzeStrategyDocument.mockResolvedValue(MOCK_STRATEGY_RULES);
        mockPrisma.strategy.create.mockResolvedValue(mockStrategy());

        await service.importFromDocument(makeMulterFile(longContent), BASE_DTO, 'user-test-1');

        const passedText = mockAI.analyzeStrategyDocument.mock.calls[0][0] as string;
        expect(passedText).toHaveLength(15_000);
        expect(passedText).toBe('A'.repeat(15_000));
      });

      it('ne tronque pas le texte s\'il est inférieur à 15 000 caractères', async () => {
        const content = 'B'.repeat(5_000);
        mockAI.analyzeStrategyDocument.mockResolvedValue(MOCK_STRATEGY_RULES);
        mockPrisma.strategy.create.mockResolvedValue(mockStrategy());

        await service.importFromDocument(makeMulterFile(content), BASE_DTO, 'user-test-1');

        const passedText = mockAI.analyzeStrategyDocument.mock.calls[0][0] as string;
        expect(passedText).toHaveLength(5_000);
      });

      it('utilise "BTC/USDT" comme asset par défaut si le champ est absent du DTO', async () => {
        const dtoSansAsset = { name: 'Test', timeframe: Timeframe.ONE_H };
        mockAI.analyzeStrategyDocument.mockResolvedValue(MOCK_STRATEGY_RULES);
        mockPrisma.strategy.create.mockResolvedValue(mockStrategy());

        await service.importFromDocument(makeMulterFile('C'.repeat(100)), dtoSansAsset, 'user-test-1');

        const createData = mockPrisma.strategy.create.mock.calls[0][0].data;
        expect(createData.asset).toBe('BTC/USDT');
      });

      it('utilise l\'asset fourni dans le DTO lorsqu\'il est présent', async () => {
        const dtoAvecAsset = { ...BASE_DTO, asset: 'ETH/USDT' };
        mockAI.analyzeStrategyDocument.mockResolvedValue(MOCK_STRATEGY_RULES);
        mockPrisma.strategy.create.mockResolvedValue(mockStrategy());

        await service.importFromDocument(makeMulterFile('D'.repeat(100)), dtoAvecAsset, 'user-test-1');

        const createData = mockPrisma.strategy.create.mock.calls[0][0].data;
        expect(createData.asset).toBe('ETH/USDT');
      });

      it('persiste toujours le status à "inactive" lors de la création', async () => {
        mockAI.analyzeStrategyDocument.mockResolvedValue(MOCK_STRATEGY_RULES);
        mockPrisma.strategy.create.mockResolvedValue(mockStrategy());

        await service.importFromDocument(makeMulterFile('E'.repeat(100)), BASE_DTO, 'user-test-1');

        const createData = mockPrisma.strategy.create.mock.calls[0][0].data;
        expect(createData.status).toBe('inactive');
      });

      it('persiste description à null si absente du DTO', async () => {
        const dtoSansDesc = { name: 'Test sans desc', timeframe: Timeframe.ONE_H };
        mockAI.analyzeStrategyDocument.mockResolvedValue(MOCK_STRATEGY_RULES);
        mockPrisma.strategy.create.mockResolvedValue(mockStrategy());

        await service.importFromDocument(makeMulterFile('F'.repeat(100)), dtoSansDesc, 'user-test-1');

        const createData = mockPrisma.strategy.create.mock.calls[0][0].data;
        expect(createData.description).toBeNull();
      });
    });

    // ── Fichier PDF ───────────────────────────────────────────────────────────

    describe('fichier PDF (application/pdf)', () => {
      it('extrait le contenu d\'un PDF et importe la stratégie avec succès', async () => {
        const extractedText = 'Contenu PDF valide extrait correctement. '.repeat(5);
        (PDFParse as unknown as jest.Mock).mockImplementationOnce(() => ({
          getText: jest.fn().mockResolvedValue({ text: extractedText }),
          destroy: jest.fn().mockResolvedValue(undefined),
        }));
        mockAI.analyzeStrategyDocument.mockResolvedValue(MOCK_STRATEGY_RULES);
        mockPrisma.strategy.create.mockResolvedValue(mockStrategy());

        const pdfFile = makeMulterFile(Buffer.alloc(1024), 'application/pdf', 'strategy.pdf');
        const result  = await service.importFromDocument(pdfFile, BASE_DTO, 'user-test-1');

        expect(result.message).toBe('Stratégie importée avec succès.');
        expect(mockAI.analyzeStrategyDocument).toHaveBeenCalledWith(extractedText);
      });

      it('lève BadRequestException (et non TypeError) si getText() résout sans champ text — régression bug prod "rawText.trim is not a function"', async () => {
        (PDFParse as unknown as jest.Mock).mockImplementationOnce(() => ({
          getText: jest.fn().mockResolvedValue({}),
          destroy: jest.fn().mockResolvedValue(undefined),
        }));

        const pdfFile = makeMulterFile(Buffer.alloc(1024), 'application/pdf', 'strategy.pdf');

        await expect(
          service.importFromDocument(pdfFile, BASE_DTO, 'user-test-1'),
        ).rejects.toThrow(BadRequestException);
      });

      it('passe le buffer du fichier à PDFParse lors de l\'extraction', async () => {
        const pdfBuffer = Buffer.from('%PDF-1.4 mock content binaire', 'utf-8');
        let capturedOpts: { data: Buffer } | undefined;

        (PDFParse as unknown as jest.Mock).mockImplementationOnce((opts: { data: Buffer }) => {
          capturedOpts = opts;
          return {
            getText:  jest.fn().mockResolvedValue({ text: 'Texte extrait valide. '.repeat(5) }),
            destroy:  jest.fn().mockResolvedValue(undefined),
          };
        });
        mockAI.analyzeStrategyDocument.mockResolvedValue(MOCK_STRATEGY_RULES);
        mockPrisma.strategy.create.mockResolvedValue(mockStrategy());

        const pdfFile = makeMulterFile(pdfBuffer, 'application/pdf', 'strategy.pdf');
        await service.importFromDocument(pdfFile, BASE_DTO, 'user-test-1');

        expect(capturedOpts?.data).toEqual(pdfBuffer);
      });
    });

    // ── Validations de contenu ────────────────────────────────────────────────

    describe('validations de contenu', () => {
      it('lève BadRequestException si le texte extrait fait moins de 50 caractères', async () => {
        await expect(
          service.importFromDocument(makeMulterFile('Court'), BASE_DTO, 'user-test-1'),
        ).rejects.toThrow(BadRequestException);

        expect(mockAI.analyzeStrategyDocument).not.toHaveBeenCalled();
        expect(mockPrisma.strategy.create).not.toHaveBeenCalled();
      });

      it('lève BadRequestException si le fichier est vide', async () => {
        await expect(
          service.importFromDocument(makeMulterFile(''), BASE_DTO, 'user-test-1'),
        ).rejects.toThrow(BadRequestException);
      });

      it('lève BadRequestException si le contenu est uniquement des espaces et retours ligne', async () => {
        await expect(
          service.importFromDocument(makeMulterFile('   \n\t  \n   '), BASE_DTO, 'user-test-1'),
        ).rejects.toThrow(BadRequestException);
      });

      it('accepte un texte à exactement 50 caractères (limite basse incluse)', async () => {
        const exactly50 = 'A'.repeat(50);
        mockAI.analyzeStrategyDocument.mockResolvedValue(MOCK_STRATEGY_RULES);
        mockPrisma.strategy.create.mockResolvedValue(mockStrategy());

        await expect(
          service.importFromDocument(makeMulterFile(exactly50), BASE_DTO, 'user-test-1'),
        ).resolves.not.toThrow();
      });

      it('ne réenveloppe pas BadRequestException dans InternalServerErrorException', async () => {
        const error = await service
          .importFromDocument(makeMulterFile('Trop court'), BASE_DTO, 'user-test-1')
          .catch((e: Error) => e);

        expect(error).toBeInstanceOf(BadRequestException);
        expect(error).not.toBeInstanceOf(InternalServerErrorException);
      });
    });

    // ── Gestion des erreurs externes ──────────────────────────────────────────

    describe('gestion des erreurs externes', () => {
      it('lève InternalServerErrorException si AIService.analyzeStrategyDocument échoue', async () => {
        const content = 'G'.repeat(200);
        mockAI.analyzeStrategyDocument.mockRejectedValue(new Error('Claude API timeout'));

        await expect(
          service.importFromDocument(makeMulterFile(content), BASE_DTO, 'user-test-1'),
        ).rejects.toThrow(InternalServerErrorException);

        expect(mockPrisma.strategy.create).not.toHaveBeenCalled();
      });

      it('préserve le message d\'erreur d\'origine dans InternalServerErrorException', async () => {
        const content = 'H'.repeat(200);
        mockAI.analyzeStrategyDocument.mockRejectedValue(new Error('Rate limit exceeded: 429'));

        const error = await service
          .importFromDocument(makeMulterFile(content), BASE_DTO, 'user-test-1')
          .catch((e: Error) => e);

        expect(error).toBeInstanceOf(InternalServerErrorException);
        expect(error.message).toContain('Rate limit exceeded: 429');
      });

      it('lève InternalServerErrorException si Prisma.strategy.create échoue', async () => {
        const content = 'I'.repeat(200);
        mockAI.analyzeStrategyDocument.mockResolvedValue(MOCK_STRATEGY_RULES);
        mockPrisma.strategy.create.mockRejectedValue(new Error('Unique constraint violated'));

        await expect(
          service.importFromDocument(makeMulterFile(content), BASE_DTO, 'user-test-1'),
        ).rejects.toThrow(InternalServerErrorException);
      });

      it('n\'appelle pas Claude ni Prisma si l\'extraction PDF échoue', async () => {
        (PDFParse as unknown as jest.Mock).mockImplementationOnce(() => ({
          getText:  jest.fn().mockRejectedValue(new Error('PDF corrompu ou illisible')),
          destroy:  jest.fn().mockResolvedValue(undefined),
        }));

        const pdfFile = makeMulterFile(Buffer.alloc(512), 'application/pdf');

        await expect(
          service.importFromDocument(pdfFile, BASE_DTO, 'user-test-1'),
        ).rejects.toThrow(InternalServerErrorException);

        expect(mockAI.analyzeStrategyDocument).not.toHaveBeenCalled();
        expect(mockPrisma.strategy.create).not.toHaveBeenCalled();
      });
    });
  });
});
