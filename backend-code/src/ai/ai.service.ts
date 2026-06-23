import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs';
import type { StrategyRules } from './interfaces/strategy-rules.interface';

export type { StrategyRules } from './interfaces/strategy-rules.interface';

const execAsync = promisify(exec);

const CLAUDE_MODEL = 'claude-sonnet-4-6';

const SYSTEM_PROMPT = `Tu es un expert en trading algorithmique et en analyse de stratégies financières. Analyse le document fourni et extrais TOUTES les règles de trading.
Réponds UNIQUEMENT avec un objet JSON valide, sans markdown, sans texte avant ou après, sans backticks.
Structure JSON obligatoire :
{
  "name": string,
  "description": string,
  "entry_conditions": string[],
  "exit_conditions": string[],
  "indicators": [{ "name": string, "params": string }],
  "timeframe": string,
  "asset_type": string,
  "risk_management": {
    "stop_loss": string,
    "take_profit": string,
    "position_size": string,
    "risk_reward": string
  },
  "sessions": string[],
  "confidence_score": number
}`;

function cleanJsonResponse(raw: string): string {
  // Retire les blocs ```json ... ``` ou ``` ... ```
  let cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '');
  // Extrait uniquement ce qui est entre { et }
  const start = cleaned.indexOf('{');
  const end   = cleaned.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    cleaned = cleaned.slice(start, end + 1);
  }
  return cleaned.trim();
}

function validateStrategyRules(obj: unknown): obj is StrategyRules {
  if (typeof obj !== 'object' || obj === null) return false;
  const r = obj as Record<string, unknown>;
  return (
    typeof r['name']             === 'string'  &&
    typeof r['description']      === 'string'  &&
    Array.isArray(r['entry_conditions'])        &&
    Array.isArray(r['exit_conditions'])         &&
    Array.isArray(r['indicators'])              &&
    typeof r['timeframe']        === 'string'  &&
    typeof r['asset_type']       === 'string'  &&
    typeof r['risk_management']  === 'object'  &&
    r['risk_management'] !== null              &&
    Array.isArray(r['sessions'])               &&
    typeof r['confidence_score'] === 'number'
  );
}

@Injectable()
export class AIService {
  private readonly pythonModulePath: string;

  constructor(private readonly config: ConfigService) {
    this.pythonModulePath = path.join(process.cwd(), 'ai-module');
    console.log('ANTHROPIC_API_KEY loaded:', !!process.env.ANTHROPIC_API_KEY);
  }

  // ─── Analyse Claude (PDF / TXT / MD) ─────────────────────────────────────────

  async analyzeStrategyDocument(text: string): Promise<StrategyRules> {
    const apiKey = this.config.get<string>('ANTHROPIC_API_KEY');

    if (!apiKey) {
      console.error('[AIService] ANTHROPIC_API_KEY manquante dans .env');
      throw new InternalServerErrorException('Clé API Anthropic non configurée.');
    }

    const client = new Anthropic({ apiKey });

    let rawContent: string;

    try {
      const response = await client.messages.create({
        model:      CLAUDE_MODEL,
        max_tokens: 4096,
        system:     SYSTEM_PROMPT,
        messages:   [{ role: 'user', content: text }],
      });

      const block = response.content[0];
      if (!block || block.type !== 'text') {
        throw new Error('Réponse Claude vide ou format inattendu');
      }
      rawContent = block.text;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[AIService] Erreur appel Claude API:', msg);
      throw new InternalServerErrorException(`Erreur Claude API : ${msg}`);
    }

    const cleaned = cleanJsonResponse(rawContent);

    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[AIService] JSON.parse échoué. Réponse brute Claude:\n', rawContent);
      throw new InternalServerErrorException(
        `Claude n'a pas retourné un JSON valide. Erreur : ${msg}. Réponse : ${rawContent.slice(0, 300)}`,
      );
    }

    if (!validateStrategyRules(parsed)) {
      console.error('[AIService] Structure JSON invalide:', JSON.stringify(parsed, null, 2));
      throw new InternalServerErrorException(
        'Le JSON retourné par Claude ne correspond pas à la structure StrategyRules attendue.',
      );
    }

    // Normalisation défensive des tableaux
    return {
      ...parsed,
      entry_conditions: parsed.entry_conditions.map(String),
      exit_conditions:  parsed.exit_conditions.map(String),
      sessions:         parsed.sessions.map(String),
      confidence_score: Math.min(100, Math.max(0, Number(parsed.confidence_score))),
    };
  }

  // ─── Méthodes Python existantes (inchangées) ──────────────────────────────────

  async analyzeStrategy(
    strategyCode: string,
    historicalData: unknown[],
  ): Promise<unknown> {
    try {
      const dataFile = path.join(process.cwd(), 'temp', `data_${Date.now()}.json`);
      fs.mkdirSync(path.dirname(dataFile), { recursive: true });
      fs.writeFileSync(dataFile, JSON.stringify(historicalData));

      const pythonScript = `
import json, sys
sys.path.insert(0, '${this.pythonModulePath}')
from candlestick_patterns import CandlestickPatternDetector
from indicators_calculator import TechnicalIndicators
import pandas as pd

with open('${dataFile}', 'r') as f:
    data = json.load(f)

df = pd.DataFrame(data)
patterns = CandlestickPatternDetector(df).detect_all()
result = {
    'patterns_count': len(patterns),
    'patterns': [p.name for p in patterns],
    'analysis': 'Strategy analyzed successfully'
}
print(json.dumps(result))
`;
      const { stdout } = await execAsync(`python -c "${pythonScript}"`);
      return JSON.parse(stdout.trim()) as unknown;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { error: msg, analysis: 'Failed to analyze strategy' };
    }
  }

  async detectPatterns(asset: string, candleData: unknown[]): Promise<unknown> {
    try {
      const dataFile = path.join(process.cwd(), 'temp', `patterns_${Date.now()}.json`);
      fs.mkdirSync(path.dirname(dataFile), { recursive: true });
      fs.writeFileSync(dataFile, JSON.stringify(candleData));

      const pythonScript = `
import json, sys
sys.path.insert(0, '${this.pythonModulePath}')
from candlestick_patterns import CandlestickPatternDetector
from chart_patterns import ChartPatternDetector
import pandas as pd

with open('${dataFile}', 'r') as f:
    data = json.load(f)

df = pd.DataFrame(data)
candle_patterns = CandlestickPatternDetector(df).detect_all()
chart_patterns  = ChartPatternDetector(df).detect_all()
result = {
    'asset': '${asset}',
    'candlestick_patterns': [{'name': p.name, 'direction': p.direction, 'confidence': p.confidence} for p in candle_patterns],
    'chart_patterns':       [{'name': p.name, 'direction': p.direction, 'confidence': p.confidence} for p in chart_patterns],
    'total_patterns': len(candle_patterns) + len(chart_patterns)
}
print(json.dumps(result))
`;
      const { stdout } = await execAsync(`python -c "${pythonScript}"`);
      return JSON.parse(stdout.trim()) as unknown;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { error: msg, asset, patterns: [] };
    }
  }

  async generateSignal(asset: string, priceData: unknown[], timeframe = '1h'): Promise<unknown> {
    try {
      const dataFile = path.join(process.cwd(), 'temp', `signal_${Date.now()}.json`);
      fs.mkdirSync(path.dirname(dataFile), { recursive: true });
      fs.writeFileSync(dataFile, JSON.stringify(priceData));

      const pythonScript = `
import json, sys
sys.path.insert(0, '${this.pythonModulePath}')
from signal_generator import SignalGenerator
import pandas as pd

with open('${dataFile}', 'r') as f:
    data = json.load(f)

df = pd.DataFrame(data)
signal_gen = SignalGenerator(df, '${asset}')
signal = signal_gen.generate_signal()
result = {
    'asset': signal.asset, 'direction': signal.direction,
    'entry_price': signal.entry_price, 'stop_loss': signal.stop_loss,
    'take_profit': signal.take_profit, 'confidence': signal.confidence,
    'risk_reward_ratio': signal.risk_reward_ratio, 'timeframe': '${timeframe}',
    'timestamp': signal.timestamp.isoformat()
}
print(json.dumps(result))
`;
      const { stdout } = await execAsync(`python -c "${pythonScript}"`);
      return JSON.parse(stdout.trim()) as unknown;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { error: msg, asset, direction: 'HOLD' };
    }
  }

  async getPatternsHistory(asset: string): Promise<unknown> {
    return {
      asset,
      patterns: [
        { name: 'Hammer',     count: 12, avg_confidence: 82 },
        { name: 'Doji',       count: 8,  avg_confidence: 75 },
        { name: 'Double Top', count: 5,  avg_confidence: 80 },
      ],
    };
  }

  async getSignalsForAsset(asset: string, limit = 10): Promise<unknown> {
    return { asset, signals: [], total: 0, limit };
  }

  async backtestStrategy(
    strategyCode: string,
    historicalData: unknown[],
    initialCapital = 10_000,
  ): Promise<unknown> {
    void historicalData;
    return {
      strategyCode:   strategyCode.substring(0, 50) + '...',
      initialCapital,
      finalBalance:   initialCapital * 1.15,
      totalReturn:    15,
      totalTrades:    42,
      winRate:        65,
      maxDrawdown:    8.5,
      sharpeRatio:    1.8,
    };
  }
}
