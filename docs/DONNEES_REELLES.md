# DONNÉES RÉELLES DU PROJET ALVIO
> Source de vérité issue du scan du code — 2026-06-20
> En cas de conflit : le code fait foi sur ALVIO_DOSSIER_JURY.pdf (daté juin 2026)

---

## 1. IDENTITÉ DU PROJET

| Champ | Valeur réelle (code) |
|---|---|
| Nom backend (package.json) | `broker-ia-backend` |
| Nom frontend (package.json) | `alvio-frontend` |
| Nom mobile (package.json) | `broker-ia-mobile` |
| Nom affiché | **Alvio** |
| Modèle Claude utilisé | `claude-sonnet-4-6` (hardcodé dans ai.service.ts ligne 14) |
| Port backend | 3001 |
| Port frontend | 3000 |
| Année dossier jury | Juin 2026 |

---

## 2. DÉPENDANCES RÉELLES (versions exactes)

### 2.1 Backend — `backend-code/package.json`

| Package | Version | Rôle |
|---|---|---|
| `@nestjs/common` | ^10.0.0 | Framework NestJS |
| `@nestjs/jwt` | ^10.1.3 | JWT access + refresh tokens |
| `@nestjs/passport` | ^10.0.3 | Strategies d'auth (JWT, GitHub) |
| `@nestjs/schedule` | ^6.1.3 | Cron jobs (signal scheduler) |
| `@prisma/client` | ^5.0.0 | ORM client typé |
| `@anthropic-ai/sdk` | **^0.100.1** | Appel Claude API |
| `@simplewebauthn/server` | ^10.0.1 | WebAuthn FIDO2 |
| `bcrypt` | ^5.1.0 | Hash passwords et PIN (12 rounds) |
| `ioredis` | ^5.10.1 | Client Redis |
| `nodemailer` | ^8.0.2 | Envoi emails SMTP |
| `otplib` | ^12.0.1 | TOTP RFC 6238 |
| `qrcode` | ^1.5.4 | QR code TOTP |
| `passport-github2` | ^0.1.12 | GitHub OAuth |
| `passport-jwt` | ^4.0.1 | JWT strategy |
| `pdf-parse` | **^2.4.5** | Parsing PDF (v2 — API classe PDFParse) |
| `prom-client` | ^15.1.3 | Métriques Prometheus |
| `cookie-parser` | ^1.4.7 | Parsing cookies httpOnly |
| `class-validator` | ^0.14.0 | Validation DTOs |
| TypeScript (dev) | ^5.1.3 | |
| Jest (dev) | ^29.5.0 | Tests unitaires |

### 2.2 Frontend — `frontend-web/package.json`

| Package | Version | Rôle |
|---|---|---|
| `next` | **13.4.0** | Framework SSR/CSR |
| `react` | 18.2.0 | UI |
| `tailwindcss` | ^3.3.0 | Styling |
| `zustand` | ^4.5.7 | State management |
| `axios` | ^1.4.0 | HTTP client + interceptors JWT |
| `lightweight-charts` | ^4.2.3 | Graphiques chandeliers (TradingView) |
| `framer-motion` | ^12.34.1 | Animations |
| `@simplewebauthn/browser` | ^10.0.0 | WebAuthn côté navigateur |
| `next-themes` | ^0.4.6 | Dark/light mode |
| Vitest (dev) | ^4.1.0 | Tests composants |
| @testing-library/react (dev) | ^16.3.2 | RTL |

### 2.3 Mobile — `mobile/package.json`

| Package | Version | Rôle |
|---|---|---|
| `react-native` | 0.72.3 | Framework mobile |
| `expo` | 49.0.0 | Toolchain |
| `@react-navigation/native` | ^6.1.6 | Navigation |
| `@react-navigation/bottom-tabs` | ^6.5.8 | Tabs inférieures |
| `@react-navigation/stack` | ^6.3.16 | Navigation par pile |
| `axios` | ^1.4.0 | HTTP client |
| `@react-native-async-storage/async-storage` | ^1.17.12 | Persistance locale |
| `ionicons` | ^7.2.1 | Icônes |

### 2.4 Python AI — `ai-module/requirements.txt`

| Package | Version |
|---|---|
| pandas | 2.0.3 |
| numpy | 1.24.3 |
| scikit-learn | 1.3.0 |
| scipy | 1.11.0 |
| matplotlib | 3.7.1 |
| ta-lib | 0.4.27 |
| requests | 2.31.0 |
| python-dotenv | 1.0.0 |

---

## 3. MODÈLES PRISMA RÉELS (schema.prisma — intégralité)

Provider : **PostgreSQL** (prod) / SQLite possible en dev (fichier dev.db présent)
ORM : Prisma v5.22.0 (version client générée)

### 3.1 User
```
id                  String   @id @default(cuid())
username            String   @unique
email               String   @unique
passwordHash        String?                    ← nullable (GitHub/MagicLink)
githubId            String?  @unique           ← nullable
pin                 String?                    ← 3ème facteur, hashé bcrypt
totpSecret          String?                    ← chiffré AES-256-GCM
totpEnabled         Boolean  @default(false)
trading_preference  String?  @default("moderate")
email_notifications Boolean  @default(true)
createdAt           DateTime @default(now())
updatedAt           DateTime @updatedAt
```
Relations : → Signal[], Strategy[], Report[], WebAuthnCredential[],
             UserProgress[], PortfolioSnapshot[], SimulationResult[]

### 3.2 Signal
```
id                String    @id @default(cuid())
userId            String    → User
strategyId        String?   → optionnel (compatibilité ascendante)
asset             String
timeframe         String?
direction         String    "BUY" | "SELL" | "HOLD"
status            String    @default("OPEN")  → "OPEN" | "CLOSED"
entry_price       Float
stop_loss         Float
take_profit       Float
exit_price        Float?    ← renseigné à la clôture
confidence        Float
risk_reward_ratio Float?
patterns          String?   ← JSON array
indicators        String?   ← JSON object
closedAt          DateTime?
createdAt         DateTime
updatedAt         DateTime
```
Index : [userId], [asset], [strategyId], composite [strategyId,asset,direction,status]

### 3.3 Strategy
```
id            String   @id
userId        String   → User
name          String
description   String?
code          String   ← contient JSON StrategyRules après analyse Claude
asset         String
timeframe     String   "15m" | "1h" | "4h" | "1d"
status        String   @default("inactive")
win_rate      Float?
total_trades  Int?
profit_factor Float?
```

### 3.4 Report
```
id                      String @id
userId                  String → User
month                   Int
year                    Int
total_signals           Int
buy_signals             Int
sell_signals            Int
hold_signals            Int
win_rate                Float
avg_confidence          Float
best_signal_confidence  Float
worst_signal_confidence Float
total_pnl_estimate      Float
total_trades_expected   Int
high_confidence_signals Int
patterns_detected       String? ← JSON
indicators_used         String? ← JSON
summary                 String?
UNIQUE [userId, month, year]
```

### 3.5 AuthLog
```
id        String   @id
userId    String?  ← nullable (tentative sur email inexistant)
action    String
result    String
ip        String?
detail    String?
createdAt DateTime
```

### 3.6 WebAuthnCredential
```
id           String   @id
userId       String   → User
credentialId String   @unique  ← base64url
publicKey    String            ← base64url COSE key
counter      Int      @default(0)
deviceType   String?           "singleDevice" | "multiDevice"
backedUp     Boolean  @default(false)
transports   String?           ← JSON array
aaguid       String?
lastUsedAt   DateTime?
```

### 3.7 SimulationResult
```
id          String @id
userId      String → User
asset       String
params      String  ← JSON: { initialAmount, monthlyInvestment, months, annualReturn, volatility, mode }
result      String  ← JSON: { totalInvested, finalBalance, totalGains, roi }
monthlyData String? ← JSON array: [{ month, balance, invested, monthlyContribution, gainLoss }]
```

### 3.8 PortfolioSnapshot
```
id        String @id
userId    String → User
capital   Float
month     Int    (1-12)
year      Int
UNIQUE [userId, month, year]
```

### 3.9 Course (Formation)
```
id           String      @id
title        String
description  String
level        CourseLevel DEBUTANT | INTERMEDIAIRE | AVANCE | EXPERT
category     String
thumbnail    String?
duration     Int         (minutes)
totalLessons Int
order        Int
isPublished  Boolean     @default(false)
```
Index : [level], [isPublished]

### 3.10 Lesson
```
id          String     @id
courseId    String     → Course (CASCADE)
title       String
description String
videoUrl    String?
content     String
duration    Int
order       Int
type        LessonType VIDEO | ARTICLE | QUIZ
```

### 3.11 UserProgress
```
id        String  @id
userId    String  → User
courseId  String? → Course (SetNull)
lessonId  String? → Lesson (SetNull)
completed Boolean @default(false)
score     Int?
UNIQUE [userId, lessonId]
```

---

## 4. CONTROLLERS ET ENDPOINTS RÉELS

### 4.1 AuthController — `/auth`
| Méthode | Route | Guard | Action |
|---|---|---|---|
| POST | /auth/register | — | register(dto, res, ip) |
| POST | /auth/login | — | login(dto, res, ip) |
| POST | /auth/magic-link/request | — | requestMagicLink(email, ip) |
| POST | /auth/magic-link/verify | — | verifyMagicLink(token, ip) |
| GET | /auth/github | Passport('github') | redirect OAuth |
| GET | /auth/github/callback | Passport('github') | handleGithubCallback → redirect frontend |
| POST | /auth/2fa/verify | — | verify2FA(preAuthToken, otp) |
| POST | /auth/pin/verify | — | verifyPin(pinAuthToken, pin, res) |
| POST | /auth/pin/setup | — | setupPin(pinAuthToken, pin, res) |
| POST | /auth/set-password | — | setPassword(preAuthToken, password) |
| POST | /auth/refresh | Cookie | refresh(req, res) — rotation JTI |
| POST | /auth/logout | — | logout → révocation Redis |
| POST | /auth/dev-login | — | devLogin(email) — dev uniquement |
| GET | /auth/profile | JwtAuthGuard | getProfile(userId) |

### 4.2 StrategiesController — `/strategies`
| Méthode | Route | Action |
|---|---|---|
| GET | /strategies | findAllByUser(userId) |
| POST | /strategies/:id/analyze | analyzeById(id, userId) → Claude API |
| POST | /strategies/import | importFromDocument(file, dto, userId) → pdf-parse + Claude |

Import : Multer memoryStorage, limite 10 MB, types pdf/plain/markdown

### 4.3 SignalsController — `/signals`
| Méthode | Route | Action |
|---|---|---|
| GET | /signals | getUserSignals(userId) — 50 derniers |
| GET | /signals/recent | getRecentSignals(userId, 5) |
| POST | /signals | createSignal(userId, dto) |
| GET | /signals/statistics | getSignalsStatistics(userId) |
| POST | /signals/generate | generateSignal(userId, dto) |
| POST | /signals/scan-now | scheduler.runScan() |

### 4.4 MarketsController — `/markets`
| Méthode | Route | Action |
|---|---|---|
| GET | /markets | getTopCoins() — top 20, cache Redis 60s |
| GET | /markets/:id | getCoinDetail(coinId) — cache 30s |
| GET | /markets/:id/ohlcv | getOhlcv(coinId, days) — TTL variable |

### 4.5 FormationController — `/formation`
| Méthode | Route | Action |
|---|---|---|
| GET | /formation/courses | getCourses(userId) — publiés + progression |
| GET | /formation/courses/:id | getCourseById(id, userId) |
| GET | /formation/lessons/:id | getLessonById(id) |
| POST | /formation/progress | markLessonComplete(userId, dto) |
| GET | /formation/my-progress | getUserProgress(userId) |

### 4.6 Autres controllers
| Controller | Routes clés |
|---|---|
| SimulatorController | POST /simulator/dca, GET /simulator/history |
| ReportsController | GET /reports/:year/:month |
| PortfolioController | GET /portfolio/history, GET /portfolio/stats |
| PatternDetectionController (patterns) | via signals/generate |
| AIController | POST /ai/analyze, POST /ai/detect-patterns, POST /ai/generate-signal |
| TOTPController | POST /mfa/totp/enroll, POST /mfa/totp/verify, DELETE /mfa/totp |
| WebAuthnController | POST /mfa/webauthn/register-*, POST /mfa/webauthn/auth-* |
| MetricsController | GET /metrics (IP restrict) |
| AppController | GET /health → 200 OK |

---

## 5. EXTRAITS DE CODE NOTABLES

### 5.1 Appel Claude API — `src/ai/ai.service.ts`
```typescript
// Modèle fixé : claude-sonnet-4-6
const CLAUDE_MODEL = 'claude-sonnet-4-6';

async analyzeStrategyDocument(text: string): Promise<StrategyRules> {
  const client = new Anthropic({ apiKey });
  const response = await client.messages.create({
    model:      CLAUDE_MODEL,
    max_tokens: 4096,
    system:     SYSTEM_PROMPT,  // JSON structuré obligatoire
    messages:   [{ role: 'user', content: text }],
  });
  const raw = (response.content[0] as TextBlock).text;
  const cleaned = cleanJsonResponse(raw);      // retire ```json...```
  const parsed  = JSON.parse(cleaned);
  if (!validateStrategyRules(parsed)) throw ...;
  return { ...parsed, confidence_score: Math.min(100, Math.max(0, Number(parsed.confidence_score))) };
}
```

### 5.2 Bridge Python — `src/patterns/pattern-detection.service.ts`
```typescript
// spawn python3 avec stdin/stdout (pas exec — meilleure gestion mémoire)
const proc = spawn('python3', ['/app/ai-module/pattern_detector.py'], {
  stdio: ['pipe', 'pipe', 'pipe'],
});
proc.stdin.write(JSON.stringify(input), 'utf-8');
proc.stdin.end();
// Sortie : PatternDetectionResult JSON → { global_status: 'ENTRY_SIGNAL'|'EXIT_SIGNAL'|'NO_SIGNAL' }
```

### 5.3 Cache Redis anti-429 — `src/markets/markets.service.ts`
```typescript
// Double stockage : clé fraîche (TTL variable) + clé :stale (TTL 1h)
private async cacheSet<T>(key: string, value: T, ttl: number): Promise<void> {
  const serialised = JSON.stringify(value);
  await this.redis.set(key, serialised, ttl);
  await this.redis.set(`${key}:stale`, serialised, 3_600);  // fallback 429
}
// TTLs OHLCV : 1d→60s, 7d→180s, 30d→600s, >30d→1800s
private ohlcTtl(days: number): number {
  if (days <= 1)  return 60;
  if (days <= 7)  return 180;
  if (days <= 30) return 600;
  return 1_800;
}
```

### 5.4 Parsing PDF — `src/strategies/strategies.service.ts`
```typescript
// pdf-parse v2 : API classe (plus de fonction directe)
const { PDFParse } = require('pdf-parse') as {
  PDFParse: new (opts: { data: Buffer }) => { getText(): Promise<string> };
};
const parser = new PDFParse({ data: file.buffer });
return parser.getText();
```
Note : texte tronqué à 15 000 caractères avant envoi à Claude.

### 5.5 Verrouillage de compte — `src/auth/auth.service.ts`
```typescript
// Seuils configurables via .env
private get maxFailures(): number {
  return parseInt(this.config.get('MAX_AUTH_FAILURES') ?? '3', 10);
}
private async recordFailure(userId, step, ip?) {
  const count = parseInt(await this.redis.get(`fail:${step}:${userId}`) ?? '0') + 1;
  await this.redis.set(`fail:${step}:${userId}`, count.toString(), this.lockTtl);
  if (count >= this.maxFailures) {
    await this.redis.set(`locked:${userId}`, 'true', this.lockTtl);
    throw new HttpException('Compte bloqué', 423);
  }
}
```

### 5.6 Simulation DCA — `src/simulator/simulator.service.ts`
```typescript
// Mode fixed (taux constant) ou monte_carlo (Box-Muller Gaussian noise)
private getRandomReturn(mean: number, stdDev: number): number {
  const u1 = Math.random(); const u2 = Math.random();
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return mean + stdDev * z0;
}
```

### 5.7 JWT issueTokens (extrait auth.service.ts)
```typescript
const jti = crypto.randomUUID();
// Access token : 15 min, en mémoire côté client
const accessToken = this.jwtService.sign({ sub: userId, email }, { expiresIn: '15m' });
// Refresh token : 7j, stocké httpOnly cookie + Redis (clé refresh:{jti})
await this.redis.set(`refresh:${jti}`, userId, 7 * 24 * 3600);
res.cookie('refresh_token', refreshToken, { httpOnly: true, secure: true, sameSite: 'strict' });
```

---

## 6. ARCHITECTURE RÉELLE

### 6.1 Structure dossiers backend
```
backend-code/src/
├── ai/                  (ai.service.ts, ai.controller.ts — Claude API + Python bridge legacy)
├── auth/                (auth.service.ts 519L, auth.controller.ts, dto/, guards/, strategies/)
├── database/            (prisma.service.ts)
├── email/               (email.service.ts — Nodemailer SMTP)
├── formation/           (formation.service.ts, formation.controller.ts)
├── logging/             (logging.service.ts — RFC 5424 Syslog UDP → Logstash)
├── markets/             (markets.service.ts — CoinGecko + Redis)
├── metrics/             (metrics.service.ts — Prometheus prom-client)
├── mfa/
│   ├── totp/            (totp.service.ts — AES-256-GCM, otplib)
│   └── webauthn/        (webauthn.service.ts — @simplewebauthn/server)
├── patterns/            (pattern-detection.service.ts — spawn python3)
├── portfolio/           (portfolio.service.ts)
├── redis/               (redis.service.ts @Global())
├── reports/             (reports.service.ts)
├── signals/             (signals.service.ts, signal-scheduler.service.ts — @nestjs/schedule)
├── simulator/           (simulator.service.ts — DCA Box-Muller)
└── strategies/          (strategies.service.ts — importFromDocument, analyzeById)
```

### 6.2 Structure dossiers frontend (pages réelles)
```
frontend-web/pages/
├── index.tsx            (landing page)
├── login.tsx
├── register.tsx
├── dashboard/index.tsx
├── markets/
│   ├── index.tsx        (top 20 cryptos)
│   └── [id].tsx         (détail + TradingChart)
├── signals/
│   ├── index.tsx
│   └── [id].tsx
├── strategies/
│   ├── index.tsx
│   ├── new.tsx
│   └── import.tsx       (upload PDF)
├── formation/
│   ├── index.tsx
│   └── [courseId]/
│       ├── index.tsx
│       └── [lessonId].tsx
├── simulator/index.tsx
├── reports/index.tsx
├── profile/
│   ├── index.tsx
│   └── security.tsx     (MFA management)
├── pricing/index.tsx
├── auth/
│   ├── 2fa.tsx, magic.tsx, pin.tsx, setup-pin.tsx
│   ├── locked.tsx, github-callback.tsx, create-password.tsx
│   ├── totp-setup.tsx, totp-verify.tsx, webauthn-setup.tsx
└── api/coingecko/       (3 routes proxy Next.js)
    ├── markets.ts
    ├── coins/[id].ts
    └── ohlc/[id].ts
```

### 6.3 Mobile (React Native + Expo 49)
```
mobile/src/
├── navigation/RootNavigator.tsx    (Stack + Bottom Tabs)
└── screens/
    ├── auth/LoginScreen.tsx
    ├── dashboard/DashboardScreen.tsx
    ├── profile/ProfileScreen.tsx
    ├── signals/SignalsScreen.tsx
    └── simulator/SimulatorScreen.tsx
```
Note : 5 écrans identifiés — pas d'écran Markets mobile dans le code actuel.

### 6.4 Python AI Module (ai-module/)
```
ai-module/
├── signal_generator.py      (SignalGenerator class — TradingSignal dataclass)
├── candlestick_patterns.py  (CandlestickPatternDetector)
├── chart_patterns.py        (ChartPatternDetector)
├── indicators_calculator.py (TechnicalIndicators — RSI, MACD, Stochastic, BB, ATR)
├── scoring_engine.py        (ScoringEngine)
├── elliott_waves.py         (ElliottWave detection)
├── harmonic_patterns.py     (Gartley, Butterfly, Bat, Crab)
├── ichimoku_indicator.py    (Ichimoku Cloud)
├── dca_simulator.py         (DCASimulator)
├── nlp_rule_extractor.py    (NLP extraction règles — redondant avec Claude)
├── performance_tracker.py
├── report_generator.py
├── test_ai_module.py        (tests unitaires Python)
└── requirements.txt
```
**Important** : le bridge réel (`pattern-detection.service.ts`) appelle
`/app/ai-module/pattern_detector.py` via **spawn** stdin/stdout.
Ce fichier `pattern_detector.py` n'est PAS listé dans ai-module/ ci-dessus
→ il existe probablement dans `backend-code/ai-module/` (copie distincte).

---

## 7. TESTS RÉELS

### 7.1 Backend (Jest)
| Fichier | Ce qui est testé |
|---|---|
| `auth/auth.service.spec.ts` | register, login, lockout, 2FA, PIN |
| `logging/logging.service.spec.ts` | authSuccess/Failure, Syslog emission |
| `metrics/metrics.service.spec.ts` | counters Prometheus, histogram |
| `mfa/totp/totp.service.spec.ts` | enrollInit/Confirm, AES-256-GCM encrypt |
| `mfa/webauthn/webauthn.service.spec.ts` | registrationOptions, verify |

Seuil couverture Jest : **70%** (branches, functions, lines, statements)

### 7.2 Frontend (Vitest + RTL)
| Fichier | Ce qui est testé |
|---|---|
| `components/common/SignalCard.test.tsx` | Rendu BUY/SELL/HOLD, confidence |

### 7.3 Python
| Fichier | Ce qui est testé |
|---|---|
| `ai-module/test_ai_module.py` | Modules candlestick, indicators, DCA, scoring |

---

## 8. CE QUI EST RÉALISÉ vs PRÉVU

### Réalisé (code présent et fonctionnel)
- [x] Auth complète : email/password, Magic Link, GitHub OAuth, OTP, PIN, TOTP, WebAuthn
- [x] JWT JTI rotation avec Redis
- [x] Page Markets : CoinGecko top 20, détail, OHLCV chandeliers/line, cache Redis anti-429
- [x] Strategy Engine : upload PDF → pdf-parse → Claude API (claude-sonnet-4-6) → StrategyRules JSON
- [x] Détection patterns : spawn python3 → PatternDetectionResult
- [x] Signal generation : ENTRY/EXIT mapping → Signal BDD (déduplication, long-only)
- [x] Scheduler : scan toutes les 15 min (signal-scheduler.service.ts)
- [x] Module Formation : Course/Lesson/UserProgress, getCourses, markComplete
- [x] Simulateur DCA : mode fixed + monte_carlo (Box-Muller), persistance SimulationResult
- [x] Rapports mensuels : getMonthlyStats par userId/year/month
- [x] Monitoring : Prometheus prom-client, Grafana, ELK (prometheus.yml, grafana/, logstash/)
- [x] Docker : docker-compose.yml (postgres:15, redis:7, backend, frontend, prometheus, grafana, logstash)
- [x] Tests : 5 spec Jest backend, 1 test Vitest frontend, 1 test_ai_module.py

### Prévu / partiellement implémenté
- [ ] backtestStrategy() → retourne des données fictives hardcodées (lignes 262-278 ai.service.ts)
- [ ] getPatternsHistory() → données fictives hardcodées (lignes 247-256)
- [ ] Mobile : pas d'écran Markets (5 écrans seulement)
- [ ] Déploiement Railway/Vercel → non encore effectué (configuration documentée)
- [ ] WebSocket temps réel → non implémenté (polling HTTP)

---

## 9. NOTES POUR LE RAPPORT

- Le nom interne est `broker-ia-backend` mais le produit s'appelle **Alvio** (frontend package.json).
- `pdf-parse` v2 a une API différente de v1 (classe PDFParse, pas fonction directe) — bien noter.
- Le bridge Python utilise `spawn` (stdin/stdout) et non `exec` — distinction importante pour la séquence UML.
- Les signaux sont **long-only** (stratégie mean-reversion RSI+EMA) : EXIT_SIGNAL ferme le BUY existant, ne crée pas de SELL distinct. Bien documenter ce choix de design.
- `backtestStrategy` et `getPatternsHistory` retournent des données fictives → mentionner comme "à implémenter" dans les perspectives.
- Année dans PLAN.md : "2024-2025" mais dossier jury et code indiquent **2025-2026** → utiliser 2025-2026.
