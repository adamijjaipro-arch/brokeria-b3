# Annexes

---

## A. Diagrammes

Les diagrammes ci-dessous ont été générés via le script
`/docs/diagrams/generate_all.py` (matplotlib 3.10.8, palette Alvio)
à partir des données réelles du projet (schema.prisma, controllers, services).

---

### A.1 — MCD — Modèle Conceptuel de Données

**Fichier** : `docs/img/mcd.png` *(voir page X)*

Représente les 11 entités du domaine Alvio et leurs associations sémantiques :
User, Signal, Strategy, Report, AuthLog, WebAuthnCredential, SimulationResult,
PortfolioSnapshot, Course, Lesson, UserProgress. Met en évidence le design
long-only (Signal.direction) et la nullable de AuthLog.userId.

---

### A.2 — MLD — Modèle Logique de Données

**Fichier** : `docs/img/mld.png` *(voir page X)*

Traduction relationnelle du MCD : clés primaires CUID, clés étrangères avec
actions référentielles (CASCADE / SetNull), contraintes UNIQUE composites
(`[userId, month, year]` sur Report et PortfolioSnapshot ;
`[userId, lessonId]` sur UserProgress).

---

### A.3 — MPD — Modèle Physique de Données

**Fichier** : `docs/img/mpd.png` *(voir page X)*

Types SQL PostgreSQL 15 (`CHAR(25)`, `FLOAT8`, `SMALLINT`, `TIMESTAMPTZ`,
`TEXT`), valeurs par défaut, index déclarés. Index composite critique sur
Signal : `[strategyId, asset, direction, status]` — utilisé par la
déduplication des signaux BUY OPEN.

---

### A.4 — Diagramme de Classes NestJS

**Fichier** : `docs/img/classes.png` *(voir page X)*

Architecture en 4 couches du backend Alvio : Controllers (14), Services
métier (AuthService, StrategiesService, SignalsService, MarketsService…),
Services infrastructure (AIService Claude, PatternDetectionService spawn,
TOTPService, WebAuthnService, LoggingService, MetricsService), Couche données
(PrismaService, RedisService, EmailService, APIs externes).

---

### A.5 — Diagramme de Cas d'Utilisation

**Fichier** : `docs/img/use_cases.png` *(voir page X)*

4 acteurs (Trader, Claude API, CoinGecko, SMTP) et 17 cas d'utilisation
couvrant l'authentification MFA (6 UC), les marchés (2 UC), les modules IA
(4 UC), la formation (2 UC) et les outils (3 UC). Frontière système délimitée.

---

### A.6 — Séquence — Création de Stratégie IA

**Fichier** : `docs/img/seq_strategy.png` *(voir page X)*

Flux en 14 étapes : upload PDF → Multer memoryStorage → pdf-parse v2
`PDFParse.getText()` (tronqué 15 000 chars) → Claude API `claude-sonnet-4-6`
→ `cleanJsonResponse()` + `validateStrategyRules()` → `Prisma.strategy.create()`
→ `spawn python3 pattern_detector.py` (stdin/stdout) → Signal BUY si
`ENTRY_SIGNAL`.

---

### A.7 — Séquence — Authentification Multi-Facteurs

**Fichier** : `docs/img/seq_auth.png` *(voir page X)*

3 phases successives : (1) email/password + `bcrypt.compare` + verrouillage
Redis après 3 échecs (`locked:{userId}`) ; (2) OTP email via `preauth:{token}`
Redis TTL 600 s ; (3) émission JWT avec rotation JTI (`refresh:{jti}` Redis 7 j
+ cookie `httpOnly SameSite:strict`).

---

### A.8 — Architecture Globale

**Fichier** : `docs/img/architecture.png` *(voir page X)*

Vue d'ensemble de l'écosystème Alvio : clients Next.js/React Native →
NestJS :3001 (middleware Helmet/CORS, 14 controllers, guards JWT) → PostgreSQL
15 / Redis 7 / Python spawn stdin/stdout → Claude API + CoinGecko REST →
stack monitoring (Prometheus :9090 + Grafana :3003 + ELK :9200/:5601/:514/udp).

---

## B. Extraits de code complets

### B.1 — SYSTEM_PROMPT complet — Claude Strategy Engine

Prompt système envoyé à `claude-sonnet-4-6` dans `AIService.analyzeStrategyDocument()`.
Définit le contrat de sortie JSON strict.

```
// src/ai/ai.service.ts — SYSTEM_PROMPT (variable constante)

Tu es un expert en analyse technique et en trading algorithmique.
Ton rôle est d'analyser les documents de stratégie de trading et d'en extraire
les règles de manière structurée.

IMPORTANT : Réponds UNIQUEMENT avec un objet JSON valide, sans texte supplémentaire,
sans balises markdown, sans explication. Structure exacte requise :

{
  "name": "string — nom court de la stratégie",
  "description": "string — résumé en 1-2 phrases",
  "asset": "string — actif principal (ex: BTC, ETH, SOL)",
  "timeframe": "string — timeframe principal (15m | 1h | 4h | 1d)",
  "entry_conditions": [
    "string — condition d'entrée 1 (ex: RSI < 30)",
    "string — condition d'entrée 2 (ex: EMA20 > EMA50)"
  ],
  "exit_conditions": [
    "string — condition de sortie 1 (ex: RSI > 70)",
    "string — condition de sortie 2 (ex: prix atteint take_profit)"
  ],
  "indicators": [
    { "name": "string — nom de l'indicateur", "params": { "period": number } }
  ],
  "risk_management": {
    "stop_loss_percent": number,
    "take_profit_percent": number,
    "max_position_size": number
  },
  "confidence_score": number  // 0 à 100 — ta confiance dans l'extraction
}

Si le document ne contient pas de stratégie de trading exploitable,
retourne confidence_score: 0 et des tableaux vides.
```

---

### B.2 — Format JSON complet échangé via le bridge Python

Entrée envoyée par `PatternDetectionService` sur stdin, et sortie reçue sur stdout.

```json
// Entrée (NestJS → pattern_detector.py, via stdin)
{
  "ohlcv": [
    { "time": 1717200000, "open": 67420.5, "high": 68100.0, "low": 67100.0, "close": 67850.0, "volume": 1842.3 },
    { "time": 1717203600, "open": 67850.0, "high": 68400.0, "low": 67600.0, "close": 68200.0, "volume": 2104.7 }
  ],
  "strategy_rules": {
    "name": "RSI Mean Reversion",
    "entry_conditions": ["RSI < 30", "EMA20 > EMA50"],
    "exit_conditions": ["RSI > 70"],
    "indicators": [
      { "name": "RSI",  "params": { "period": 14 } },
      { "name": "EMA",  "params": { "period": 20 } },
      { "name": "EMA",  "params": { "period": 50 } }
    ],
    "risk_management": { "stop_loss_percent": 2, "take_profit_percent": 6 },
    "confidence_score": 87
  },
  "asset": "BTC",
  "timeframe": "1h"
}

// Sortie (pattern_detector.py → NestJS, via stdout)
{
  "global_status": "ENTRY_SIGNAL",
  "confidence_score": 84.7,
  "patterns": ["bullish_engulfing", "hammer", "rsi_oversold"],
  "indicators": {
    "rsi":    { "value": 28.4,    "signal": "oversold" },
    "ema_20": { "value": 67200.0, "signal": "above_ema50" },
    "ema_50": { "value": 66800.0 },
    "macd":   { "value": 120.5,   "signal": 85.2, "histogram": 35.3 },
    "atr":    { "value": 850.0 }
  },
  "entry_price":  67850.0,
  "stop_loss":    66493.0,
  "take_profit":  71923.0,
  "risk_reward":  4.0
}
```

---

### B.3 — Variables d'environnement complètes (template `.env` backend)

```bash
# ── Base de données ────────────────────────────────────────────────────────────
DATABASE_URL="postgresql://brokeria_user:BrokerIA_SecurePass2026@localhost:5432/brokeria"

# ── JWT ────────────────────────────────────────────────────────────────────────
JWT_SECRET="<min 64 chars random hex>"
JWT_REFRESH_SECRET="<min 64 chars random hex, différent de JWT_SECRET>"
JWT_EXPIRATION="15m"
JWT_REFRESH_EXPIRATION="7d"

# ── Redis ──────────────────────────────────────────────────────────────────────
REDIS_HOST="localhost"
REDIS_PORT=6379

# ── Authentification ───────────────────────────────────────────────────────────
MAX_AUTH_FAILURES=3
LOCK_TTL_SECONDS=1800
FRONTEND_URL="http://localhost:3000"
CORS_ORIGINS="http://localhost:3000"

# ── GitHub OAuth ───────────────────────────────────────────────────────────────
GITHUB_CLIENT_ID="<app id GitHub>"
GITHUB_CLIENT_SECRET="<app secret GitHub>"
GITHUB_CALLBACK_URL="http://localhost:3001/auth/github/callback"

# ── Email SMTP ─────────────────────────────────────────────────────────────────
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="<adresse gmail>"
SMTP_PASS="<App Password Gmail — pas le mot de passe du compte>"

# ── MFA TOTP ───────────────────────────────────────────────────────────────────
TOTP_ENCRYPTION_KEY="<64 hex chars = 32 bytes AES-256>"
# Génération : node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# ── WebAuthn ───────────────────────────────────────────────────────────────────
WEBAUTHN_RP_NAME="Alvio"
WEBAUTHN_RP_ID="localhost"           # domaine en prod : alvio.io
WEBAUTHN_ORIGIN="http://localhost:3000"

# ── APIs externes ──────────────────────────────────────────────────────────────
ANTHROPIC_API_KEY="sk-ant-..."
COINGECKO_API_KEY="CG-..."           # optionnel (tier gratuit sans clé)

# ── Monitoring ──────────────────────────────────────────────────────────────────
SYSLOG_HOST="localhost"              # "logstash" dans Docker
SYSLOG_PORT=514
METRICS_ALLOWED_IPS="127.0.0.1,::1"

# ── Application ────────────────────────────────────────────────────────────────
NODE_ENV="development"               # "production" dans Docker
PORT=3001
APP_NAME="brokeria"
```

---

### B.4 — Commandes de démarrage — référence rapide

```bash
# ── Environnement complet Docker ──────────────────────────────────────────────
docker-compose up -d                        # démarre les 9 services
docker-compose up -d postgres redis         # dev minimal (sans monitoring)
docker-compose logs -f backend              # logs en temps réel

# ── Développement local (sans Docker) ─────────────────────────────────────────
# Backend
cd backend-code
npx prisma generate                         # génère le client Prisma
npx prisma db push                          # applique le schéma (dev)
npm run start:dev                           # NestJS avec hot-reload (:3001)

# Frontend
cd frontend-web
npm run dev                                 # Next.js dev server (:3000)

# Mobile
cd mobile
npx expo start                              # Expo dev server

# ── Tests ─────────────────────────────────────────────────────────────────────
cd backend-code
npm run test                                # Jest (unitaires)
npm run test:cov                            # Jest + rapport de couverture (seuil 70 %)

cd frontend-web
npm run test                                # Vitest + RTL

cd ai-module
python test_ai_module.py                    # unittest Python

# ── Diagrammes ────────────────────────────────────────────────────────────────
cd docs/diagrams
python generate_all.py                      # régénère les 8 PNG dans /docs/img/

# ── Génération du rapport PDF ─────────────────────────────────────────────────
cd docs
python build_pdf.py                         # produit /docs/RAPPORT_PROJET_ALVIO.pdf
```
