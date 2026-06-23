# Architecture Logicielle

---

## Vue d'ensemble

![Architecture globale Alvio](../img/architecture.png)

Alvio repose sur une architecture **en couches strictement séparées**, conforme
aux principes NestJS (Inversion of Control, injection de dépendances, modules
isolés). Chaque couche ne connaît que la couche immédiatement inférieure.

```
┌─────────────────────────────────────────────────────────┐
│  CLIENTS                                                │
│  Next.js :3000 (web)   React Native / Expo (mobile)    │
└────────────────────────┬────────────────────────────────┘
                         │ HTTPS + JWT Bearer / Cookie
┌────────────────────────▼────────────────────────────────┐
│  COUCHE ENTRÉE (NestJS :3001)                           │
│  Middleware : Helmet · CORS · CookieParser              │
│  Guards     : JwtAuthGuard · Passport-JWT · GitHub      │
│  Pipes      : ValidationPipe (class-validator) global   │
│  Controllers: 14 controllers, ~40 endpoints             │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│  COUCHE SERVICES MÉTIER                                 │
│  AuthService · StrategiesService · SignalsService       │
│  MarketsService · FormationService · SimulatorService   │
│  ReportsService · PortfolioService                      │
└──────┬───────────────────────┬──────────────────────────┘
       │                       │
┌──────▼───────┐   ┌───────────▼──────────────────────────┐
│  COUCHE       │   │  COUCHE INFRASTRUCTURE               │
│  DONNÉES      │   │  AIService (Claude claude-sonnet-4-6)│
│  PrismaService│   │  PatternDetectionService (spawn)     │
│  PostgreSQL 15│   │  RedisService (ioredis)              │
│  11 modèles   │   │  EmailService (nodemailer SMTP)      │
└───────────────┘   │  TOTPService · WebAuthnService       │
                    │  LoggingService · MetricsService     │
                    └──────────────────────────────────────┘
                         │                    │
               CoinGecko REST v3       Anthropic Claude API
               (via MarketsService)    (via AIService)
```

### Principes d'architecture appliqués

| Principe | Implémentation concrète |
|---|---|
| **Séparation des couches** | Controllers → ne font qu'appeler un service, jamais Prisma directement |
| **Injection de dépendances** | Tout est `@Injectable()` — constructeur typé, aucun `new Service()` en dehors du framework |
| **Services globaux** | `PrismaService` et `RedisService` décorés `@Global()` — disponibles sans import dans chaque module |
| **Modules isolés** | Chaque domaine métier est un `@Module()` indépendant (`AuthModule`, `MarketsModule`, etc.) |
| **Validation aux frontières** | `ValidationPipe({ whitelist: true, transform: true })` appliqué globalement — aucun champ non déclaré ne traverse les DTOs |

---

## Vue des endpoints (routes réelles)

### `/auth` — Authentification

| Méthode | Route | Guard | Description |
|---|---|---|---|
| POST | `/auth/register` | — | Inscription email/password |
| POST | `/auth/login` | — | Login → OTP email (preAuthToken) |
| POST | `/auth/magic-link/request` | — | Envoi magic link par email |
| POST | `/auth/magic-link/verify` | — | Vérification du token magic link |
| GET | `/auth/github` | Passport('github') | Redirection OAuth GitHub |
| GET | `/auth/github/callback` | Passport('github') | Callback → redirect frontend |
| POST | `/auth/2fa/verify` | — | Vérification OTP email (2ème facteur) |
| POST | `/auth/pin/verify` | — | Vérification PIN (3ème facteur) |
| POST | `/auth/pin/setup` | — | Configuration initiale du PIN |
| POST | `/auth/set-password` | — | Définition mot de passe (post-GitHub/MagicLink) |
| POST | `/auth/refresh` | Cookie | Rotation du refresh token (JTI) |
| POST | `/auth/logout` | — | Révocation du refresh token dans Redis |
| POST | `/auth/dev-login` | — | Login dev-only (désactivé en prod) |
| GET | `/auth/profile` | JwtAuthGuard | Profil de l'utilisateur connecté |

### `/strategies` — Stratégies de trading

| Méthode | Route | Description |
|---|---|---|
| GET | `/strategies` | Liste des stratégies de l'utilisateur |
| POST | `/strategies/:id/analyze` | Analyser une stratégie existante via Claude |
| POST | `/strategies/import` | Upload PDF → pdf-parse v2 → Claude → StrategyRules |

### `/signals` — Signaux de trading

| Méthode | Route | Description |
|---|---|---|
| GET | `/signals` | 50 derniers signaux de l'utilisateur |
| GET | `/signals/recent` | 5 signaux les plus récents |
| POST | `/signals` | Création manuelle d'un signal |
| GET | `/signals/statistics` | Statistiques globales |
| POST | `/signals/generate` | Génération via PatternDetectionService → spawn Python |
| POST | `/signals/scan-now` | Déclenchement immédiat du scheduler |

### `/markets` — Données de marché

| Méthode | Route | Cache Redis | Description |
|---|---|---|---|
| GET | `/markets` | 60 s | Top 20 cryptos (CoinGecko `/coins/markets`) |
| GET | `/markets/:id` | 30 s | Détail d'une crypto |
| GET | `/markets/:id/ohlcv` | Variable (60–1800 s) | Données OHLCV chandeliers ou line |

### `/formation` — LMS

| Méthode | Route | Description |
|---|---|---|
| GET | `/formation/courses` | Catalogue des cours publiés + progression |
| GET | `/formation/courses/:id` | Détail d'un cours + ses leçons |
| GET | `/formation/lessons/:id` | Contenu d'une leçon |
| POST | `/formation/progress` | Marquer une leçon comme complète |
| GET | `/formation/my-progress` | Progression globale de l'utilisateur |

### Autres endpoints

| Controller | Route | Description |
|---|---|---|
| SimulatorController | POST `/simulator/dca` | Simulation DCA (fixed / monte_carlo) |
| SimulatorController | GET `/simulator/history` | Historique des simulations |
| ReportsController | GET `/reports/:year/:month` | Rapport mensuel calculé |
| PortfolioController | GET `/portfolio/history` | Historique snapshots |
| PortfolioController | GET `/portfolio/stats` | Statistiques portefeuille |
| AIController | POST `/ai/analyze` | Analyse directe via Claude |
| AIController | POST `/ai/detect-patterns` | Détection patterns (debug) |
| AIController | POST `/ai/generate-signal` | Génération signal (debug) |
| TOTPController | POST `/mfa/totp/enroll` | Init enrôlement TOTP (QR code) |
| TOTPController | POST `/mfa/totp/verify` | Confirmation enrôlement |
| TOTPController | DELETE `/mfa/totp` | Désactivation TOTP |
| WebAuthnController | POST `/mfa/webauthn/register-options` | Options d'enregistrement FIDO2 |
| WebAuthnController | POST `/mfa/webauthn/register-verify` | Vérification enregistrement |
| WebAuthnController | POST `/mfa/webauthn/auth-options` | Options d'authentification |
| WebAuthnController | POST `/mfa/webauthn/auth-verify` | Vérification authentification |
| MetricsController | GET `/metrics` | Métriques Prometheus (IP restreinte) |
| AppController | GET `/health` | Healthcheck → 200 OK |

---

## Sécurité & sécurisation des endpoints

### Garde d'authentification — `JwtAuthGuard`

Toutes les routes métier (signaux, stratégies, marchés, formation, rapports,
simulateur, profil) sont protégées par `@UseGuards(JwtAuthGuard)`.

```typescript
// src/auth/guards/jwt-auth.guard.ts
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  // Passport-JWT extrait le token du header Authorization: Bearer <token>
  // Vérifie la signature + expiration (15 min)
  // Injecte { sub: userId, email } dans req.user
}
```

Seules les routes d'authentification (`/auth/register`, `/auth/login`,
`/auth/magic-link/*`, `/auth/2fa/verify`, `/auth/pin/verify`, `/auth/github`)
sont publiques.

### Authentification multi-facteurs (MFA)

Le système MFA est entièrement géré dans `AuthService` sans bibliothèque
d'identité tierce. Trois facteurs successifs selon la configuration :

```
Facteur 1 : email / password  → bcrypt.compare (12 rounds)
Facteur 2 : OTP 6 chiffres   → Redis preauth:{token} (TTL 600 s)
           OU TOTP RFC 6238  → otplib.totp.verify()
           OU Magic Link     → Redis magic:{token} (TTL 900 s)
           OU GitHub OAuth   → passport-github2
Facteur 3 : PIN bcrypt       → Redis pinauth:{token} (TTL 300 s)
           OU WebAuthn FIDO2 → @simplewebauthn/server (counter anti-replay)
```

### Verrouillage de compte

```typescript
// src/auth/auth.service.ts — seuils configurables via .env
// MAX_AUTH_FAILURES=3, LOCK_TTL_SECONDS=1800

private async recordFailure(userId: string, step: string, ip?: string): Promise<void> {
  const key   = `fail:${step}:${userId}`;
  const count = parseInt(await this.redis.get(key) ?? '0') + 1;
  await this.redis.set(key, count.toString(), this.lockTtl); // reset TTL à chaque échec
  if (ip) await this.redis.incr(`fail:ip:${ip}`);           // compteur IP
  if (count >= this.maxFailures) {
    await this.redis.set(`locked:${userId}`, 'true', this.lockTtl);
    this.logging.accountLocked(userId, ip);
    throw new HttpException('Compte bloqué temporairement', 423);
  }
}
```

### Tokens JWT — rotation JTI

```typescript
// src/auth/auth.service.ts
private async issueTokens(userId: string, email: string, res: Response): Promise<string> {
  const jti = crypto.randomUUID(); // identifiant unique du refresh token

  const accessToken = this.jwtService.sign(
    { sub: userId, email },
    { expiresIn: '15m' }            // access token court
  );
  const refreshToken = this.jwtService.sign(
    { sub: userId, jti },
    { expiresIn: '7d' }
  );

  await this.redis.set(`refresh:${jti}`, userId, 7 * 24 * 3600); // révocable

  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,   // non accessible en JavaScript
    secure:   true,   // HTTPS uniquement
    sameSite: 'strict',
    maxAge:   7 * 24 * 3600 * 1000,
  });

  return accessToken; // renvoyé dans le corps de la réponse
}
```

À chaque `POST /auth/refresh`, l'ancien `jti` est supprimé de Redis avant
l'émission d'un nouveau refresh token — garantissant la révocabilité unitaire.

---

## Gestion des vulnérabilités

### Injection SQL (SQLi)

**Traitement** : Prisma génère exclusivement des requêtes **paramétrées** —
aucune concaténation de chaîne dans les requêtes. Même si une entrée
utilisateur contient du SQL, elle est transmise comme valeur de paramètre
et jamais interpolée dans la requête.

```typescript
// Exemple — src/signals/signals.service.ts
// L'identifiant userId vient du JWT (pas de l'utilisateur directement)
const signals = await this.prisma.signal.findMany({
  where: { userId },   // Prisma génère : SELECT ... WHERE "userId" = $1
  orderBy: { createdAt: 'desc' },
  take: 50,
});
// Impossible d'injecter via userId car il est toujours extrait du token JWT signé
```

### Cross-Site Scripting (XSS)

**Traitement côté frontend (Next.js / React)** : React échappe automatiquement
toute valeur interpolée dans le JSX (`{value}` → entités HTML). Les données
de l'API (noms de stratégies, symboles d'actifs, résumés de rapport) sont
toujours rendues via des nœuds React, jamais via `dangerouslySetInnerHTML`.

**Côté backend** : le header `X-Content-Type-Options: nosniff` est positionné
par `Helmet` (middleware global NestJS) — empêche le MIME-sniffing utilisé
dans certaines variantes XSS.

```typescript
// src/main.ts
app.use(helmet());       // X-Content-Type-Options, X-Frame-Options, CSP de base
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
```

### Cross-Site Request Forgery (CSRF)

**Modèle d'auth** : l'access token JWT est stocké **en mémoire côté client**
(jamais dans `localStorage` ni dans un cookie accessible en JS). Le cookie
`refresh_token` est `httpOnly` + `SameSite: strict` — il n'est pas transmis
sur des requêtes cross-origin.

Les requêtes API authentifiées envoient le JWT dans le header
`Authorization: Bearer <token>` — un attaquant ne peut pas forger ce header
depuis un site tiers (la Same-Origin Policy l'en empêche).

**Résumé** : l'architecture sans token CSRF explicite est sécurisée car :
1. Le refresh cookie a `SameSite: strict` — non transmis cross-site
2. Le access token est en mémoire — inaccessible aux scripts tiers
3. Les mutations d'état (POST, PATCH, DELETE) requièrent le header JWT

### Autres protections actives

| Menace | Contre-mesure |
|---|---|
| Brute-force | Verrouillage Redis après 3 échecs (par userId + par IP) |
| Vol de refresh token | JTI rotation — révocable individuellement |
| Replay WebAuthn | Vérification du `counter` (croissance stricte) |
| Exposition clé TOTP | Secret chiffré AES-256-GCM en base — clé dérivée de `ENCRYPTION_KEY` |
| Enumération d'emails | Réponse identique si email existant ou non (`200 OK` + message générique) |
| Replay magic link | Suppression du token Redis à la première utilisation |

---

## Gestion des dépendances et configuration

### Variables d'environnement (`.env` backend)

```bash
# Base de données
DATABASE_URL="postgresql://brokeria_user:BrokerIA_SecurePass2026@localhost:5432/brokeria"

# JWT
JWT_SECRET=...              # secret de signature access + refresh tokens

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Auth
MAX_AUTH_FAILURES=3
LOCK_TTL_SECONDS=1800
FRONTEND_URL=http://localhost:3000

# APIs externes
ANTHROPIC_API_KEY=...       # clé API Claude
COINGECKO_API_KEY=...       # clé demo CoinGecko (header x-cg-demo-api-key)

# Email SMTP
SMTP_HOST=smtp.gmail.com
SMTP_USER=...
SMTP_PASS=...               # App Password Gmail (pas le mot de passe du compte)

# Sécurité MFA
ENCRYPTION_KEY=...          # 32 bytes hex — chiffrement AES-256-GCM des secrets TOTP
WEBAUTHN_RP_ID=localhost    # Relying Party ID WebAuthn
WEBAUTHN_ORIGIN=http://localhost:3000
```

### Dépendances backend critiques (versions réelles)

| Package | Version | Rôle |
|---|---|---|
| `@nestjs/common` | ^10.0.0 | Framework |
| `@prisma/client` | ^5.0.0 | ORM typé PostgreSQL |
| `@anthropic-ai/sdk` | **^0.100.1** | Claude API |
| `ioredis` | ^5.10.1 | Client Redis |
| `bcrypt` | ^5.1.0 | Hash password/PIN (12 rounds) |
| `pdf-parse` | **^2.4.5** | Parsing PDF (API classe v2) |
| `otplib` | ^12.0.1 | TOTP RFC 6238 |
| `@simplewebauthn/server` | ^10.0.1 | WebAuthn FIDO2 |
| `passport-github2` | ^0.1.12 | GitHub OAuth |
| `prom-client` | ^15.1.3 | Métriques Prometheus |
| `nodemailer` | ^8.0.2 | Envoi emails SMTP |
| `helmet` | inclus NestJS | Headers sécurité HTTP |
| `class-validator` | ^0.14.0 | Validation DTOs |
| `@nestjs/schedule` | ^6.1.3 | Scheduler cron (scan signaux 15 min) |

### Dépendances frontend critiques

| Package | Version | Rôle |
|---|---|---|
| `next` | **13.4.0** | Framework SSR (Pages Router) |
| `zustand` | ^4.5.7 | State management (auth store) |
| `axios` | ^1.4.0 | HTTP client + intercepteurs 401/refresh |
| `lightweight-charts` | **^4.2.3** | Graphiques OHLCV TradingView |
| `framer-motion` | ^12.34.1 | Animations |
| `@simplewebauthn/browser` | ^10.0.0 | WebAuthn côté navigateur |

---

## Workflow : parcours complet d'une requête

**Exemple : `GET /signals` — récupération des 50 derniers signaux**

### Étape 1 — Client (Next.js)

```typescript
// frontend-web/pages/signals/index.tsx (simplifié)
// Axios instance avec intercepteur 401 → auto-refresh
const { data } = await apiClient.get('/signals');
// Header automatiquement ajouté : Authorization: Bearer <accessToken>
```

### Étape 2 — Middleware stack (NestJS)

La requête traverse dans l'ordre :
1. `helmet()` — positionne les headers sécurité
2. `cors()` — vérifie l'origine contre `FRONTEND_URL`
3. `cookieParser()` — parse les cookies (pour le refresh path)
4. `JwtAuthGuard` → `PassportStrategy('jwt')` :
   - extrait le token du header `Authorization: Bearer`
   - vérifie la signature HMAC-SHA256 avec `JWT_SECRET`
   - vérifie l'expiration (< 15 min)
   - injecte `{ sub: userId, email }` dans `req.user`

### Étape 3 — Controller

```typescript
// src/signals/signals.controller.ts
@Get()
@UseGuards(JwtAuthGuard)
async getSignals(@GetUser('sub') userId: string) {
  // userId extrait du token JWT — jamais fourni par le client directement
  return this.signalsService.getUserSignals(userId);
}
```

### Étape 4 — Service

```typescript
// src/signals/signals.service.ts
async getUserSignals(userId: string): Promise<Signal[]> {
  return this.prisma.signal.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}
```

### Étape 5 — Prisma → PostgreSQL

Prisma génère et exécute :
```sql
SELECT id, "userId", asset, direction, status, entry_price, stop_loss,
       take_profit, exit_price, confidence, patterns, indicators,
       "createdAt", "closedAt"
FROM "Signal"
WHERE "userId" = $1          -- paramètre, jamais interpolé
ORDER BY "createdAt" DESC
LIMIT 50;
```

### Étape 6 — Réponse

Le tableau de `Signal[]` est sérialisé en JSON par NestJS et renvoyé avec
`Content-Type: application/json` et le code HTTP approprié (200).

Le frontend Zustand met à jour le store :
```typescript
// frontend-web/stores/signalStore.ts (simplifié)
const useSignalStore = create((set) => ({
  signals: [],
  fetchSignals: async () => {
    const { data } = await apiClient.get('/signals');
    set({ signals: data });
  },
}));
```

### Résumé du flux

```
Next.js         NestJS Middleware       Controller       Service      Prisma/PG
───────         ─────────────────       ──────────       ───────      ─────────
GET /signals ──► Helmet/CORS/Cookie
                ──► JwtAuthGuard
                    (verify JWT)
                ──────────────────────► getSignals()
                                        (userId from JWT)
                                        ────────────────► getUserSignals()
                                                          ──────────────► findMany()
                                                                          WHERE userId=$1
                                                          ◄── Signal[] ──
                                        ◄── Signal[] ────
                ◄── JSON 200 ──────────
◄── [signals] ──
```
