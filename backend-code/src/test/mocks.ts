import type { StrategyRules } from '../ai/interfaces/strategy-rules.interface';
import { Timeframe } from '../strategies/dto/import-strategy.dto';

// ─── Mock PrismaService ────────────────────────────────────────────────────────

export const createMockPrismaService = () => ({
  user: {
    findUnique: jest.fn(),
    findFirst:  jest.fn(),
    create:     jest.fn(),
    update:     jest.fn(),
  },
  strategy: {
    findMany:   jest.fn(),
    findUnique: jest.fn(),
    create:     jest.fn(),
    update:     jest.fn(),
    delete:     jest.fn(),
  },
  signal: {
    findMany:   jest.fn(),
    findUnique: jest.fn(),
    create:     jest.fn(),
  },
  authLog: {
    create: jest.fn().mockResolvedValue({}),
  },
  webAuthnCredential: {
    create:     jest.fn(),
    findMany:   jest.fn(),
    findUnique: jest.fn(),
    update:     jest.fn(),
    delete:     jest.fn(),
  },
});

// ─── Mock RedisService ─────────────────────────────────────────────────────────

export const createMockRedisService = () => ({
  get:    jest.fn().mockResolvedValue(null),
  set:    jest.fn().mockResolvedValue(undefined),
  del:    jest.fn().mockResolvedValue(undefined),
  exists: jest.fn().mockResolvedValue(false),
});

// ─── Mock AIService ────────────────────────────────────────────────────────────

export const createMockAIService = () => ({
  analyzeStrategyDocument: jest.fn().mockResolvedValue(MOCK_STRATEGY_RULES),
  analyzeStrategy:         jest.fn().mockResolvedValue({ analysis: 'ok', patterns_count: 0 }),
  generateSignal:          jest.fn().mockResolvedValue({ asset: 'BTC/USDT', direction: 'BUY', confidence: 80 }),
  detectPatterns:          jest.fn().mockResolvedValue({ patterns: [] }),
});

// ─── Mock LoggingService ───────────────────────────────────────────────────────

export const createMockLoggingService = () => ({
  authSuccess:    jest.fn().mockResolvedValue(undefined),
  authFailure:    jest.fn().mockResolvedValue(undefined),
  accountLocked:  jest.fn().mockResolvedValue(undefined),
  mfaEnrolled:    jest.fn().mockResolvedValue(undefined),
  mfaRevoked:     jest.fn().mockResolvedValue(undefined),
  emit:           jest.fn().mockResolvedValue(undefined),
  onModuleDestroy: jest.fn().mockResolvedValue(undefined),
});

// ─── Fixtures ─────────────────────────────────────────────────────────────────

export const MOCK_STRATEGY_RULES: StrategyRules = {
  name:             'Breakout BTC Test',
  description:      'Stratégie de breakout sur résistance majeure',
  entry_conditions: ['RSI(14) > 60', 'Volume > moyenne 20j * 1.2', 'Prix > EMA 200'],
  exit_conditions:  ['RSI(14) > 80', 'Bougie de renversement bearish'],
  indicators:       [
    { name: 'RSI',  params: 'period=14' },
    { name: 'EMA',  params: 'period=200' },
  ],
  timeframe:        '4h',
  asset_type:       'crypto',
  risk_management:  {
    stop_loss:     '2% sous le niveau de breakout',
    take_profit:   '6% au-dessus du breakout',
    position_size: '2% du capital',
    risk_reward:   '1:3',
  },
  sessions:         ['London', 'New York'],
  confidence_score: 82,
};

export const mockStrategyRules = (overrides: Partial<StrategyRules> = {}): StrategyRules => ({
  ...MOCK_STRATEGY_RULES,
  ...overrides,
});

export const mockStrategy = (overrides: Record<string, unknown> = {}) => ({
  id:          'strat-test-1',
  userId:      'user-test-1',
  name:        'Breakout BTC Test',
  description: 'Stratégie de breakout sur résistance majeure',
  asset:       'BTC/USDT',
  timeframe:   Timeframe.FOUR_H,
  code:        JSON.stringify(MOCK_STRATEGY_RULES),
  status:      'inactive' as const,
  createdAt:   new Date('2026-01-01T00:00:00.000Z'),
  ...overrides,
});

export const mockUser = (overrides: Record<string, unknown> = {}) => ({
  id:           'user-test-1',
  email:        'test@alvio.io',
  username:     'testuser',
  passwordHash: '$2b$12$hashedpassword',
  pin:          null,
  totpEnabled:  false,
  totpSecret:   null,
  createdAt:    new Date('2026-01-01T00:00:00.000Z'),
  ...overrides,
});

// ─── Helper Express.Multer.File ────────────────────────────────────────────────

export const makeMulterFile = (
  content: string | Buffer,
  mimetype = 'text/plain',
  originalname = 'strategy.txt',
): Express.Multer.File => {
  const buffer = typeof content === 'string' ? Buffer.from(content, 'utf-8') : content;
  return {
    buffer,
    mimetype,
    originalname,
    size:        buffer.length,
    fieldname:   'file',
    encoding:    '7bit',
    destination: '',
    filename:    '',
    path:        '',
    stream:      null as any,
  };
};
