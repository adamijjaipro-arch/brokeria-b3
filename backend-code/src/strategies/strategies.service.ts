import { Injectable, BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AIService } from '../ai/ai.service';
import { ImportStrategyDto } from './dto/import-strategy.dto';

const MAX_TEXT_LENGTH = 15_000;

@Injectable()
export class StrategiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AIService,
  ) {}

  async findAllByUser(userId: string) {
    return this.prisma.strategy.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async analyzeById(id: string, userId: string) {
    try {
      const strategy = await this.prisma.strategy.findUnique({ where: { id } });

      if (!strategy || strategy.userId !== userId) {
        throw new NotFoundException('Stratégie introuvable');
      }

      console.log('[StrategiesService] analyzeById - strategyId:', id, '- code length:', strategy.code?.length);

      const rules = await this.aiService.analyzeStrategyDocument(strategy.code);

      await this.prisma.strategy.update({
        where: { id },
        data: { code: JSON.stringify(rules) },
      });

      return { rules, strategyId: id };
    } catch (error: unknown) {
      if (error instanceof NotFoundException) throw error;
      const err = error as Error;
      console.error('[StrategiesService] analyzeById ERREUR:', err.message);
      console.error('[StrategiesService] analyzeById STACK:', err.stack);
      throw error;
    }
  }

  async importFromDocument(
    file: Express.Multer.File,
    dto: ImportStrategyDto,
    userId: string,
  ) {
    try {
      console.log('[StrategiesService] importFromDocument - mimetype:', file.mimetype, '- size:', file.size);

      const rawText = await this.extractText(file);
      console.log('[StrategiesService] extractText OK - chars:', rawText.length);

      if (rawText.trim().length < 50) {
        throw new BadRequestException(
          'Le document est trop court ou illisible (minimum 50 caractères de texte exploitable).',
        );
      }

      const text =
        rawText.length > MAX_TEXT_LENGTH
          ? rawText.slice(0, MAX_TEXT_LENGTH)
          : rawText;

      console.log('[StrategiesService] Appel Claude API...');
      const rules = await this.aiService.analyzeStrategyDocument(text);
      console.log('[StrategiesService] Claude OK - règles reçues:', !!rules);

      const strategy = await this.prisma.strategy.create({
        data: {
          userId,
          name:        dto.name,
          description: dto.description ?? null,
          asset:       dto.asset?.trim() || 'BTC/USDT',
          timeframe:   dto.timeframe,
          code:        JSON.stringify(rules),
          status:      'inactive',
        },
      });

      return { message: 'Stratégie importée avec succès.', strategy, rules };
    } catch (error: unknown) {
      if (error instanceof BadRequestException) throw error;
      const err = error as Error;
      console.error('[StrategiesService] importFromDocument ERREUR:', err.message);
      console.error('[StrategiesService] importFromDocument STACK:', err.stack);
      throw new InternalServerErrorException(err.message ?? 'Erreur lors de l\'import');
    }
  }

  private async extractText(file: Express.Multer.File): Promise<string> {
    if (file.mimetype === 'application/pdf') {
      // pdf-parse v2 exporte une classe PDFParse (plus de fonction directe).
      // getText() résout un objet `TextResult` ({ pages, text, total }), pas un string brut.
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { PDFParse } = require('pdf-parse') as {
        PDFParse: new (opts: { data: Buffer }) => {
          getText(): Promise<{ text?: string }>;
          destroy(): Promise<void>;
        };
      };
      const parser = new PDFParse({ data: file.buffer });
      try {
        const result = await parser.getText();
        return String(result?.text ?? '');
      } finally {
        await parser.destroy();
      }
    }
    return file.buffer.toString('utf-8');
  }
}
