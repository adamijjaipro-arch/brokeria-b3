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
  initialAmount: number;
  monthlyInvestment: number;
  months: number;
  annualReturn?: number;
  volatility?: number;
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
