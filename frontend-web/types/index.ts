// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  username: string;
}

export interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
}

// ─── Signals ──────────────────────────────────────────────────────────────────

export type SignalDirection = 'BUY' | 'SELL' | 'HOLD';

export interface Signal {
  id: string;
  asset: string;
  direction: SignalDirection;
  timeframe?: string | null;
  confidence: number;
  entry_price: number;
  stop_loss: number;
  take_profit: number;
  patterns?: string | null;
  indicators?: string | null;
  createdAt: string;
}

export interface SignalStats {
  totalSignals: number;
  buySignals: number;
  sellSignals: number;
  averageConfidence: number;
}

export interface CreateSignalPayload {
  asset: string;
  direction: SignalDirection;
  confidence: number;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  detectedPatterns?: string[];
  indicators?: Record<string, unknown>;
}

// ─── Simulator ────────────────────────────────────────────────────────────────

export interface DCAParams {
  asset: string;
  initialAmount: number;
  monthlyInvestment: number;
  months: number;
  annualReturn?: number;
  volatility?: number;
  mode?: 'monte_carlo' | 'fixed';
}

export interface DCAMonthlyData {
  month: number;
  balance: number;
  invested: number;
}

export interface DCAResult {
  totalInvested: number;
  finalBalance: number;
  totalGains: number;
  roi: number;
  monthlyData: DCAMonthlyData[];
}

export interface SimulationRecord {
  id:          string;
  asset:       string;
  params:      string;       // JSON: { initialAmount, monthlyInvestment, months, annualReturn, volatility, mode }
  result:      string;       // JSON: { totalInvested, finalBalance, totalGains, roi }
  monthlyData: string | null; // JSON array — persisted for exact replay
  createdAt:   string;
}

// ─── Portfolio ────────────────────────────────────────────────────────────────

export interface PortfolioHistory {
  months: string[];
  values: number[];
}

export interface PortfolioStats {
  capitalTotal: number | null;
  capitalGrowthPercent: number | null;
  winRate: number | null;
  performance: number | null;
}

// ─── API ──────────────────────────────────────────────────────────────────────

export interface ApiEnvelope<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
}
