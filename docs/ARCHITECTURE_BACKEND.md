# Architecture Backend — Alvio
## Flux complet : Frontend → Controller → Service → Repository → PostgreSQL

**Stack :** Next.js 14 (frontend) · NestJS 10 (backend) · Prisma ORM · PostgreSQL · Redis · JWT (Bearer)  
**Module illustré :** `Signals` — module central de génération et consultation des signaux de trading  

---

## 1) Côté Frontend — Client HTTP Axios avec JWT

Le frontend Next.js communique exclusivement avec le backend NestJS via un client Axios centralisé,
défini dans `frontend-web/api/index.ts`. Ce client gère automatiquement l'injection du Bearer token,
le désenveloppement des réponses, et le renouvellement silencieux du token d'accès sur erreur 401.

Le token d'accès (access token, TTL 15 min) est stocké **en mémoire** dans un store Zustand.
Le token de rafraîchissement (refresh token, TTL 7 jours) est stocké dans un **cookie httpOnly**,
jamais accessible depuis JavaScript, ce qui le protège contre les attaques XSS.

```typescript
// frontend-web/api/index.ts

import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/context/authStore';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // Envoie les cookies httpOnly (dont refresh_token)
});

// ─── Request interceptor : injecte le Bearer token depuis le store ────────────
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  // getState() est synchrone — utilisable en dehors de React
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Response interceptor 1 : déroule l'envelope { data: ... } ───────────────
api.interceptors.response.use(
  (res) => {
    if (res.data && Object.prototype.hasOwnProperty.call(res.data, 'data')) {
      res.data = res.data.data;
    }
    return res;
  },
  (error) => Promise.reject(error),
);
```

Les appels spécifiques au module Signals sont regroupés dans `signalsApi` :

```typescript
// frontend-web/api/index.ts — signalsApi

import type { Signal, SignalStats, CreateSignalPayload } from '@/types';

export const signalsApi = {
  getAll:       () => api.get<Signal[]>('/signals'),
  getRecent:    () => api.get<Signal[]>('/signals/recent'),
  getStatistics:() => api.get<SignalStats>('/signals/statistics'),
  create:       (signal: CreateSignalPayload) => api.post<Signal>('/signals', signal),
};
```

Les types TypeScript utilisés côté client sont définis dans `frontend-web/types/index.ts` :

```typescript
// frontend-web/types/index.ts

export type SignalDirection = 'BUY' | 'SELL' | 'HOLD';

export interface Signal {
  id:          string;
  asset:       string;
  direction:   SignalDirection;
  confidence:  number;
  entry_price: number;
  stop_loss:   number;
  take_profit: number;
  patterns?:   string | null;  // JSON array sérialisé
  indicators?: string | null;  // JSON object sérialisé
  createdAt:   string;
}

export interface SignalStats {
  totalSignals:       number;
  buySignals:         number;
  sellSignals:        number;
  averageConfidence:  number;
}

export interface CreateSignalPayload {
  asset:             string;
  direction:         SignalDirection;
  confidence:        number;
  entryPrice:        number;
  stopLoss:          number;
  takeProfit:        number;
  detectedPatterns?: string[];
  indicators?:       Record<string, unknown>;
}
```

---

## 2) Guard JWT — Validation du token d'accès

Avant d'atteindre le controller, chaque requête passe par `JwtAuthGuard`.
Ce guard, basé sur Passport.js avec la stratégie `passport-jwt`, extrait le Bearer token
du header `Authorization`, le vérifie contre le secret `JWT_SECRET`, et injecte le payload
décodé dans `request.user`. En développement, il accepte un header `x-dev-user-id` pour
contourner l'authentification sans modifier le flux de production.

```typescript
// backend-code/src/auth/guards/jwt-auth.guard.ts

import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(
    context: ExecutionContext,
  ): boolean | Observable<boolean> | Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    // Mode DEV : bypass avec header x-dev-user-id
    if (process.env.NODE_ENV !== 'production') {
      const devUserId = request.headers['x-dev-user-id'];
      if (devUserId) {
        request.user = { id: devUserId as string };
        return true;
      }
    }

    return super.canActivate(context);
  }
}
```

La stratégie JWT sous-jacente extrait `sub` (userId), `email` et `jti` (JWT ID unique) du payload
et les expose via `request.user` :

```typescript
// backend-code/src/auth/strategies/jwt.strategy.ts

export interface JwtPayload {
  sub:   string;  // userId
  email: string;
  jti:   string;  // JWT ID — utilisé pour la révocation dans Redis
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private config: ConfigService,
    private redis:  RedisService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET') ?? 'dev-secret-change-me',
    });
  }

  async validate(payload: JwtPayload) {
    // Retourne l'objet injecté dans request.user
    return { id: payload.sub, email: payload.email, jti: payload.jti };
  }
}
```

Le token d'accès est émis dans `AuthService.issueTokens()` avec un TTL de 15 minutes.
Le refresh token (TTL 7 jours) est stocké en **cookie httpOnly** ET référencé dans Redis
sous la clé `refresh:{jti}` pour permettre la révocation immédiate :

```typescript
// backend-code/src/auth/auth.service.ts — méthode privée issueTokens()

const jti = crypto.randomUUID();

const accessToken = this.jwtService.sign(
  { sub: userId, email: userEmail, jti },
  { secret: this.config.get<string>('JWT_SECRET'), expiresIn: '900s' }, // 15 min
);

const refreshToken = this.jwtService.sign(
  { sub: userId, email: userEmail, jti },
  { secret: this.config.get<string>('JWT_REFRESH_SECRET'), expiresIn: '604800s' }, // 7 jours
);

// Persistance dans Redis pour révocation
await this.redis.set(`refresh:${jti}`, userId, 604800);

// Cookie httpOnly — inaccessible depuis JavaScript
res.cookie('refresh_token', refreshToken, {
  httpOnly: true,
  sameSite: 'lax',
  secure:   isProd,
  maxAge:   604800 * 1000,
  path:     '/',
});
```

---

## 3) Controller — SignalsController

Le `SignalsController` est le point d'entrée HTTP du module Signals.
Annoté `@UseGuards(JwtGuard)` au niveau de la classe, il protège l'ensemble de ses routes.
Il délègue intégralement la logique métier à `SignalsService` et `SignalSchedulerService`,
sans aucune logique de transformation ou de validation propre.

```typescript
// backend-code/src/signals/signals.controller.ts

import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { SignalsService }          from './signals.service';
import { SignalSchedulerService }  from './signal-scheduler.service';
import { JwtGuard }                from '../auth/jwt.guard';
import { CreateSignalDto }         from './dto/create-signal.dto';
import { GenerateSignalDto }       from './dto/generate-signal.dto';

@Controller('signals')
@UseGuards(JwtGuard)          // Protection JWT sur toutes les routes du controller
export class SignalsController {
  constructor(
    private signalsService: SignalsService,
    private scheduler:      SignalSchedulerService,
  ) {}

  @Get()
  async getSignals(@Request() req: any) {
    return this.signalsService.getUserSignals(req.user.id);
  }

  @Get('recent')
  async getRecentSignals(@Request() req: any) {
    return this.signalsService.getRecentSignals(req.user.id, 5);
  }

  @Get('statistics')
  async getSignalsStatistics(@Request() req: any) {
    return this.signalsService.getSignalsStatistics(req.user.id);
  }

  @Post()
  async createSignal(
    @Body() createSignalDto: CreateSignalDto,
    @Request() req: any,
  ) {
    return this.signalsService.createSignal(req.user.id, createSignalDto);
  }

  /**
   * POST /signals/generate
   * Déclenche la détection de pattern (Module 3) puis mappe et persiste
   * un Signal si applicable. mockResult bypass CoinGecko (usage en tests).
   */
  @Post('generate')
  async generateSignal(
    @Body() dto: GenerateSignalDto,
    @Request() req: any,
  ) {
    return this.signalsService.generateSignal(req.user.id, dto);
  }

  /**
   * POST /signals/scan-now
   * Déclenche immédiatement le scan planifié de toutes les stratégies actives.
   */
  @Post('scan-now')
  async scanNow() {
    return this.scheduler.runScan();
  }
}
```

Les **DTOs** (Data Transfer Objects) définissent et valident le contrat d'entrée via `class-validator` :

```typescript
// backend-code/src/signals/dto/create-signal.dto.ts

import { IsString, IsNumber, Min, Max } from 'class-validator';

export class CreateSignalDto {
  @IsString()
  asset: string;

  @IsString()
  direction: 'BUY' | 'SELL' | 'HOLD';

  @IsNumber()
  @Min(0) @Max(100)
  confidence: number;

  @IsNumber() entryPrice:  number;
  @IsNumber() stopLoss:    number;
  @IsNumber() takeProfit:  number;

  detectedPatterns?: string[];
  indicators?:       Record<string, any>;
}
```

```typescript
// backend-code/src/signals/dto/generate-signal.dto.ts

import { IsString, IsOptional, IsObject } from 'class-validator';

export class GenerateSignalDto {
  @IsString()
  strategyId: string;

  @IsString()
  asset: string;

  @IsString()
  timeframe: string;

  /**
   * Optionnel — injecte directement un PatternDetectionResult
   * pour tester le mapping + persistance sans appel CoinGecko.
   */
  @IsOptional()
  @IsObject()
  mockResult?: Record<string, unknown>;
}
```

---

## 4) Service — SignalsService (Logique métier)

`SignalsService` contient l'intégralité de la logique métier du module Signals.
La méthode `generateSignal()` orchestre le flux complet : vérification de la stratégie,
appel au module de détection de patterns (lui-même appuyé sur CoinGecko + Python),
mappage du résultat vers une entité `Signal`, déduplication et persistance Prisma.

```typescript
// backend-code/src/signals/signals.service.ts (extraits)

@Injectable()
export class SignalsService {
  constructor(
    private prisma:           PrismaService,
    private emailService:     EmailService,
    private patternDetection: PatternDetectionService,
  ) {}

  async generateSignal(
    userId: string,
    dto:    GenerateSignalDto,
  ): Promise<GenerateSignalResult> {
    const { strategyId, asset, timeframe } = dto;

    // 1. Vérifie que la stratégie existe
    const strategy = await this.prisma.strategy.findUnique({
      where: { id: strategyId },
    });
    if (!strategy) throw new NotFoundException(`Strategy ${strategyId} not found`);

    // 2. Détection de pattern via CoinGecko + pattern_detector.py
    const detection = await this.patternDetection.detectPattern(
      strategyId, asset, timeframe,
    );

    // 3. NO_SIGNAL → pas de persistance
    if (detection.global_status === 'NO_SIGNAL') {
      return {
        status:           'no_signal',
        global_status:    'NO_SIGNAL',
        confidence_score: detection.confidence_score,
        message:          'No pattern detected — no signal created.',
      };
    }

    // 4. Mappage global_status → direction BUY / SELL
    const direction: 'BUY' | 'SELL' =
      detection.global_status === 'ENTRY_SIGNAL' ? 'BUY' : 'SELL';

    // ── ENTRY_SIGNAL → création d'un Signal OPEN ──────────────────────────────
    if (direction === 'BUY') {
      // Déduplication : un seul Signal OPEN par stratégie + asset
      const existingOpen = await this.prisma.signal.findFirst({
        where: { strategyId, asset, direction: 'BUY', status: 'OPEN' },
      });
      if (existingOpen) {
        return { status: 'already_open', signal: existingOpen, message: '...' };
      }

      // Dérive entry / SL / TP depuis risk_management de la stratégie
      const entryPrice = detection.current_price;
      const slPct      = this.parsePct(detection.risk_management?.stop_loss)   ?? 0.02;
      const tpPct      = this.parsePct(detection.risk_management?.take_profit) ?? 0.04;

      const signal = await this.prisma.signal.create({
        data: {
          userId:      strategy.userId,
          strategyId,
          asset,
          timeframe,
          direction:   'BUY',
          status:      'OPEN',
          confidence:  Math.round(detection.confidence_score * 10000) / 100,
          entry_price: entryPrice,
          stop_loss:   Math.round(entryPrice * (1 - slPct) * 100) / 100,
          take_profit: Math.round(entryPrice * (1 + tpPct) * 100) / 100,
          patterns:    JSON.stringify(['ENTRY_SIGNAL']),
          indicators:  JSON.stringify({
            strategy_name:    detection.strategy_name,
            evaluated_at:     detection.evaluated_at,
            candles_used:     detection.candles_used,
            indicators:       detection.indicators,
            entry_conditions: detection.entry_conditions,
            exit_conditions:  detection.exit_conditions,
          }),
        },
      });

      this.notifyAllUsers(signal).catch(() => {}); // fire-and-forget
      return { status: 'signal_created', direction: 'BUY', signal, detection_summary: ... };
    }

    // ── EXIT_SIGNAL → clôture du Signal BUY existant ──────────────────────────
    // Design : on ne crée pas un Signal SELL distinct — on met à jour le Signal
    // BUY (status → CLOSED, exit_price, closedAt). Justification : stratégie
    // long-only, 1 position à la fois, évite le double-comptage en statistiques.
    const openBuy = await this.prisma.signal.findFirst({
      where: { strategyId, asset, direction: 'BUY', status: 'OPEN' },
    });
    if (!openBuy) {
      return { status: 'no_open_position', message: `No open BUY for ${asset}` };
    }

    const closedSignal = await this.prisma.signal.update({
      where: { id: openBuy.id },
      data: {
        status:     'CLOSED',
        exit_price: detection.current_price,
        closedAt:   new Date(),
      },
    });

    return { status: 'signal_closed', direction: 'SELL', signal: closedSignal, ... };
  }

  // ── Consultation ──────────────────────────────────────────────────────────────

  async getUserSignals(userId: string) {
    return this.prisma.signal.findMany({
      where:   { userId },
      orderBy: { createdAt: 'desc' },
      take:    50,
    });
  }

  async getSignalsStatistics(userId: string) {
    const signals = await this.prisma.signal.findMany({ where: { userId } });

    const buySignals  = signals.filter(s => s.direction === 'BUY').length;
    const sellSignals = signals.filter(s => s.direction === 'SELL').length;
    const avgConfidence =
      signals.reduce((acc, s) => acc + s.confidence, 0) / signals.length || 0;

    return { totalSignals: signals.length, buySignals, sellSignals, averageConfidence: avgConfidence };
  }
}
```

Le scheduler `SignalSchedulerService` tourne en arrière-plan et déclenche `generateSignal()`
toutes les 15 minutes (configurable via `SIGNAL_SCAN_INTERVAL`) pour chaque stratégie active :

```typescript
// backend-code/src/signals/signal-scheduler.service.ts

onModuleInit() {
  const intervalMs = parseInt(
    this.config.get<string>('SIGNAL_SCAN_INTERVAL', '900000'), // default: 15 min
  );
  const interval = setInterval(() => this.runScan(), intervalMs);
  this.schedulerRegistry.addInterval('signal-scan', interval);
}

async runScan() {
  const strategies = await this.prisma.strategy.findMany({
    where: { status: 'active' },
  });
  for (const strategy of strategies) {
    await this.signalsService.generateSignal(strategy.userId, {
      strategyId: strategy.id,
      asset:      strategy.asset,
      timeframe:  strategy.timeframe,
    });
  }
}
```

---

## 5) Repository — Prisma ORM (accès base de données)

Alvio n'utilise pas de classe `Repository` dédiée : Prisma Client joue ce rôle directement.
`PrismaService` étend `PrismaClient` et est injecté dans chaque service via le système d'injection
de dépendances de NestJS. Toutes les requêtes SQL sont générées et exécutées par Prisma.

```typescript
// backend-code/src/database/prisma.service.ts (simplifié)

import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }
}
```

Les requêtes Prisma utilisées par le module Signals génèrent le SQL PostgreSQL suivant :

```typescript
// GET /signals  →  SELECT * FROM "Signal" WHERE "userId" = $1 ORDER BY "createdAt" DESC LIMIT 50
this.prisma.signal.findMany({
  where:   { userId },
  orderBy: { createdAt: 'desc' },
  take:    50,
});

// Déduplication  →  SELECT * FROM "Signal" WHERE "strategyId" = $1 AND asset = $2
//                   AND direction = 'BUY' AND status = 'OPEN' LIMIT 1
this.prisma.signal.findFirst({
  where: { strategyId, asset, direction: 'BUY', status: 'OPEN' },
});

// POST /signals  →  INSERT INTO "Signal" (...) VALUES (...) RETURNING *
this.prisma.signal.create({ data: { ... } });

// Clôture EXIT  →  UPDATE "Signal" SET status = 'CLOSED', exit_price = $1,
//                  "closedAt" = NOW() WHERE id = $2 RETURNING *
this.prisma.signal.update({
  where: { id: openBuy.id },
  data:  { status: 'CLOSED', exit_price: detection.current_price, closedAt: new Date() },
});
```

---

## 6) Modèle Prisma — Entité Signal

Le modèle `Signal` dans `backend-code/prisma/schema.prisma` définit la structure physique
de la table en base. Les champs `patterns` et `indicators` sont stockés en `TEXT`
(JSON sérialisé applicativement) pour éviter un modèle trop complexe tout en conservant
la flexibilité d'un objet arbitraire.

```prisma
// backend-code/prisma/schema.prisma

model Signal {
  id                String    @id @default(cuid())
  userId            String
  user              User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Relation logique vers Strategy — sans FK SQL (compatibilité ascendante)
  strategyId        String?

  asset             String
  timeframe         String?              // 1h | 4h | 1d — nullable (anciens enregistrements)
  direction         String               // BUY | SELL | HOLD
  status            String    @default("OPEN")   // OPEN | CLOSED

  entry_price       Float
  stop_loss         Float
  take_profit       Float
  exit_price        Float?               // renseigné à la clôture
  confidence        Float
  risk_reward_ratio Float?

  patterns          String?              // JSON array  ["ENTRY_SIGNAL", ...]
  indicators        String?              // JSON object { strategy_name, indicators, ... }

  closedAt          DateTime?            // renseigné quand status → CLOSED
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  @@index([userId])
  @@index([asset])
  @@index([strategyId])
  @@index([strategyId, asset, direction, status])  // déduplication O(1)
}
```

La relation entre `Signal` et `User` est définie avec `onDelete: Cascade` : la suppression
d'un utilisateur supprime en cascade tous ses signaux. La relation vers `Strategy` est
volontairement laissée sans FK SQL afin que les signaux survivent à la suppression d'une
stratégie et conservent leur valeur d'audit trail.

---

## 7) Flux complet — Diagramme de séquence

```
Frontend (Next.js)          NestJS Backend                    Externe
──────────────────          ─────────────────────────────     ────────────
GET /signals
 │ Authorization: Bearer {accessToken}
 │─────────────────────────────────────────────────────►│
 │                          JwtAuthGuard
 │                           │ ExtractJwt.fromAuthHeaderAsBearerToken()
 │                           │ JwtStrategy.validate(payload)
 │                           │ → request.user = { id, email, jti }
 │                          SignalsController.getSignals(req)
 │                           │ req.user.id → userId
 │                          SignalsService.getUserSignals(userId)
 │                           │ prisma.signal.findMany({ where: {userId}, take: 50 })
 │                           │──────────────────────────────────────► PostgreSQL
 │                           │                                        SELECT * FROM "Signal"
 │                           │                                        WHERE "userId" = $1
 │                           │                                        ORDER BY "createdAt" DESC
 │                           │                                        LIMIT 50
 │                           │◄──────────────────────────────────────
 │◄─────────────────────────────────────────────────────│
 │ 200 OK — Signal[]

POST /signals/generate
 │ Authorization: Bearer {accessToken}
 │ Body: { strategyId, asset, timeframe }
 │─────────────────────────────────────────────────────►│
 │                          JwtAuthGuard (même flux)
 │                          SignalsController.generateSignal(dto, req)
 │                          SignalsService.generateSignal(userId, dto)
 │                           │ prisma.strategy.findUnique(strategyId)
 │                           │ PatternDetectionService.detectPattern()
 │                           │  │ MarketsService.getOhlcv(coinId, days)
 │                           │  │  │ redis.get("markets:ohlcv:bitcoin:30")  → cache miss
 │                           │  │  │──────────────────────────────────►│ CoinGecko API
 │                           │  │  │                                   │ GET /coins/bitcoin/ohlc
 │                           │  │  │◄──────────────────────────────────│ number[][]
 │                           │  │  │ redis.set("markets:ohlcv:bitcoin:30", ..., 600s)
 │                           │  │ spawn("python pattern_detector.py", JSON.stringify(input))
 │                           │  │ → PatternDetectionResult { global_status, confidence_score, ... }
 │                           │ Si ENTRY_SIGNAL → prisma.signal.create(...)
 │                           │ Si EXIT_SIGNAL  → prisma.signal.update({ status: CLOSED })
 │                           │ emailService.sendSignalNotification() [fire-and-forget]
 │◄─────────────────────────────────────────────────────│
 │ 201 Created — { status, direction, signal, detection_summary }

POST /auth/refresh (intercepteur Axios sur 401)
 │ Cookie: refresh_token={httpOnly}
 │─────────────────────────────────────────────────────►│
 │                          AuthService.refreshToken()
 │                           │ jwt.verify(refreshToken, JWT_REFRESH_SECRET)
 │                           │ redis.get("refresh:{jti}") → userId
 │                           │ Si absent → token révoqué → 401
 │                           │ redis.del("refresh:{jti}")   // rotation
 │                           │ issueTokens() → nouveaux access + refresh
 │◄─────────────────────────────────────────────────────│
 │ 200 OK — { accessToken }   + Set-Cookie: refresh_token (httpOnly)
```

---

## 8) Exemples de réponses JSON

### GET /signals — Liste des signaux de l'utilisateur

```json
[
  {
    "id": "clx9a2b3c0000qwertyuiopas",
    "userId": "clx8z1y2x0000abcdefghijkl",
    "strategyId": "clx7w1v2u0000mnopqrstuvwx",
    "asset": "BTC/USDT",
    "timeframe": "4h",
    "direction": "BUY",
    "status": "OPEN",
    "entry_price": 67420.5,
    "stop_loss": 66072.09,
    "take_profit": 70117.32,
    "exit_price": null,
    "confidence": 78.5,
    "risk_reward_ratio": null,
    "patterns": "[\"ENTRY_SIGNAL\"]",
    "indicators": "{\"strategy_name\":\"RSI+EMA\",\"evaluated_at\":\"2026-06-24T08:32:11.000Z\",\"candles_used\":180,\"indicators\":{\"RSI\":28.4,\"EMA_20\":66800.0,\"EMA_50\":65200.0}}",
    "closedAt": null,
    "createdAt": "2026-06-24T08:32:15.123Z",
    "updatedAt": "2026-06-24T08:32:15.123Z"
  },
  {
    "id": "clx8b2c3d0001zxcvbnmasdfgh",
    "userId": "clx8z1y2x0000abcdefghijkl",
    "strategyId": "clx7w1v2u0000mnopqrstuvwx",
    "asset": "ETH/USDT",
    "timeframe": "1h",
    "direction": "BUY",
    "status": "CLOSED",
    "entry_price": 3521.0,
    "stop_loss": 3450.58,
    "take_profit": 3662.0,
    "exit_price": 3648.75,
    "confidence": 82.3,
    "risk_reward_ratio": null,
    "patterns": "[\"ENTRY_SIGNAL\"]",
    "indicators": "{\"strategy_name\":\"RSI+EMA\",\"evaluated_at\":\"2026-06-22T14:10:00.000Z\",\"candles_used\":84}",
    "closedAt": "2026-06-23T09:45:22.000Z",
    "createdAt": "2026-06-22T14:10:05.000Z",
    "updatedAt": "2026-06-23T09:45:22.000Z"
  }
]
```

### GET /signals/statistics — Statistiques agrégées

```json
{
  "totalSignals": 24,
  "buySignals": 24,
  "sellSignals": 0,
  "averageConfidence": 76.83
}
```

### POST /signals/generate — Génération via détection de pattern

**Requête :**
```json
{
  "strategyId": "clx7w1v2u0000mnopqrstuvwx",
  "asset": "BTC/USDT",
  "timeframe": "4h"
}
```

**Réponse — Signal créé (`status: signal_created`) :**
```json
{
  "status": "signal_created",
  "direction": "BUY",
  "signal": {
    "id": "clx9a2b3c0000qwertyuiopas",
    "userId": "clx8z1y2x0000abcdefghijkl",
    "strategyId": "clx7w1v2u0000mnopqrstuvwx",
    "asset": "BTC/USDT",
    "timeframe": "4h",
    "direction": "BUY",
    "status": "OPEN",
    "entry_price": 67420.5,
    "stop_loss": 66072.09,
    "take_profit": 70117.32,
    "exit_price": null,
    "confidence": 78.5,
    "createdAt": "2026-06-24T08:32:15.123Z",
    "updatedAt": "2026-06-24T08:32:15.123Z"
  },
  "detection_summary": {
    "global_status": "ENTRY_SIGNAL",
    "confidence_score": 0.785,
    "current_price": 67420.5,
    "candles_used": 180,
    "evaluated_at": "2026-06-24T08:32:11.000Z"
  }
}
```

**Réponse — Aucun pattern détecté (`status: no_signal`) :**
```json
{
  "status": "no_signal",
  "global_status": "NO_SIGNAL",
  "confidence_score": 0.31,
  "message": "No pattern detected — no signal created."
}
```

**Réponse — Signal déjà ouvert (`status: already_open`) :**
```json
{
  "status": "already_open",
  "signal": { "id": "clx9a2b3c0000qwertyuiopas", "direction": "BUY", "status": "OPEN", "..." : "..." },
  "message": "Signal BUY already OPEN for strategy clx7w1v2u0000mnopqrstuvwx on BTC/USDT (id: clx9a2b3c0000qwertyuiopas)"
}
```

### POST /signals — Création manuelle

**Requête :**
```json
{
  "asset": "SOL/USDT",
  "direction": "BUY",
  "confidence": 85.0,
  "entryPrice": 142.30,
  "stopLoss": 139.45,
  "takeProfit": 148.0,
  "detectedPatterns": ["RSI_OVERSOLD", "EMA_CROSS"],
  "indicators": { "RSI": 27.1, "EMA_20": 141.5 }
}
```

**Réponse :**
```json
{
  "id": "clxnewsignalid0000000000",
  "userId": "clx8z1y2x0000abcdefghijkl",
  "strategyId": null,
  "asset": "SOL/USDT",
  "direction": "BUY",
  "status": "OPEN",
  "entry_price": 142.3,
  "stop_loss": 139.45,
  "take_profit": 148.0,
  "exit_price": null,
  "confidence": 85.0,
  "patterns": "[\"RSI_OVERSOLD\",\"EMA_CROSS\"]",
  "indicators": "{\"RSI\":27.1,\"EMA_20\":141.5}",
  "closedAt": null,
  "createdAt": "2026-06-24T10:00:00.000Z",
  "updatedAt": "2026-06-24T10:00:00.000Z"
}
```
