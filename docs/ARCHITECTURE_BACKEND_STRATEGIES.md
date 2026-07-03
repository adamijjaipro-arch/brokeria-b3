# Architecture Backend — Alvio
## Flux complet : Frontend → Controller → Service → Repository → PostgreSQL

**Stack :** Next.js 14 (frontend) · NestJS 10 (backend) · Prisma ORM · PostgreSQL · Redis · JWT (Bearer) · Anthropic Claude API  
**Module illustré :** `Strategies` — import de document (PDF/TXT/MD), analyse IA via Claude `claude-sonnet-4-6`, consultation et re-analyse de stratégies de trading

---

## 1) Côté Frontend — Client HTTP Axios avec JWT

Le frontend Next.js communique exclusivement avec le backend NestJS via un client Axios centralisé
défini dans `frontend-web/api/index.ts`. Ce client injecte automatiquement le Bearer token
depuis le store Zustand en mémoire, désenveloppe les réponses `{ data: ... }`, et relance
les requêtes en échec sur 401 après avoir obtenu un nouveau token d'accès via le cookie httpOnly.

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
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Response interceptor : déroule l'envelope { data: ... } ─────────────────
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

Le module Strategies n'utilise pas d'objet `strategiesApi` centralisé — les pages appellent
directement l'instance `api` partagée. L'import de document envoie une requête
`multipart/form-data` pour transmettre le fichier binaire avec ses métadonnées :

```typescript
// frontend-web/pages/strategies/import.tsx — handleSubmit()

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!file || !name.trim()) return;

  const fd = new FormData();
  fd.append('file', file);
  fd.append('name', name.trim());
  fd.append('timeframe', timeframe);
  if (description.trim()) fd.append('description', description.trim());
  if (asset.trim())       fd.append('asset', asset.trim());

  try {
    const { data } = await api.post<ImportResult>(
      '/strategies/import',
      fd,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    setResult(data);
  } catch (err: unknown) {
    const msg = (err as { response?: { data?: { message?: string | string[] } } })
      ?.response?.data?.message;
    setError(Array.isArray(msg) ? msg.join(', ') : msg ?? 'Une erreur inattendue est survenue.');
  }
};
```

La page de consultation `/strategies` appelle `GET /strategies` pour récupérer toutes les
stratégies de l'utilisateur, et `POST /strategies/:id/analyze` pour déclencher une re-analyse
IA sur une stratégie existante :

```typescript
// frontend-web/pages/strategies/index.tsx — appels API inline

// Chargement initial — GET /strategies
const res = await api.get<Strategy[]>('/strategies');
setStrategies(res.data);

// Re-analyse IA — POST /strategies/:id/analyze
const { data } = await api.post<AnalyzeResult>(`/strategies/${id}/analyze`);
```

Les types TypeScript utilisés côté client sont définis localement dans les pages :

```typescript
// frontend-web/pages/strategies/index.tsx — types locaux

interface Strategy {
  id:            string;
  name:          string;
  description:   string | null;
  asset:         string;
  timeframe:     string;
  status:        string;           // 'inactive' | 'active'
  win_rate:      number | null;
  total_trades:  number | null;
  profit_factor: number | null;
  createdAt:     string;
  code:          string;           // JSON StrategyRules sérialisé après analyse IA
}

interface StrategyIndicator {
  name:   string;
  params: string;
}

interface RiskManagement {
  stop_loss:     string;
  take_profit:   string;
  position_size: string;
  risk_reward:   string;
}

interface StrategyRules {
  name:              string;
  description:       string;
  entry_conditions:  string[];
  exit_conditions:   string[];
  indicators:        StrategyIndicator[];
  timeframe:         string;
  asset_type:        string;
  risk_management:   RiskManagement;
  sessions:          string[];
  confidence_score:  number;
}

interface ImportResult {
  message:  string;
  strategy: { id: string; name: string; timeframe: string; asset: string };
  rules:    StrategyRules;
}

interface AnalyzeResult {
  rules:      StrategyRules;
  strategyId: string;
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

`JwtGuard` est simplement un alias de rétro-compatibilité vers `JwtAuthGuard`,
utilisé par les controllers déjà en production :

```typescript
// backend-code/src/auth/jwt.guard.ts
export { JwtAuthGuard as JwtGuard } from './guards/jwt-auth.guard';
```

La stratégie Passport sous-jacente décode le token et retourne les trois champs
injectés dans `request.user` : l'identifiant utilisateur (`sub`), l'email
et le `jti` (JWT ID) utilisé pour la révocation ciblée dans Redis :

```typescript
// backend-code/src/auth/strategies/jwt.strategy.ts

export interface JwtPayload {
  sub:   string;   // userId (cuid)
  email: string;
  jti:   string;   // JWT ID unique — révocation via Redis
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

Le token d'accès est signé avec un TTL de 15 minutes. Le refresh token (TTL 7 jours) est
transmis via un cookie httpOnly et référencé dans Redis sous la clé `refresh:{jti}` pour
permettre la révocation immédiate en cas de déconnexion ou de compromission :

```typescript
// backend-code/src/auth/auth.service.ts — méthode privée issueTokens()

const jti = crypto.randomUUID();

const accessToken = this.jwtService.sign(
  { sub: userId, email: userEmail, jti },
  { secret: this.config.get<string>('JWT_SECRET'), expiresIn: '900s' },   // 15 min
);

const refreshToken = this.jwtService.sign(
  { sub: userId, email: userEmail, jti },
  { secret: this.config.get<string>('JWT_REFRESH_SECRET'), expiresIn: '604800s' }, // 7 jours
);

// Référence Redis pour révocation immédiate
await this.redis.set(`refresh:${jti}`, userId, 604800);

// Cookie httpOnly — inaccessible depuis JavaScript, protégé contre XSS
res.cookie('refresh_token', refreshToken, {
  httpOnly: true,
  sameSite: 'lax',
  secure:   isProd,
  maxAge:   604800 * 1000,
  path:     '/',
});
```

---

## 3) Controller — StrategiesController

Le `StrategiesController` est le point d'entrée HTTP du module Strategies. Annoté
`@UseGuards(JwtGuard)` au niveau de la classe, il protège l'ensemble de ses routes sans
répétition décorateur par décorateur. Il ne contient aucune logique métier propre : sa
responsabilité se limite à recevoir les requêtes HTTP, extraire l'identité de l'utilisateur
depuis `req.user.id` et déléguer au `StrategiesService`.

La route `POST /strategies/import` est la plus complexe : elle accepte un upload
`multipart/form-data` via `FileInterceptor` (Multer en mode mémoire), valide le fichier
reçu avec `ParseFilePipe` (taille max 10 Mo, MIME type PDF/TXT/Markdown), et extrait
les métadonnées depuis le corps de la requête via `ImportStrategyDto`.

```typescript
// backend-code/src/strategies/strategies.controller.ts

import {
  Controller, Get, Post, Param, Body, UseGuards, Request,
  UseInterceptors, UploadedFile, ParseFilePipe,
  MaxFileSizeValidator, FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtGuard }             from '../auth/jwt.guard';
import { StrategiesService }    from './strategies.service';
import { ImportStrategyDto }    from './dto/import-strategy.dto';

const TEN_MB = 10 * 1024 * 1024;

type AuthRequest = Request & { user: { id: string } };

@Controller('strategies')
@UseGuards(JwtGuard)
export class StrategiesController {
  constructor(private readonly strategiesService: StrategiesService) {}

  @Get()
  async findAll(@Request() req: AuthRequest) {
    return this.strategiesService.findAllByUser(req.user.id);
  }

  @Post(':id/analyze')
  async analyze(
    @Param('id') id: string,
    @Request() req:  AuthRequest,
  ) {
    return this.strategiesService.analyzeById(id, req.user.id);
  }

  @Post('import')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),       // Fichier conservé en Buffer, jamais écrit sur disque
      limits:  { fileSize: TEN_MB },
    }),
  )
  async importStrategy(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: TEN_MB }),
          new FileTypeValidator({
            fileType: /(pdf|plain|markdown|x-markdown)/,
            skipMagicNumbersValidation: true,
          }),
        ],
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
    @Body() dto:    ImportStrategyDto,
    @Request() req: AuthRequest,
  ) {
    return this.strategiesService.importFromDocument(file, dto, req.user.id);
  }
}
```

Le DTO `ImportStrategyDto` définit et valide les métadonnées accompagnant le document.
Le champ `timeframe` utilise un enum TypeScript validé par `class-validator` pour
restreindre les valeurs acceptées à la liste des intervalles de temps supportés :

```typescript
// backend-code/src/strategies/dto/import-strategy.dto.ts

import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export enum Timeframe {
  ONE_M     = '1m',
  FIVE_M    = '5m',
  FIFTEEN_M = '15m',
  ONE_H     = '1h',
  FOUR_H    = '4h',
  ONE_D     = '1D',
}

export class ImportStrategyDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(Timeframe, { message: 'timeframe doit être : 1m, 5m, 15m, 1h, 4h ou 1D' })
  timeframe: Timeframe;

  @IsOptional()
  @IsString()
  asset?: string;
}
```

---

## 4) Service — StrategiesService (Logique métier)

`StrategiesService` orchestre les trois opérations du module : la consultation des stratégies
de l'utilisateur, l'analyse IA d'une stratégie existante et l'import complet depuis un document.
La logique d'intelligence artificielle est déléguée à `AIService`, qui appelle l'API Anthropic
Claude en mode synchrone et retourne un objet `StrategyRules` fortement typé.

La méthode `importFromDocument()` suit un pipeline en quatre étapes : extraction du texte
brut depuis le buffer Multer (avec support natif du format PDF via `pdf-parse`), troncature
défensive à 15 000 caractères pour maîtriser le coût de l'appel API Claude, appel à
`AIService.analyzeStrategyDocument()`, puis persistance en base via Prisma.

```typescript
// backend-code/src/strategies/strategies.service.ts

import {
  Injectable, BadRequestException, NotFoundException, InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService }   from '../database/prisma.service';
import { AIService }       from '../ai/ai.service';
import { ImportStrategyDto } from './dto/import-strategy.dto';

const MAX_TEXT_LENGTH = 15_000; // Tronque le texte pour maîtriser le coût Claude

@Injectable()
export class StrategiesService {
  constructor(
    private readonly prisma:     PrismaService,
    private readonly aiService:  AIService,
  ) {}

  async findAllByUser(userId: string) {
    return this.prisma.strategy.findMany({
      where:   { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async analyzeById(id: string, userId: string) {
    const strategy = await this.prisma.strategy.findUnique({ where: { id } });

    if (!strategy || strategy.userId !== userId) {
      throw new NotFoundException('Stratégie introuvable');
    }

    // Appel Claude — le contenu de strategy.code est passé tel quel
    // (soit le texte brut initial, soit le JSON si déjà analysé)
    const rules = await this.aiService.analyzeStrategyDocument(strategy.code);

    await this.prisma.strategy.update({
      where: { id },
      data:  { code: JSON.stringify(rules) },
    });

    return { rules, strategyId: id };
  }

  async importFromDocument(
    file: Express.Multer.File,
    dto:  ImportStrategyDto,
    userId: string,
  ) {
    // 1. Extraction du texte brut
    const rawText = await this.extractText(file);

    if (rawText.trim().length < 50) {
      throw new BadRequestException(
        'Le document est trop court ou illisible (minimum 50 caractères de texte exploitable).',
      );
    }

    // 2. Troncature défensive (15 000 chars ≈ ~5-6 pages PDF)
    const text = rawText.length > MAX_TEXT_LENGTH
      ? rawText.slice(0, MAX_TEXT_LENGTH)
      : rawText;

    // 3. Analyse IA Claude — retourne un StrategyRules validé
    const rules = await this.aiService.analyzeStrategyDocument(text);

    // 4. Persistance en base
    const strategy = await this.prisma.strategy.create({
      data: {
        userId,
        name:        dto.name,
        description: dto.description ?? null,
        asset:       dto.asset?.trim() || 'BTC/USDT',
        timeframe:   dto.timeframe,
        code:        JSON.stringify(rules),  // StrategyRules → TEXT sérialisé
        status:      'inactive',
      },
    });

    return { message: 'Stratégie importée avec succès.', strategy, rules };
  }

  private async extractText(file: Express.Multer.File): Promise<string> {
    if (file.mimetype === 'application/pdf') {
      const { PDFParse } = require('pdf-parse') as {
        PDFParse: new (opts: { data: Buffer }) => { getText(): Promise<string> };
      };
      const parser = new PDFParse({ data: file.buffer });
      return parser.getText();
    }
    // TXT ou Markdown → décodage UTF-8 direct depuis le buffer mémoire
    return file.buffer.toString('utf-8');
  }
}
```

`AIService.analyzeStrategyDocument()` encapsule l'intégralité de l'intégration Claude.
Il construit le prompt système, appelle `client.messages.create()`, nettoie la réponse
brute (retire les balises Markdown éventuelles), la parse en JSON, puis la valide
structurellement avec une fonction de type guard avant de retourner un `StrategyRules`
normalisé :

```typescript
// backend-code/src/ai/ai.service.ts

const CLAUDE_MODEL = 'claude-sonnet-4-6';

const SYSTEM_PROMPT = `Tu es un expert en trading algorithmique et en analyse de stratégies
financières. Analyse le document fourni et extrais TOUTES les règles de trading.
Réponds UNIQUEMENT avec un objet JSON valide, sans markdown, sans texte avant ou après.
Structure JSON obligatoire :
{
  "name": string,
  "description": string,
  "entry_conditions": string[],
  "exit_conditions": string[],
  "indicators": [{ "name": string, "params": string }],
  "timeframe": string,
  "asset_type": string,
  "risk_management": { "stop_loss": string, "take_profit": string,
                       "position_size": string, "risk_reward": string },
  "sessions": string[],
  "confidence_score": number
}`;

async analyzeStrategyDocument(text: string): Promise<StrategyRules> {
  const apiKey = this.config.get<string>('ANTHROPIC_API_KEY');
  if (!apiKey) throw new InternalServerErrorException('Clé API Anthropic non configurée.');

  const client = new Anthropic({ apiKey });

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

  // Nettoyage des blocs ```json ... ``` éventuels
  const cleaned = cleanJsonResponse(block.text);
  const parsed  = JSON.parse(cleaned);

  if (!validateStrategyRules(parsed)) {
    throw new InternalServerErrorException(
      'Le JSON retourné par Claude ne correspond pas à la structure StrategyRules attendue.',
    );
  }

  return {
    ...parsed,
    entry_conditions: parsed.entry_conditions.map(String),
    exit_conditions:  parsed.exit_conditions.map(String),
    sessions:         parsed.sessions.map(String),
    confidence_score: Math.min(100, Math.max(0, Number(parsed.confidence_score))),
  };
}
```

L'interface `StrategyRules` définit le contrat exact entre Claude et la base de données :

```typescript
// backend-code/src/ai/interfaces/strategy-rules.interface.ts

export interface StrategyIndicator {
  name:   string;
  params: string;
}

export interface RiskManagement {
  stop_loss:     string;
  take_profit:   string;
  position_size: string;
  risk_reward:   string;
}

export interface StrategyRules {
  name:             string;
  description:      string;
  entry_conditions: string[];
  exit_conditions:  string[];
  indicators:       StrategyIndicator[];
  timeframe:        string;
  asset_type:       string;
  risk_management:  RiskManagement;
  sessions:         string[];
  confidence_score: number;
}
```

---

## 5) Repository — Prisma ORM (accès base de données)

Alvio n'utilise pas de classe `Repository` dédiée : Prisma Client joue ce rôle directement.
`PrismaService` encapsule `PrismaClient` et expose chaque modèle comme un accesseur de
propriété, ce qui permet à NestJS de l'injecter dans chaque service via son système
d'injection de dépendances standard.

```typescript
// backend-code/src/database/prisma.service.ts

import { Injectable } from '@nestjs/common';

@Injectable()
export class PrismaService {
  private prisma: any;

  constructor() {
    const { PrismaClient } = require('@prisma/client');
    this.prisma = new PrismaClient();
  }

  async onModuleInit()    { await this.prisma.$connect();    }
  async onModuleDestroy() { await this.prisma.$disconnect(); }

  get strategy()          { return this.prisma.strategy;          }
  get user()              { return this.prisma.user;              }
  get signal()            { return this.prisma.signal;            }
  get report()            { return this.prisma.report;            }
  get webAuthnCredential(){ return this.prisma.webAuthnCredential;}
  get portfolioSnapshot() { return this.prisma.portfolioSnapshot; }
  get simulationResult()  { return this.prisma.simulationResult;  }
  get course()            { return this.prisma.course;            }
  get lesson()            { return this.prisma.lesson;            }
  get userProgress()      { return this.prisma.userProgress;      }
  get authLog()           { return this.prisma.authLog;           }
}
```

Les requêtes Prisma utilisées par le module Strategies et leur équivalent SQL généré :

```typescript
// GET /strategies  →  SELECT * FROM "Strategy" WHERE "userId" = $1 ORDER BY "createdAt" DESC
this.prisma.strategy.findMany({
  where:   { userId },
  orderBy: { createdAt: 'desc' },
});

// POST /strategies/:id/analyze — vérification ownership
// →  SELECT * FROM "Strategy" WHERE id = $1 LIMIT 1
this.prisma.strategy.findUnique({ where: { id } });

// POST /strategies/:id/analyze — écriture des règles IA
// →  UPDATE "Strategy" SET code = $1, "updatedAt" = NOW() WHERE id = $2
this.prisma.strategy.update({
  where: { id },
  data:  { code: JSON.stringify(rules) },
});

// POST /strategies/import — création
// →  INSERT INTO "Strategy" (id, "userId", name, description, asset, timeframe, code, status,
//                             "createdAt", "updatedAt")
//    VALUES ($1, $2, $3, $4, $5, $6, $7, 'inactive', NOW(), NOW()) RETURNING *
this.prisma.strategy.create({
  data: {
    userId,
    name, description, asset, timeframe,
    code:   JSON.stringify(rules),
    status: 'inactive',
  },
});
```

---

## 6) Modèle Prisma — Entité Strategy

Le modèle `Strategy` dans `backend-code/prisma/schema.prisma` représente une stratégie
de trading appartenant à un utilisateur. Le champ `code` est le plus important : il stocke
en `TEXT` soit le contenu brut du document importé (avant analyse), soit le JSON
`StrategyRules` sérialisé (après analyse IA). La relation vers `User` est déclarée avec
`onDelete: Cascade` afin que la suppression d'un compte utilisateur entraîne la suppression
en cascade de toutes ses stratégies.

```prisma
// backend-code/prisma/schema.prisma

model Strategy {
  id            String   @id @default(cuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  name          String
  description   String?

  // Avant analyse IA : texte brut du document importé (PDF/TXT/MD)
  // Après  analyse IA : JSON StrategyRules sérialisé
  code          String

  asset         String
  timeframe     String             // 1m | 5m | 15m | 1h | 4h | 1D

  status        String   @default("inactive")   // 'inactive' | 'active'

  // Métriques de performance (calculées après backtesting — nullable au départ)
  win_rate      Float?
  total_trades  Int?
  profit_factor Float?

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([userId])
}
```

La relation `Signal.strategyId → Strategy.id` est une référence logique sans contrainte FK SQL :
les signaux générés par une stratégie survivent à la suppression de celle-ci pour préserver
la traçabilité de l'historique de trading. Cela permet de supprimer une stratégie sans perdre
l'audit trail des décisions prises en son nom.

---

## 7) Flux complet — Diagramme de séquence

```
Frontend (Next.js)          NestJS Backend                    Externe
──────────────────          ─────────────────────────────     ────────────────────────

GET /strategies
 │ Authorization: Bearer {accessToken}
 │──────────────────────────────────────────────────────►│
 │                          JwtAuthGuard
 │                           │ ExtractJwt.fromAuthHeaderAsBearerToken()
 │                           │ JwtStrategy.validate(payload)
 │                           │ → request.user = { id, email, jti }
 │                          StrategiesController.findAll(req)
 │                           │ req.user.id → userId
 │                          StrategiesService.findAllByUser(userId)
 │                           │ prisma.strategy.findMany({ where: {userId},
 │                           │   orderBy: { createdAt: 'desc' } })
 │                           │────────────────────────────────────────► PostgreSQL
 │                           │                                          SELECT * FROM "Strategy"
 │                           │                                          WHERE "userId" = $1
 │                           │                                          ORDER BY "createdAt" DESC
 │                           │◄───────────────────────────────────────
 │◄──────────────────────────────────────────────────────│
 │ 200 OK — Strategy[]


POST /strategies/import   (multipart/form-data)
 │ Authorization: Bearer {accessToken}
 │ Content-Type: multipart/form-data
 │ Body: file=<Buffer PDF>, name="RSI+EMA", timeframe="4h", asset="BTC/USDT"
 │──────────────────────────────────────────────────────►│
 │                          JwtAuthGuard (même flux)
 │                          FileInterceptor (Multer mémoire — pas d'écriture disque)
 │                           │ ParseFilePipe → MaxFileSizeValidator (10 Mo)
 │                           │              → FileTypeValidator (pdf|plain|markdown)
 │                          StrategiesController.importStrategy(file, dto, req)
 │                          StrategiesService.importFromDocument(file, dto, userId)
 │                           │
 │                           │ extractText(file)
 │                           │  └─ mimetype === 'application/pdf'
 │                           │       → PDFParse({ data: file.buffer }).getText()
 │                           │     sinon → file.buffer.toString('utf-8')
 │                           │
 │                           │ rawText.length > 15000 → slice(0, 15000)
 │                           │
 │                           │ AIService.analyzeStrategyDocument(text)
 │                           │  │ new Anthropic({ apiKey })
 │                           │  │ client.messages.create({              ──────────────►│ Claude API
 │                           │  │   model: 'claude-sonnet-4-6',                        │ (Anthropic)
 │                           │  │   max_tokens: 4096,                                  │
 │                           │  │   system: SYSTEM_PROMPT,                             │
 │                           │  │   messages: [{ role: 'user', content: text }]        │
 │                           │  │ })                                                   │
 │                           │  │◄─────────────────────────────────────────────────── │
 │                           │  │ response.content[0].text → JSON brut Claude
 │                           │  │ cleanJsonResponse() → retire les blocs ```json
 │                           │  │ JSON.parse() → parsed
 │                           │  │ validateStrategyRules(parsed) → StrategyRules
 │                           │
 │                           │ prisma.strategy.create({                ──────────────► PostgreSQL
 │                           │   data: { userId, name, asset,                          INSERT INTO
 │                           │     timeframe, code: JSON.stringify(rules),             "Strategy"...
 │                           │     status: 'inactive' }                                RETURNING *
 │                           │ })                                      ◄──────────────
 │◄──────────────────────────────────────────────────────│
 │ 201 Created
 │ { message, strategy: { id, name, ... }, rules: StrategyRules }


POST /strategies/:id/analyze
 │ Authorization: Bearer {accessToken}
 │ Body: (vide)
 │──────────────────────────────────────────────────────►│
 │                          JwtAuthGuard
 │                          StrategiesController.analyze(id, req)
 │                          StrategiesService.analyzeById(id, userId)
 │                           │ prisma.strategy.findUnique({ where: { id } })
 │                           │   → vérification ownership (strategy.userId === userId)
 │                           │
 │                           │ AIService.analyzeStrategyDocument(strategy.code)
 │                           │  └─ même flux Claude que ci-dessus ──────────────────►│ Claude API
 │                           │◄──────────────────────────────────────────────────────│
 │                           │
 │                           │ prisma.strategy.update({               ──────────────► PostgreSQL
 │                           │   where: { id },                                       UPDATE "Strategy"
 │                           │   data:  { code: JSON.stringify(rules) }               SET code = $1
 │                           │ })                                     ◄──────────────
 │◄──────────────────────────────────────────────────────│
 │ 200 OK — { rules: StrategyRules, strategyId }
```

---

## 8) Exemples de réponses JSON

### GET /strategies — Liste des stratégies de l'utilisateur

```json
[
  {
    "id": "clx7w1v2u0000mnopqrstuvwx",
    "userId": "clx8z1y2x0000abcdefghijkl",
    "name": "RSI + EMA Trend Following",
    "description": "Stratégie mean-reversion sur BTC/USDT en 4h",
    "asset": "BTC/USDT",
    "timeframe": "4h",
    "status": "active",
    "win_rate": null,
    "total_trades": null,
    "profit_factor": null,
    "code": "{\"name\":\"RSI + EMA Trend Following\",\"entry_conditions\":[\"RSI(14) < 30\",\"Prix au-dessus de EMA(50)\"],\"exit_conditions\":[\"RSI(14) > 70\",\"Prix croise EMA(20) à la baisse\"],\"indicators\":[{\"name\":\"RSI\",\"params\":\"14\"},{\"name\":\"EMA\",\"params\":\"20, 50\"}],\"timeframe\":\"4h\",\"asset_type\":\"crypto\",\"risk_management\":{\"stop_loss\":\"2% sous le point d'entrée\",\"take_profit\":\"4% au-dessus du point d'entrée\",\"position_size\":\"2% du capital\",\"risk_reward\":\"1:2\"},\"sessions\":[\"London\",\"New York\"],\"confidence_score\":85}",
    "createdAt": "2026-06-20T10:15:00.000Z",
    "updatedAt": "2026-06-24T09:30:00.000Z"
  },
  {
    "id": "clx6t1s2r0000ijklmnopqrst",
    "userId": "clx8z1y2x0000abcdefghijkl",
    "name": "MACD Breakout",
    "description": null,
    "asset": "ETH/USDT",
    "timeframe": "1h",
    "status": "inactive",
    "win_rate": null,
    "total_trades": null,
    "profit_factor": null,
    "code": "MACD Breakout Strategy\n\nEntry: MACD crosses above signal line...",
    "createdAt": "2026-06-18T14:22:00.000Z",
    "updatedAt": "2026-06-18T14:22:00.000Z"
  }
]
```

### POST /strategies/import — Import et analyse IA d'un document

**Requête (multipart/form-data) :**
```
file:        <Buffer — fichier RSI_strategy.pdf, 45 Ko>
name:        "RSI + EMA Trend Following"
timeframe:   "4h"
asset:       "BTC/USDT"
description: "Stratégie mean-reversion sur BTC en timeframe 4h"
```

**Réponse (201 Created) :**
```json
{
  "message": "Stratégie importée avec succès.",
  "strategy": {
    "id": "clx7w1v2u0000mnopqrstuvwx",
    "userId": "clx8z1y2x0000abcdefghijkl",
    "name": "RSI + EMA Trend Following",
    "description": "Stratégie mean-reversion sur BTC en timeframe 4h",
    "asset": "BTC/USDT",
    "timeframe": "4h",
    "status": "inactive",
    "win_rate": null,
    "total_trades": null,
    "profit_factor": null,
    "code": "{\"name\":\"RSI + EMA...\"}",
    "createdAt": "2026-06-24T09:30:00.000Z",
    "updatedAt": "2026-06-24T09:30:00.000Z"
  },
  "rules": {
    "name": "RSI + EMA Trend Following",
    "description": "Stratégie de retour à la moyenne basée sur RSI survendu et tendance EMA",
    "entry_conditions": [
      "RSI(14) passe sous 30 (zone de survente)",
      "Le prix est au-dessus de la EMA(50) sur le timeframe 4h",
      "Volume au-dessus de la moyenne mobile sur 20 périodes"
    ],
    "exit_conditions": [
      "RSI(14) dépasse 70 (zone de surachat)",
      "Le prix croise la EMA(20) à la baisse",
      "Stop-loss atteint : 2% sous le point d'entrée"
    ],
    "indicators": [
      { "name": "RSI",  "params": "14" },
      { "name": "EMA",  "params": "20" },
      { "name": "EMA",  "params": "50" },
      { "name": "Volume MA", "params": "20" }
    ],
    "timeframe": "4h",
    "asset_type": "crypto",
    "risk_management": {
      "stop_loss":     "2% sous le point d'entrée",
      "take_profit":   "4% au-dessus du point d'entrée",
      "position_size": "2% du capital total par trade",
      "risk_reward":   "1:2"
    },
    "sessions": ["London", "New York"],
    "confidence_score": 85
  }
}
```

### POST /strategies/:id/analyze — Re-analyse IA d'une stratégie existante

**Requête :** `POST /strategies/clx7w1v2u0000mnopqrstuvwx/analyze` (body vide)

**Réponse (200 OK) :**
```json
{
  "rules": {
    "name": "RSI + EMA Trend Following",
    "description": "Stratégie de retour à la moyenne...",
    "entry_conditions": ["RSI(14) < 30", "Prix > EMA(50)"],
    "exit_conditions":  ["RSI(14) > 70", "Prix croise EMA(20) à la baisse"],
    "indicators": [
      { "name": "RSI", "params": "14" },
      { "name": "EMA", "params": "20, 50" }
    ],
    "timeframe": "4h",
    "asset_type": "crypto",
    "risk_management": {
      "stop_loss":     "2% sous le point d'entrée",
      "take_profit":   "4% au-dessus",
      "position_size": "2% du capital",
      "risk_reward":   "1:2"
    },
    "sessions": ["London", "New York"],
    "confidence_score": 85
  },
  "strategyId": "clx7w1v2u0000mnopqrstuvwx"
}
```

### Cas d'erreur — Validation DTO (400 Bad Request)

```json
{
  "statusCode": 400,
  "message": ["timeframe doit être : 1m, 5m, 15m, 1h, 4h ou 1D"],
  "error": "Bad Request"
}
```

### Cas d'erreur — Document trop court (400 Bad Request)

```json
{
  "statusCode": 400,
  "message": "Le document est trop court ou illisible (minimum 50 caractères de texte exploitable).",
  "error": "Bad Request"
}
```

### Cas d'erreur — Stratégie non trouvée ou non autorisée (404 Not Found)

```json
{
  "statusCode": 404,
  "message": "Stratégie introuvable",
  "error": "Not Found"
}
```

### Cas d'erreur — Fichier trop lourd ou mauvais MIME type (400 Bad Request)

```json
{
  "statusCode": 400,
  "message": "File size exceeds the maximum allowed size of 10485760 bytes",
  "error": "Bad Request"
}
```
