# Alvio — Document de préparation exhaustif (RNCP 37873 CDA)

> Généré à partir d'une analyse directe du code source (branche `master`, commit `28df384`).
> Chaque affirmation ci-dessous est vérifiée par lecture réelle des fichiers (chemin + ligne cités). Là où le code contredit la doc/le README, c'est signalé explicitement — mieux vaut le savoir avant le jury qu'après.

---

## SECTION 1 — INVENTAIRE TECHNIQUE RÉEL

### 1.1 Modules NestJS (`backend-code/src/`)

| Module | Controller (routes) | Service (méthodes clés) | DTOs | Guards |
|---|---|---|---|---|
| **AppModule** (racine) | `AppController`: `GET /` → `getHello()`, `GET /health` → `{status,timestamp}` | `AppService.getHello()` | — | — |
| **AuthModule** | `AuthController` (`auth`): `POST register`, `POST login`, `POST magic-link/request`, `POST magic-link/verify`, `GET github`, `GET github/callback`, `POST 2fa/verify`, `POST pin/verify`, `POST pin/setup`, `POST set-password`, `POST refresh`, `POST logout`, `POST dev-login` (bloqué en prod), `GET profile` | `AuthService`: `register`, `login`, `requestMagicLink`, `verifyMagicLink`, `handleGithubCallback`, `verify2FA`, `setupPin`, `verifyPin`, `setPassword`, `refresh`, `logout`, `getProfile`, `devLogin` | `LoginDto`, `RegisterDto`, `RequestMagicLinkDto`, `VerifyMagicLinkDto`, `Verify2FADto`, `SetPasswordDto`, `SetupPinDto/VerifyPinDto` | `JwtAuthGuard` sur `/profile` ; `AuthGuard('github')` sur les routes GitHub |
| **DatabaseModule** | — | `PrismaService` (`onModuleInit`/`onModuleDestroy`) | — | — |
| **RedisModule** (`@Global`) | — | `RedisService`: `set/get/del/exists` (+ fallback `Map` en mémoire si Redis down) | — | — |
| **EmailModule** | — | `EmailService`: `sendMagicLink`, `sendOTP`, `sendSignalNotification` | — | — |
| **LoggingModule** (`@Global`) | — | `LoggingService.emit()` + wrappers (`authSuccess`, `authFailure`, `accountLocked`, `suspiciousIp`, `mfaEnrolled`, `mfaRevoked`...) → JSON + Syslog UDP 514 + table `AuthLog` | — | — |
| **MetricsModule** (`@Global`) | `MetricsController`: `GET /metrics` (restreint par IP via `METRICS_ALLOWED_IPS`) | `MetricsService.getMetrics()` (Prometheus text via `prom-client`) | — | — |
| **TotpModule** | `TotpController` (`mfa/totp`, tout sous `JwtAuthGuard`): `GET status`, `POST enroll/init`, `POST enroll/confirm`, `POST verify`, `POST disable` | `TotpService`: `enrollInit`, `enrollConfirm`, `verify`, `disable`, `getStatus` | `VerifyTotpDto`/`DisableTotpDto{code}` | `JwtAuthGuard` |
| **WebAuthnModule** | `WebAuthnController` (`mfa/webauthn`, tout sous `JwtAuthGuard`): `GET credentials`, `POST register/options`, `POST register/verify`, `POST auth/options`, `POST auth/verify`, `DELETE credentials/:id` | `WebAuthnService`: `registrationOptions`, `registrationVerify`, `authenticationOptions`, `authenticationVerify`, `listCredentials`, `removeCredential` | `WebAuthnRegistrationResponseDto`, `WebAuthnAuthenticationResponseDto`, `RemoveCredentialDto` | `JwtAuthGuard` |
| **FormationModule** | `FormationController` (`formation`, `JwtGuard`): `GET courses`, `GET courses/:id`, `GET lessons/:id`, `POST progress`, `GET my-progress` | `FormationService`: `getCourses`, `getCourseById`, `getLessonById`, `markLessonComplete`, `getUserProgress` | `CreateProgressDto{lessonId,courseId}` | `JwtGuard` |
| **MarketsModule** | `MarketsController` (`markets`, `JwtAuthGuard`): `GET top`, `GET detail/:coinId`, `GET ohlcv/:coinId?days=` (`ParseIntPipe`+`DefaultValuePipe(14)`) | `MarketsService`: `getTopCoins`, `getCoinDetail`, `getOhlcv` (proxy CoinGecko, cache Redis) | — | `JwtAuthGuard` |
| **PortfolioModule** | `PortfolioController` (`portfolio`, `JwtGuard`): `GET history`, `GET stats` | `PortfolioService` + `PortfolioScheduler` (`@Cron('0 0 1 * *')` snapshot mensuel — carry-forward, pas un vrai solde broker) | — | `JwtGuard` |
| **PatternsModule** | `PatternsController` (`patterns`, `JwtAuthGuard`): `GET detect?strategyId&asset&timeframe` | `PatternDetectionService.detectPattern()` → spawn Python | — | `JwtAuthGuard` |
| **PaymentsModule** | ⚠️ **`@Module({})` vide** — aucun controller/service | — | — | — |
| **UsersModule** | ⚠️ **`@Module({})` vide** — le CRUD user est en fait dans `AuthService.getProfile()` | — | — | — |
| **StrategiesModule** | `StrategiesController` (`strategies`, `JwtGuard`): `GET /`, `POST :id/analyze`, `POST import` (`FileInterceptor` mémoire, `ParseFilePipe` 10MB + type pdf/txt/md) | `StrategiesService`: `findAllByUser`, `analyzeById`, `importFromDocument`, `extractText` (privé) | `ImportStrategyDto{name,description?,timeframe,asset?}` | `JwtGuard` |
| **AIModule** | `AIController` (`api/ai`, `JwtGuard`): `POST analyze-strategy`, `POST detect-patterns`, `POST generate-signal`, `GET patterns/:asset`, `GET signals/asset/:asset`, `POST backtest`, `GET health` | `AIService`: `analyzeStrategyDocument` (Claude réel), `analyzeStrategy`/`detectPatterns`/`generateSignal` (exec Python inline), `getPatternsHistory` (⚠️ hardcodé), `getSignalsForAsset` (⚠️ stub vide), `backtestStrategy` (⚠️ métriques fixes) | — | `JwtGuard` |
| **SignalsModule** | `SignalsController` (`signals`, `JwtGuard`): `GET /`, `GET recent`, `POST /`, `GET statistics`, `POST generate`, `POST scan-now` | `SignalsService.generateSignal/createSignal/getUserSignals/getRecentSignals/getSignalsStatistics` + `SignalSchedulerService` (`setInterval`, pas `@Cron`) | `CreateSignalDto`, `GenerateSignalDto{strategyId,asset,timeframe,mockResult?}` | `JwtGuard` |
| **SimulatorModule** | `SimulatorController` (`simulator`, `JwtGuard`): `POST dca`, `GET history` | `SimulatorService.simulateDCA` (TypeScript pur, **pas Python**), `getHistory` | `DCASimulatorDto{asset,initialAmount,monthlyInvestment,months,annualReturn,volatility,mode}` | `JwtGuard` |
| **ReportsModule** | `ReportsController` (`reports`, `JwtGuard`): `GET monthly/:year/:month` | `ReportsService.getMonthlyStats` (lecture seule, agrégation sur `Signal`) | — | `JwtGuard` |

**Note guards** : `JwtAuthGuard` et `JwtGuard` sont deux noms pour la **même classe** (`src/auth/jwt.guard.ts` est un alias de compat vers `guards/jwt-auth.guard.ts`) — incohérence de nommage historique, pas un bug fonctionnel.

### 1.2 Pages Next.js (`frontend-web/pages/`)

| Route | Composants clés | Appels API | Store |
|---|---|---|---|
| `/` | `Layout`, `PageSEO` | aucun (contenu marketing hardcodé) | — |
| `/login` | inline | `POST /auth/login`, `POST /auth/magic-link/request`, redirect GitHub OAuth | écrit `useAuthStore.setAuth()` |
| `/register` | inline | `POST /auth/register` | écrit `setAuth()` |
| `/dashboard` | `AppLayout` | `GET /signals/statistics`, `GET /signals/recent`, `GET /portfolio/stats`, `GET /portfolio/history` | — |
| `/markets` | `AppLayout`, `RateLimitCard` | `GET /markets/top` (poll 90s) | — |
| `/markets/[id]` | `TradingChart` | `GET /markets/detail/:id`, `GET /markets/ohlcv/:id` | — |
| `/signals` | `AppLayout` | `GET /signals` — ⚠️ fallback `MOCK_SIGNALS` si vide/erreur | — |
| `/signals/[id]` | `AppLayout` | ⚠️ **aucun appel API — 100% objet `MOCK` hardcodé** | — |
| `/simulator` | `AppLayout` | `POST /simulator/dca`, `GET /simulator/history` (+ fallback client si échec) | — |
| `/strategies` | `AppLayout`, `AnalysisModal` | `GET /strategies`, `POST /strategies/:id/analyze` | — |
| `/strategies/import` | `AppLayout` | `POST /strategies/import` (FormData multipart) | — |
| `/strategies/new` | `AppLayout` | ⚠️ **aucun appel API** — `setTimeout` puis redirect (voir §4) | — |
| `/formation` | `AppLayout` | `GET /formation/courses`, `GET /formation/my-progress` | — |
| `/formation/[courseId]` | `AppLayout` | `GET /formation/courses/:id` | — |
| `/formation/[courseId]/[lessonId]` | `AppLayout` | `GET /formation/lessons/:id`, `POST /formation/progress` | — |
| `/pricing` | `Layout` | aucun (hardcodé) | — |
| `/profile` | `AppLayout` | `GET /auth/profile` — ⚠️ onglet "Sécurité" sans handlers | — |
| `/profile/security` | inline | `GET /mfa/totp/status`, `GET /mfa/webauthn/credentials`, `POST /mfa/totp/disable`, `DELETE /mfa/webauthn/credentials/:id` | lit `isAuthenticated` |
| `/reports` | `AppLayout` | ⚠️ **aucun appel API — entièrement hardcodé**, boutons sans handler | — |
| `/auth/2fa` | inline | `POST /auth/2fa/verify` | — |
| `/auth/create-password` | inline | `POST /auth/set-password` | — |
| `/auth/github-callback` | inline | `GET /auth/profile` | écrit `setAuth()` |
| `/auth/locked` | inline | aucun | — |
| `/auth/magic` | inline | `POST /auth/magic-link/verify` | ⚠️ n'appelle jamais `setAuth()` lui-même |
| `/auth/pin` | inline | `POST /auth/pin/verify` | écrit `setAuth()` |
| `/auth/setup-pin` | inline | `POST /auth/pin/setup` | écrit `setAuth()` |
| `/auth/totp-setup` | inline | `POST /mfa/totp/enroll/init`, `POST /mfa/totp/enroll/confirm` | — |
| `/auth/totp-verify` | inline | `POST /mfa/totp/verify` — ⚠️ orphelin, jamais lié depuis le flux de login réel | — |
| `/auth/webauthn-setup` | inline | `POST /mfa/webauthn/register/options`, `POST /mfa/webauthn/register/verify` | — |

**Zustand — point critique** : `zustand@4.5.7` est dans `package.json` mais **n'est importé nulle part** (vérifié par grep — zéro résultat). Le state management réel est `frontend-web/context/authStore.ts`, un store maison (objet mutable + `Set` de listeners), avec le commentaire explicite en tête de fichier : *"Remplace zustand par une implémentation légère compatible SSR/Next.js 13"*. **Ne dites pas "on utilise Zustand" en soutenance — dites "on a évalué Zustand mais on l'a remplacé par une implémentation maison plus légère, compatible SSR".**

`middleware.ts` : vérifie uniquement la présence du cookie `refresh_token` (pas sa validité — ça se fait au premier appel API via l'intercepteur Axios 401). Liste `PUBLIC_PATHS` : `/login`, `/register`, `/auth/magic`, `/auth/github-callback`, `/auth/2fa`, `/auth/create-password`, `/auth/pin`, `/auth/setup-pin`, `/auth/locked`, `/`, `/pricing`, `/formation`.

**mobile/** : c'est une **vraie app React Native/Expo** (pas juste de la doc) — écrans réels : `LoginScreen`, `RegisterScreen`, `DashboardScreen`, `ProfileScreen`, `SignalsScreen`, `SignalDetailScreen`, `SimulatorScreen` (qui appelle le **même** `POST /simulator/dca` que le web). Moins complète que le web (pas de formation, pas de MFA complet) mais fonctionnelle.

### 1.3 Fichiers Python (`ai-module/` — copie réelle utilisée : `backend-code/ai-module/`)

| Fichier | Rôle | Appelé par NestJS ? |
|---|---|---|
| `pattern_detector.py` | **Le seul script réellement utilisé en prod** — évalue les conditions entry/exit d'une stratégie (JSON) contre des données OHLCV, calcule une confiance | ✅ Oui — `spawn('python3', ['/app/ai-module/pattern_detector.py'])`, stdin/stdout JSON |
| `candlestick_patterns.py` | Détection de patterns chandelier (Hammer, Doji, Engulfing...) | Indirectement, via les scripts Python inline d'`ai.service.ts` (`analyzeStrategy`/`detectPatterns`) |
| `chart_patterns.py` | Patterns graphiques (double top/bottom, triangle, tête-épaules) | Idem |
| `indicators_calculator.py` | RSI/MACD/Stochastic/ATR/Bollinger | Idem |
| `scoring_engine.py` | Scoring pondéré 50/50 patterns+indicateurs | ⚠️ **Jamais appelé en réel** — le scoring réellement utilisé est `pattern_detector.py::compute_confidence()`, une implémentation indépendante |
| `signal_generator.py` | Génère un signal BUY/SELL/HOLD par vote | Utilisé seulement par le chemin `ai.service.ts.generateSignal()` (exec inline), pas par le scheduler de signaux réel |
| `dca_simulator.py` | Monte-Carlo DCA avec `numpy.random.normal`, seed fixe (42) | ⚠️ **Code mort** — l'endpoint réel `/simulator/dca` est en TypeScript pur (voir §2.6) |
| `elliott_waves.py`, `harmonic_patterns.py`, `ichimoku_indicator.py`, `nlp_rule_extractor.py`, `performance_tracker.py`, `report_generator.py` | Modules d'analyse technique additionnels | Non appelés par NestJS |
| `setup.py`, `test_ai_module.py`, `__init__.py` | Packaging / smoke test / exports | Non |

`requirements.txt` déclare `scikit-learn`, `scipy`, `matplotlib`, `seaborn`, `plotly`, `ta-lib`, `requests`, `python-dotenv` — **aucun n'est réellement importé** par un fichier `.py` du module (seuls `pandas`/`numpy` le sont).

**Pont NestJS ↔ Python (le vrai)** — `backend-code/src/patterns/pattern-detection.service.ts` :
```ts
const proc = spawn('python3', ['/app/ai-module/pattern_detector.py'], {
  stdio: ['pipe', 'pipe', 'pipe'],
});
proc.stdin.write(JSON.stringify(input), 'utf-8');
proc.stdin.end();
```
Entrée par **stdin** (JSON `{strategy, market_data}`), sortie par **stdout** (`JSON.parse`). Pas de timeout configuré. Erreurs : exit code ≠ 0 → reject avec stderr.

**Deuxième pont (parallèle, legacy)** — `ai.service.ts` utilise `exec('python -c "..."')` avec des scripts Python inline (template strings JS) pour 3 méthodes (`analyzeStrategy`, `detectPatterns`, `generateSignal`), distinctes du chemin `pattern_detector.py`. Les deux ponts coexistent mais ne sont pas branchés au même endroit du système.

**Claude/Anthropic (le vrai moteur IA "intelligent")** — `AIService.analyzeStrategyDocument(text)` :
```ts
const CLAUDE_MODEL = 'claude-sonnet-4-6';
const client = new Anthropic({ apiKey });
const response = await client.messages.create({
  model: CLAUDE_MODEL, max_tokens: 4096,
  system: SYSTEM_PROMPT,
  messages: [{ role: 'user', content: text }],
});
```
C'est ce qui transforme un PDF de stratégie uploadé en JSON structuré (`StrategyRules`), stocké ensuite dans `strategy.code` — c'est ce JSON que `pattern_detector.py` consomme.

### 1.4 Modèle Prisma (`backend-code/prisma/schema.prisma`, 12 modèles + 2 enums)

- `provider = "postgresql"` (le commentaire en tête de fichier parle de SQLite en dev — **obsolète**, le schéma est déjà 100% Postgres).
- **Enums** : `CourseLevel` (DEBUTANT/INTERMEDIAIRE/AVANCE/EXPERT), `LessonType` (VIDEO/ARTICLE/QUIZ).
- **User** — `id, username @unique, email @unique, passwordHash?, githubId? @unique, pin?, totpSecret?, totpEnabled, trading_preference?, email_notifications, createdAt, updatedAt` + relations 1-N vers `Signal, Strategy, Report, WebAuthnCredential, UserProgress, PortfolioSnapshot, SimulationResult`.
- **Signal** — FK `userId` (Cascade), `strategyId` **String simple, pas une vraie relation Prisma** (commentaire : nullable pour compat arrière), `asset, direction, status(default OPEN), entry/stop_loss/take_profit/exit_price, confidence, patterns/indicators (JSON en String)`. Index : `userId`, `asset`, `strategyId`, et un composite `[strategyId, asset, direction, status]` (optimisation de déduplication O(1)).
- **Strategy** — FK `userId` (Cascade), `code` (JSON en String — c'est le `StrategyRules` généré par Claude), `status(default inactive)`. Index `userId`.
- **SimulationResult** — FK `userId` (Cascade), `params`/`result` en String JSON. Index `userId`.
- **PortfolioSnapshot** — FK `userId` (Cascade), `@@unique([userId,month,year])`, index `userId`.
- **WebAuthnCredential** — FK `userId` (Cascade), `credentialId @unique`, `counter` (anti-clone/replay). Index `userId`.
- **Report** — FK `userId` (Cascade), `@@unique([userId,month,year])`.
- **AuthLog** — `userId` **String, sans relation ni cascade** (choix délibéré : les logs d'audit survivent à la suppression du compte).
- **Course/Lesson/UserProgress** — relations classiques, `UserProgress` a `courseId?`/`lessonId?` en `onDelete: SetNull` (contrairement au reste en Cascade).

Pas de modèle `RefreshToken` : les refresh tokens vivent **uniquement en Redis** (`refresh:{jti}`), pas en Postgres — choix explicite de source unique de vérité.

### 1.5 docker-compose.yml — 9 services confirmés

| Service | Rôle | Port |
|---|---|---|
| postgres | BDD principale | 5432 |
| redis | sessions/OTP/TOTP/WebAuthn | 6379 |
| backend | API NestJS | 3001 |
| frontend | Next.js | 3000 |
| prometheus | métriques | 9090 |
| grafana | dashboards | 3003→3000 |
| elasticsearch | SIEM store | 9200 |
| kibana | UI SIEM | 5601 |
| logstash | pipeline Syslog→ES | 514/udp |

⚠️ **Incohérence de port** : docker-compose expose le frontend sur `3000`, mais README/`.env.example` (`WEBAUTHN_ORIGIN`, `FRONTEND_URL`, `CORS_ORIGINS`) référencent `3006` — deux modes de déploiement documentés de façon incohérente.
⚠️ **Secrets en clair committés** : `ELASTIC_PASSWORD: "brokeria2026"` et les clés de chiffrement Kibana sont hardcodées dans `docker-compose.yml` — un vrai finding de sécurité à assumer (pas caché derrière du `${VAR}`).

---

## SECTION 2 — FLUX DE DONNÉES (le vrai chemin dans le code)

### 2.1 FLUX LOGIN (email/password)

```
pages/login.tsx (handleSubmit)
  → authApi.login(email,password)  [frontend-web/api/index.ts]
    → POST /auth/login
      → AuthController.login()  [backend-code/src/auth/auth.controller.ts]
        → AuthService.login()  [auth.service.ts]
            1. prisma.user.findUnique({email})
            2. bcrypt.compare(password, user.passwordHash)
            3. si échec → recordFailure() : Redis fail:{step}:{userId}, seuil MAX_AUTH_FAILURES(3) → lock 423
            4. si succès → issueTokens(userId)
                 - sign access JWT, secret=JWT_SECRET, expiresIn=15min (ACCESS_TTL=15*60, ligne 24)
                 - sign refresh JWT, secret=JWT_REFRESH_SECRET, expiresIn=7j (REFRESH_TTL=7*24*3600, ligne 25)
                 - redis.set(refreshKey(jti), userId, REFRESH_TTL)   ← clé Redis "refresh:{jti}"
                 - res.cookie('refresh_token', ..., {httpOnly:true, maxAge:REFRESH_TTL*1000})
            5. return {accessToken, user}
  ← 200 {accessToken, user}
  → useAuthStore.setAuth(accessToken, user)  [pages/login.tsx:44]
  → redirect /dashboard
```
⚠️ **Point important pour le jury** : le login actuel **ne passe PAS par la 2FA/OTP** — le code contient le commentaire explicite `// 2FA DÉSACTIVÉ : retourner directement les tokens`. Les pages `2fa.tsx`/`pin.tsx`/`totp-verify.tsx` existent et fonctionnent, mais sont utilisées dans le flux **Magic Link** (`auth/magic.tsx`), pas dans le login mot de passe direct. Le MFA (TOTP/WebAuthn) est géré séparément, en opt-in, depuis `/profile/security`.

### 2.2 FLUX IMPORT STRATÉGIE PDF

```
pages/strategies/import.tsx (handleSubmit)
  → FormData: file, name, timeframe, description?, asset?
    → POST /strategies/import (multipart/form-data)
      → StrategiesController.import()
          @UseInterceptors(FileInterceptor('file', {storage: memoryStorage(), limits:{fileSize:10MB}}))
          @Body() ParseFilePipe([MaxFileSizeValidator(10MB), FileTypeValidator(/pdf|plain|markdown/)])
        → StrategiesService.importFromDocument(file, dto, userId)
            1. extractText(file) — pdf-parse pour un PDF, lecture brute pour txt/md
            2. AIService.analyzeStrategyDocument(text)
                 → Anthropic client.messages.create({model:'claude-sonnet-4-6', system:SYSTEM_PROMPT, messages:[{role:'user',content:text}]})
                 → cleanJsonResponse() (retire les ``` markdown)
                 → JSON.parse → validateStrategyRules() → normalisation (clamp confidence_score 0-100)
            3. prisma.strategy.create({..., code: JSON.stringify(rules)})
  ← 201 {message, strategy:{id,name,timeframe,asset}, rules:{entry_conditions,exit_conditions,indicators,risk_management}}
```

### 2.3 FLUX GÉNÉRATION DE SIGNAL (scheduler automatique)

```
SignalSchedulerService.onModuleInit()  [signal-scheduler.service.ts]
  → setInterval(runScan, SIGNAL_SCAN_INTERVAL env, défaut 900000ms/15min)
  → schedulerRegistry.addInterval('signal-scan', interval)   ← PAS un @Cron, un setInterval enregistré
runScan():
  1. prisma.strategy.findMany({where:{status:'active'}})
  2. pour chaque stratégie → SignalsService.generateSignal(userId, {strategyId,asset,timeframe})
       → PatternDetectionService.detectPattern()
            - charge la Strategy, parse strategy.code (JSON)
            - résout asset → coinId CoinGecko, timeframe → nb de jours
            - MarketsService.getOhlcv(coinId, days)
                · clé Redis "markets:ohlcv:{coinId}:{days}", TTL selon la durée (60s à 1800s)
                · si 429 CoinGecko → retry 2s puis fallback cache ":stale" (TTL 3600s)
            - spawn python3 pattern_detector.py (stdin JSON strategy+market_data)
            - parse stdout → status ENTRY_SIGNAL/EXIT_SIGNAL/NO_SIGNAL + confidence
       - NO_SIGNAL → rien
       - ENTRY_SIGNAL (BUY) → dédup contre un signal OPEN existant, sinon prisma.signal.create() avec entry/SL/TP calculés depuis risk_management
       - EXIT_SIGNAL (SELL) → ferme le signal OPEN existant (status:CLOSED, exit_price, closedAt) — design "long-only", pas de nouveau row SELL
  3. notifyAllUsers(signal) (fire-and-forget) → prisma.user.findMany() (emails) → emailService.sendSignalNotification()
```

### 2.4 FLUX DÉTECTION DE PATTERNS (endpoint manuel)

```
GET /patterns/detect?strategyId&asset&timeframe
  → PatternsController.detect()
    → PatternDetectionService.detectPattern()   ← exactement la même chaîne que §2.3
        (charge Strategy → MarketsService.getOhlcv, cache Redis/fallback CoinGecko → spawn python3 pattern_detector.py stdin/stdout → parsing)
  ← PatternDetectionResult JSON
```

### 2.5 FLUX INSCRIPTION + TOTP

```
pages/register.tsx → POST /auth/register
  → AuthService.register()
      1. bcrypt.hash(password)
      2. prisma.user.create()
      3. issueTokens() → {accessToken, user}  (2FA désactivée au register aussi, comme pour login)

[Plus tard, opt-in depuis /profile/security → /auth/totp-setup]
POST /mfa/totp/enroll/init
  → TotpService.enrollInit()
      - authenticator.generateSecret(20)  ← 160 bits
      - encrypt(secret) — AES-256-GCM, IV 12 bytes aléatoire, authTag 128 bits :
          crypto.createCipheriv('aes-256-gcm', key, iv) → format stocké "iv:authTag:ciphertext" (hex)
      - stocke totpSecret chiffré (totpEnabled reste false)
      - retourne l'URL otpauth:// pour générer le QR code
POST /mfa/totp/enroll/confirm {code}
  → decrypt(secret) → authenticator.options={window:1} → authenticator.check(code, secret)
  → si valide : totpEnabled=true, LoggingService.mfaEnrolled()
POST /mfa/totp/verify {code}  (usage ultérieur, ex. reconfirmation)
```

### 2.6 FLUX SIMULATEUR DCA

⚠️ **Correction importante par rapport à l'hypothèse de départ** : l'endpoint réel **n'appelle PAS Python/numpy**. `dca_simulator.py` existe dans `ai-module/` mais est du **code mort** (jamais appelé par le backend NestJS — seulement référencé dans le propre `__init__.py` du module et dans la liste hardcodée de `/ai/health`).

```
pages/simulator/index.tsx (handleRun)
  → POST /simulator/dca {asset, initialAmount, monthlyInvestment, months, annualReturn, volatility, mode}
    → SimulatorController.simulateDCA()
      → SimulatorService.simulateDCA()  [simulator.service.ts — TypeScript pur]
          boucle mois par mois :
            balance = balance * (1 + getRandomReturn(monthlyRate, volatility))
          private getRandomReturn(mean, stdDev):          // Box-Muller, PAS numpy.random.normal
            u1 = Math.random(); u2 = Math.random()
            z0 = sqrt(-2*ln(u1)) * cos(2π*u2)
            return mean + stdDev * z0
      → prisma.simulationResult.create({params, result, monthlyData})
  ← résultat JSON
```
Si l'API échoue, le frontend calcule lui-même un fallback intérêts-composés côté client (avec avertissement affiché) — encore une raison de ne pas confondre ce filet de sécurité UI avec le moteur réel.

---

## SECTION 3 — QUESTIONS PIÈGES DU JURY (réponses basées sur le code réel)

### 3.1 Architecture

**"Pourquoi NestJS plutôt qu'Express ?"**
Le code utilise réellement les mécanismes NestJS, pas juste sa syntaxe : injection de dépendances par constructeur partout (`PrismaService`, `RedisService` injectés dans chaque service), `@Module()` par domaine métier (18 modules), guards (`@UseGuards(JwtAuthGuard)` sur quasi tous les controllers), interceptors (`FileInterceptor` pour l'upload PDF), pipes (`ParseIntPipe`+`DefaultValuePipe(14)` sur `/markets/ohlcv`, `ParseFilePipe` avec `MaxFileSizeValidator`+`FileTypeValidator` sur l'import de stratégie). C'est une architecture modulaire et testable par construction (chaque service peut être mocké isolément — voir les 9 fichiers `*.spec.ts`).

**"Pourquoi Pages Router et pas App Router ?"**
Le projet est sur Next.js 13.4.0 — l'App Router venait tout juste de passer stable à cette version (moins de maturité/documentation à l'époque du développement). Structure `pages/` classique (28 pages), mapping fichier→route direct, plus simple à raisonner pour une équipe réduite.

**"Pourquoi Zustand et pas Redux ?"**
Réponse honnête : Zustand est dans les dépendances mais **n'est en réalité pas utilisé** — il a été remplacé par `context/authStore.ts`, une implémentation maison (objet mutable + Set de listeners) avec le commentaire explicite "remplace zustand... compatible SSR/Next.js 13". Si le jury pose la question, assumez : "on a évalué Zustand, on a fini par écrire un store minimal pour éviter les problèmes d'hydratation SSR avec Next.js Pages Router".

**"Pourquoi Prisma et pas TypeORM ?"**
Client typé auto-généré à partir d'un schéma déclaratif unique (`schema.prisma`, 12 modèles), workflow de migrations explicite (`prisma migrate dev`/`deploy`), aucune requête SQL brute nulle part (zéro `$queryRaw` dans tout `src/`) — 100% requêtes paramétrées par le client généré.

**"Comment communiquent NestJS et Python ?"**
Deux mécanismes coexistent : (1) le chemin réel de production, `child_process.spawn('python3', ['pattern_detector.py'])` avec JSON par **stdin/stdout** (pattern-detection.service.ts) ; (2) un chemin parallèle plus ancien, `exec('python -c "..."')` avec des scripts Python inline générés en template string JS (`ai.service.ts`, 3 méthodes). Les deux existent, mais seul (1) est branché sur le scheduler de signaux automatique.

### 3.2 Sécurité (BC01)

**"Expliquez votre stratégie JWT"**
TTL exacts, en constantes hardcodées dans `auth.service.ts` (lignes 24-27) : access token 15 min, refresh token 7 jours, token magic-link 15 min, pré-auth token 10 min. ⚠️ Les variables `JWT_EXPIRATION`/`JWT_REFRESH_EXPIRATION` existent dans `.env.example` mais **ne sont lues nulle part dans le code** — les modifier n'a aucun effet, c'est une divergence doc/code à assumer si on vous pousse dessus. Refresh flow : rotation à usage unique — chaque `/auth/refresh` supprime l'ancien `refresh:{jti}` Redis et en émet un nouveau (rejeu impossible avec un ancien refresh token).

**"Comment protégez-vous contre les injections SQL ?"**
100% des accès BDD passent par le client Prisma généré (`findUnique`, `create`, `update`...), paramétré nativement. Zéro `$queryRaw`/`$executeRaw` dans tout le code source (vérifié par grep).

**"Votre TOTP est-il conforme RFC 6238 ?"**
Oui par défaut : `otplib`/`authenticator` sans override de `step`/`digits` → 30 secondes / 6 chiffres (valeurs standard RFC 6238). Tolérance `window:1` (±30s). Secret 160 bits (`generateSecret(20)`, dépasse le minimum RFC de 80 bits). Chiffré au repos en AES-256-GCM (IV 96 bits aléatoire, tag d'authentification 128 bits).

**"Comment gérez-vous le brute force ?"**
Compteurs Redis, pas un rate-limiter générique (pas de `@nestjs/throttler`, zéro `@Throttle()` dans le code) : `fail:{step}:{userId}` (TTL 1800s, verrouillage HTTP 423 après `MAX_AUTH_FAILURES=3`) + `fail:ip:{ip}` (TTL 1h, seuil 10, déclenche un événement `SUSPICIOUS_IP` loggé). C'est un verrouillage par échecs successifs, pas un throttling de débit brut — à préciser si le jury demande "avez-vous du rate limiting au sens strict".

**"Vos secrets sont-ils sécurisés ?"**
Aucun secret hardcodé dans le code applicatif (grep confirmé — les seules occurrences de mots de passe en dur sont dans les mocks de tests). Chargement via `ConfigService`/`.env`. ⚠️ Exception réelle à assumer : `docker-compose.yml` contient des mots de passe Elasticsearch/Kibana en clair (`"brokeria2026"`) directement committés — un vrai point d'amélioration, pas caché.

### 3.3 Base de données (BC02)

**"Justifiez votre MCD"**
`User` 1-N `Strategy` (Cascade) : un utilisateur possède ses stratégies. `Strategy` → `Signal` : lien **volontairement non-relationnel** (`Signal.strategyId` est un simple champ String, pas une clé étrangère Prisma formelle) — choix documenté pour la compatibilité arrière (un signal peut exister même si la stratégie source est modifiée/supprimée). `User` 1-N `Signal` (Cascade) : suppression RGPD en cascade.

**"Pourquoi pas de table détachée pour les patterns ?"**
Les patterns/indicateurs détectés sont stockés en JSON texte directement sur `Signal.patterns`/`Signal.indicators` plutôt que normalisés en tables séparées — choix pragmatique car ce sont des instantanés de calcul ponctuels (snapshot en lecture seule), pas des entités interrogées relationnellement.

**"Quels index avez-vous ?"**
`Signal` : `userId`, `asset`, `strategyId`, et un composite `[strategyId, asset, direction, status]` (déduplication O(1), commenté explicitement dans le schéma). `Strategy`/`SimulationResult`/`PortfolioSnapshot`/`WebAuthnCredential` : index `userId`. `Course` : `level`, `isPublished`. `Lesson` : `courseId`. `UserProgress` : `userId`, `courseId`, `@@unique([userId,lessonId])`.

**"Comment gérez-vous la suppression RGPD ?"**
`onDelete: Cascade` sur la quasi-totalité des tables liées à `User` (Signal, Strategy, Report, WebAuthnCredential, UserProgress, PortfolioSnapshot, SimulationResult). Exception assumée : `AuthLog.userId` n'a **aucune** relation/cascade — les logs d'audit de sécurité survivent volontairement à la suppression du compte (arbitrage RGPD vs traçabilité de sécurité, à justifier comme un choix, pas un oubli).

### 3.4 Tests

**"Quelle est votre couverture ?"**
Point à assumer honnêtement : `package.json` déclare un seuil `coverageThresholds` (au pluriel) à 70% sur branches/functions/lines/statements — mais la clé Jest correcte est `coverageThreshold` (singulier). Résultat : **le seuil n'est en réalité jamais appliqué**, Jest l'ignore silencieusement. 9 fichiers `*.spec.ts` existent (2586 lignes), tous en tests unitaires avec mocks complets de Prisma/Redis/Email/JWT — aucun test ne touche une vraie base de données.

**"Montrez un test unitaire"**
`totp.service.spec.ts` : mocke `PrismaService`/`RedisService`/`LoggingService`/`ConfigService` (avec une clé `TOTP_ENCRYPTION_KEY` fixe de test), teste `enrollInit`/`enrollConfirm`/`verify`/`disable` et le cycle chiffrement/déchiffrement complet.

**"Pourquoi pas de tests E2E ?"**
Réponse honnête : `package.json` a un script `test:e2e` pointant vers `./test/jest-e2e.json`, mais **ce dossier `test/` n'existe pas du tout** dans le repo — aucun fichier `*.e2e-spec.ts`, `supertest` est en dépendance mais jamais utilisé. Ce n'est pas "prévu en V2 et documenté", c'est un script mort qui échouerait immédiatement si on l'exécutait. À dire clairement : "l'infra e2e n'a pas encore été commencée, c'est un axe d'amélioration identifié."

### 3.5 Déploiement (BC03)

**"Comment reproduire votre env ?"**
`docker compose up -d` (9 services) + `npm run migrate:deploy` (Prisma, script ajouté — voir historique de migration). Les 3 secrets obligatoires (`JWT_SECRET`, `JWT_REFRESH_SECRET`, `TOTP_ENCRYPTION_KEY`) utilisent la syntaxe `:?` de docker-compose et font échouer le démarrage si absents.

**"Votre CI/CD ?"**
Réponse honnête : **absent**, pas juste "documenté mais pas implémenté" — aucun dossier `.github/workflows/` n'existe nulle part dans le repo (vérifié directement). Uniquement des commandes manuelles documentées dans `TESTING_GUIDE.md` (`npm run test`, `npm run lint`).

**"Pourquoi 9 services Docker ?"**
Voir tableau §1.5 — stack complète incluant observabilité (Prometheus/Grafana) et SIEM (Elasticsearch/Kibana/Logstash), pas seulement l'app.

### 3.6 IA

**"Votre IA est-elle vraiment intelligente ?"**
Hybride, à décrire précisément : (1) extraction NLP réelle via l'API Claude (Anthropic, modèle `claude-sonnet-4-6`) pour transformer un document de stratégie en règles structurées — c'est un vrai appel LLM ; (2) évaluation des règles ensuite **purement heuristique** (`pattern_detector.py` : conditions if/else sur des indicateurs de prix, scoring par ratio de conditions remplies + bonus de marge) — pas de modèle ML entraîné. `scikit-learn` est dans `requirements.txt` mais n'est importé nulle part : aucun entraînement de modèle n'a lieu dans ce projet.

**"Pourquoi Claude et pas GPT ?"**
Sortie JSON structurée fiable (moins de dérive de format observée), prompt système dédié (`SYSTEM_PROMPT`), coût maîtrisé pour un usage ponctuel (un appel par import de document, pas par requête utilisateur).

**"Vos patterns sont-ils fiables ?"**
Heuristiques basées sur les prix OHLCV, sans validation par backtesting réel en production — à assumer frontalement : `AIService.backtestStrategy()` **ignore complètement ses paramètres d'entrée** (`historicalData`, `strategyCode`) et retourne des métriques fixes à chaque appel (`finalBalance: capital*1.15`, `totalTrades:42`, `winRate:65%`, `sharpeRatio:1.8`) — c'est un stub non connecté, pas un vrai moteur de backtest. Si le jury pose la question de front, la meilleure réponse est l'honnêteté : "le endpoint de backtest est un stub actuellement, le vrai moteur reste à implémenter."

---

## SECTION 4 — CE QUI EST RÉEL vs CE QUI EST SIMULÉ

### Fonctions qui retournent des données hardcodées/fake
- `AIService.getPatternsHistory(asset)` (`ai.service.ts:247-256`) — retourne toujours le même tableau fixe (Hammer/Doji/Double Top), ignore `asset`.
- `AIService.getSignalsForAsset(asset,limit)` (`ai.service.ts:258-260`) — retourne toujours `{signals:[], total:0}`.
- `AIService.backtestStrategy(...)` (`ai.service.ts:262-278`) — ignore ses arguments, retourne des métriques fixes (`+15%`, `42 trades`, `65% winrate`, `Sharpe 1.8`).
- `PortfolioScheduler.takeMonthlySnapshot()` — carry-forward du dernier capital connu, pas un vrai appel à une API broker (commenté explicitement dans le code comme limitation connue).
- `dca_simulator.py` (`ai-module/`) — `np.random.seed(42)` fixe : une "simulation Monte Carlo" en réalité 100% déterministe — mais ce fichier n'est de toute façon jamais appelé (code mort, voir §2.6).
- Frontend : `pages/signals/[id].tsx` (objet `MOCK` fixe, aucun appel API), `pages/reports/index.tsx` (tableau `MONTHLY_DATA` fixe, boutons sans handler), `pages/strategies/new.tsx` (aucun appel API, juste un `setTimeout`), `pages/signals/index.tsx` (fallback `MOCK_SIGNALS` si l'API échoue — celui-ci est un vrai filet de sécurité UX, pas une façade cachée).

### Modules vides / non implémentés
- `PaymentsModule` et `UsersModule` : `@Module({})` vides, aucun controller/service (le CRUD utilisateur réel vit dans `AuthService`).
- Tests e2e : script `test:e2e` référence un dossier `test/` inexistant.
- CI/CD : totalement absent.
- Seuil de couverture Jest : déclaré mais non appliqué (typo `coverageThresholds`).

### README / docs vs réalité
- `README.md` est globalement fiable et vérifié (MFA 3 facteurs, Prometheus/Grafana, SIEM 5 règles de détection, modules listés — tout confirmé présent dans le code).
- ⚠️ `CODE_SUMMARY.md` et `DEPLOYMENT_GUIDE.md` décrivent une **stack complètement différente et inexistante** (backend FastAPI/Python, frontend React+Vite) — ce sont des artefacts obsolètes d'une génération de projet antérieure. **Ne pas s'appuyer dessus en soutenance**, ils ne correspondent pas au code livré (NestJS + Next.js).
- `TESTING_GUIDE.md` est à jour et fiable (référence bien NestJS/Next.js/docker-compose).
- Le commentaire "SQLite en dev" dans `schema.prisma` est obsolète : le provider est déjà 100% PostgreSQL.

### Seed vs données réelles
- `prisma/seed-formation.ts` (823 lignes) : contenu pédagogique réel et sérieux (4 cours, 19 leçons, RSI/MACD/Smart Money Concept/Kelly Criterion), pas du lorem ipsum. Vidéos YouTube réelles (documenté : IDs publics, à surveiller si retirés). Thumbnails en photos stock Unsplash (placeholder assumé, normal pour une démo).
- Aucune donnée `User`/`Signal`/`Strategy` n'est seedée — pas de faux utilisateurs ou faux signaux de trading en base par défaut.

---

## SECTION 5 — VOCABULAIRE TECHNIQUE

**Sécurité / Auth**
- **JWT** : token signé (HMAC ici) prouvant l'identité sans session serveur. Dans Alvio : access token 15min signé avec `JWT_SECRET`.
- **Refresh Token** : token longue durée pour renouveler l'access token sans re-login. Dans Alvio : 7j, stocké en Redis (`refresh:{jti}`), rotation à usage unique.
- **TOTP** : code à usage unique basé sur le temps (RFC 6238). Dans Alvio : `otplib`, secret AES-256-GCM chiffré en base.
- **WebAuthn FIDO2** : authentification par clé publique/privée (biométrie, clé de sécurité). Dans Alvio : `@simplewebauthn/server`, challenges en Redis (TTL 5min).
- **bcrypt** : hash de mot de passe avec sel intégré, lent par design (anti brute-force). Dans Alvio : hash des mots de passe utilisateurs.
- **AES-256-GCM** : chiffrement symétrique authentifié. Dans Alvio : chiffre le secret TOTP au repos.
- **OAuth 2.0** : délégation d'autorisation tierce. Dans Alvio : login GitHub via `passport-github2`.
- **CORS** : contrôle des origines autorisées à appeler l'API depuis un navigateur. Dans Alvio : `CORS_ORIGINS` env.
- **CSRF** : falsification de requête inter-site. Mitigé par cookies `httpOnly`+`SameSite` côté refresh token.
- **XSS** : injection de script côté client. React échappe le rendu par défaut.
- **SQL Injection** : injection de requête SQL. Mitigé par Prisma (100% requêtes paramétrées, zéro SQL brut).
- **Rate Limiting** : limitation du débit de requêtes. Dans Alvio : pas de rate-limiter générique — compteurs d'échecs Redis à la place (voir §3.2).

**Données**
- **ORM** : couche d'abstraction objet↔SQL. Ici Prisma.
- **Prisma** : ORM TypeScript avec schéma déclaratif et client généré.
- **Migration** : évolution versionnée du schéma DB. `prisma/migrations/`.
- **Seed** : données initiales injectées en base (`seed-formation.ts`).
- **DTO** : objet de transfert validé (Data Transfer Object), typé et validé via `class-validator`.
- **ValidationPipe** : pipe NestJS qui valide un DTO entrant automatiquement.
- **Guard** : classe qui autorise/bloque une requête avant le handler (`JwtAuthGuard`).
- **Interceptor** : intercepte requête/réponse (`FileInterceptor` pour l'upload).
- **Middleware** : fonction exécutée avant le routing (`middleware.ts` côté Next.js).
- **Controller** : reçoit les requêtes HTTP, délègue au service.
- **Service** : logique métier, injecté dans les controllers.
- **Repository Pattern** : abstraction d'accès aux données — ici partiellement incarné par `PrismaService`.
- **MVC** : Modèle-Vue-Contrôleur.
- **N-Tiers** : architecture en couches (présentation/métier/données).
- **REST** : style d'architecture API basé sur les ressources HTTP.
- **CRUD** : Create/Read/Update/Delete.
- **Pagination** : découpage des résultats en pages (non implémenté explicitement partout — à vérifier au cas par cas).
- **WebSocket** : canal bidirectionnel temps réel (non utilisé dans Alvio — tout est en REST/polling).

**Infra**
- **Docker** : conteneurisation d'application.
- **Container** : instance isolée d'une image Docker.
- **Volume** : stockage persistant hors du cycle de vie du conteneur.
- **Network** : réseau virtuel Docker reliant les services.
- **Healthcheck** : sonde de santé d'un conteneur (`pg_isready`, `redis-cli ping`, endpoint `/health`).
- **Compose** : orchestration multi-conteneurs déclarative (`docker-compose.yml`).
- **CI/CD** : intégration/déploiement continus — **absent** dans Alvio (voir §3.5).
- **GitHub Actions** : moteur CI/CD de GitHub — non utilisé ici.
- **Railway** / **Vercel** : plateformes de déploiement cible (backend/frontend respectivement, d'après `.env.example`).

**Trading / IA**
- **OHLCV** : Open/High/Low/Close/Volume — format standard des bougies de marché.
- **Candlestick** : représentation en bougie d'une période de prix.
- **RSI/MACD/Bollinger/ATR/Fibonacci** : indicateurs techniques classiques, calculés dans `indicators_calculator.py`.
- **Pattern Detection** : reconnaissance de figures de prix (chandelier/graphique).
- **Scoring Engine** : module de pondération patterns+indicateurs (existe mais non branché en prod, voir §1.3).
- **Signal** : recommandation d'action (BUY/SELL) générée par le pipeline.
- **Stop-Loss / Take-Profit** : seuils de sortie automatique calculés depuis `risk_management`.

**Méthodologie**
- **Scrum / Sprint / Backlog / Burndown / MoSCoW / User Story** : vocabulaire de gestion de projet agile — à relier à votre propre suivi de sprints (non vérifiable depuis le code).
- **MCD/MLD/MPD** : Modèle Conceptuel/Logique/Physique de Données — voir `MLD.md`/`MPD.sql`/`mcd.mermaid` à la racine du repo.
- **UML / Cas d'utilisation / Diagramme de séquence** : voir `diagrams/`.

**Frontend**
- **SSR** : rendu côté serveur (Next.js par défaut sur certaines pages).
- **CSR** : rendu côté client.
- **Pages Router** : routing par arborescence de fichiers dans `pages/` (utilisé ici, Next 13.4).
- **API Route** : endpoint serveur Next.js (`pages/api/coingecko/*` — proxy CoinGecko côté frontend).
- **Zustand** : librairie de state management légère — **listée en dépendance mais non utilisée réellement** (voir §1.2/§3.1).
- **Axios** : client HTTP utilisé côté frontend (`api/index.ts`, intercepteurs 401).

**Bridge Python**
- **spawn()** : lance un processus enfant avec des flux stdin/stdout/stderr (utilisé pour `pattern_detector.py`).
- **stdin/stdout** : entrée/sortie standard — canal de communication JSON NestJS↔Python.
- **child_process** : module Node.js pour lancer des processus externes.
- **JSON bridge** : format d'échange entre NestJS et Python (JSON sérialisé sur stdin, parsé depuis stdout).

---

## SECTION 6 — COMMANDES DE DÉMO LIVE

**Lancer le projet from scratch**
```bash
cd 08_Code_Base
docker compose up -d --build
cd backend-code && npm run migrate:deploy   # provisionne le schéma (12 tables)
```

**Montrer les tests qui passent**
```bash
cd backend-code
npm run test           # tous les *.spec.ts
npm run test:cov       # avec couverture (note : seuil non appliqué, voir §3.4)
```

**Montrer les logs du scheduler de signaux**
```bash
docker compose logs -f backend | grep -i "signal-scan\|runScan"
```

**Montrer une requête API (curl)**
```bash
# Health check
curl http://localhost:3001/health

# Login
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@alvio.io","password":"..."}'

# Marchés (avec token)
curl http://localhost:3001/markets/top -H "Authorization: Bearer <accessToken>"
```

**Montrer `docker compose ps`**
```bash
docker compose ps
# 9 services attendus : postgres, redis, backend, frontend, prometheus, grafana, elasticsearch, kibana, logstash
```

**Montrer Prisma Studio**
```bash
cd backend-code
npx prisma studio    # ouvre http://localhost:5555, navigue les 12 tables
```

**Montrer un import de stratégie PDF en live**
```bash
curl -X POST http://localhost:3001/strategies/import \
  -H "Authorization: Bearer <accessToken>" \
  -F "file=@ma_strategie.pdf" \
  -F "name=Ma Stratégie RSI" \
  -F "timeframe=1h"
```
Ou en live dans l'UI : `/strategies/import`, uploader un PDF, montrer le JSON de règles retourné par Claude et la stratégie créée dans `/strategies`.

---

*Document généré par analyse directe du code (branche `master`), pas par extrapolation depuis la documentation. En cas de doute pendant la soutenance, la réponse la plus sûre est toujours de pointer vers le fichier/ligne cité ici plutôt que de généraliser.*
