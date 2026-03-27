# BrokerIA — Plateforme de Trading Intelligent avec IA

Plateforme complète de trading avec signaux IA, authentification MFA avancée, monitoring temps réel et intégration SIEM.

---

## Stack Technique

| Couche | Technologie | Port |
|--------|-------------|------|
| Frontend | Next.js 14 + TypeScript + Tailwind CSS | 3006 |
| Backend | NestJS + TypeScript + Prisma ORM | 3001 |
| Base de données | SQLite (dev) / PostgreSQL (prod) | 5432 |
| Cache / Sessions | Redis | 6379 |
| Monitoring | Prometheus + Grafana | 9090 / 3003 |
| SIEM | Elasticsearch + Kibana + Logstash | 9200 / 5601 / 514 |
| Mobile | React Native + Expo | — |
| IA | Python (patterns, indicateurs techniques) | — |

---

## Démarrage Rapide — Une seule commande

```bash
# Copier les variables d'environnement
cp .env.example .env
# Éditer .env avec vos secrets (JWT, SMTP, GitHub OAuth…)

# Démarrer toute la stack
docker-compose up -d
```

Services disponibles après démarrage :
- **Frontend** → http://localhost:3006
- **Backend API** → http://localhost:3001
- **Grafana** → http://localhost:3003 (admin / voir GRAFANA_PASSWORD dans .env)
- **Kibana SIEM** → http://localhost:5601
- **Prometheus** → http://localhost:9090

---

## Démarrage en Développement Local

### Prérequis
- Node.js 18+
- Docker Desktop (pour Redis, Elasticsearch…)

### 1. Redis (obligatoire)
```bash
docker start redis-brokeria
# ou si première fois :
docker run -d --name redis-brokeria -p 6379:6379 redis:alpine
```

### 2. Backend (NestJS)
```bash
cd backend-code
npm install
cp .env.example .env   # configurer DATABASE_URL, JWT_SECRET, SMTP…
npx prisma db push     # créer/sync la base SQLite
npm run start:dev      # http://localhost:3001
```

### 3. Frontend (Next.js)
```bash
cd frontend-web
npm install
# .env.local est déjà configuré (NEXT_PUBLIC_API_URL=http://localhost:3001)
npm run dev            # http://localhost:3006
```

---

## Architecture d'Authentification (MFA)

Le système implémente **3 facteurs** couvrant **3 catégories NIST** :

```
Facteur 1 — Connaissance   : Mot de passe (bcrypt 12 rounds) ou Magic Link
Facteur 2 — Possession     : OTP email 6 chiffres (TTL 10min, Redis)
                           + TOTP (RFC 6238, secret AES-256-GCM)
                           + WebAuthn/FIDO2 (clé hardware)
Facteur 3 — Inhérence      : WebAuthn avec userVerification=required (biométrie)
                           + PIN (bcrypt, token court-vécu)
```

**Méthodes de connexion disponibles :**
- Email + Mot de passe → OTP → PIN
- Magic Link (sans mot de passe) → OTP → PIN
- GitHub OAuth → OTP → PIN

**Protection contre les attaques :**
- Lockout configurable après `MAX_AUTH_FAILURES` tentatives (défaut: 3)
- Durée de verrouillage configurable via `LOCK_TTL_SECONDS` (défaut: 1800s)
- Détection IP suspecte via `MAX_IP_FAILURES` (défaut: 10 échecs/IP/heure)
- Tokens JWT à courte durée (access: 15min, refresh: 7j httpOnly cookie)
- JTI pour révocation immédiate des sessions

---

## Variables d'Environnement Importantes

```env
# Seuils de sécurité (configurables)
MAX_AUTH_FAILURES=3          # tentatives avant verrouillage compte
LOCK_TTL_SECONDS=1800        # durée verrouillage (30 min)
MAX_IP_FAILURES=10           # échecs par IP avant SUSPICIOUS_IP

# Secrets JWT (générer avec: openssl rand -hex 32)
JWT_SECRET=<64-hex-chars>
JWT_REFRESH_SECRET=<64-hex-chars>
TOTP_ENCRYPTION_KEY=<64-hex-chars>

# Email (SMTP Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre@gmail.com
SMTP_PASS=votre-app-password

# GitHub OAuth
GITHUB_CLIENT_ID=<depuis github.com/settings/apps>
GITHUB_CLIENT_SECRET=<depuis github.com/settings/apps>
GITHUB_CALLBACK_URL=http://localhost:3001/auth/github/callback

# URLs
FRONTEND_URL=http://localhost:3006
CORS_ORIGINS=http://localhost:3006

# SIEM
SYSLOG_HOST=logstash   # ou localhost en dev direct
SYSLOG_PORT=514
```

---

## Monitoring & Sécurité

### Prometheus + Grafana
Métriques exposées par le backend sur `/metrics` :

| Métrique | Type | Description |
|----------|------|-------------|
| `auth_attempts_total{factor,result}` | Counter | Tentatives auth par facteur |
| `auth_latency_seconds{factor}` | Histogram | Latence p95 par facteur |
| `active_sessions_total` | Gauge | Sessions Redis actives |
| `mfa_enrollments_total{factor,action}` | Counter | Enrôlements MFA |
| `account_locks_total` | Counter | Verrouillages brute-force |
| `http_errors_5xx_total{route}` | Counter | Erreurs serveur |

Dashboard Grafana pré-provisionné : `monitoring/grafana/dashboards/mfa-security.json`

### SIEM (Elasticsearch + Kibana + Logstash)

**Events journalisés (RFC 5424 via Syslog UDP) :**
- `AUTH_SUCCESS` / `AUTH_FAILURE` (facteur précisé)
- `MFA_ENROLLED` / `MFA_REVOKED`
- `ACCOUNT_LOCKED`
- `SESSION_CREATED` / `SESSION_EXPIRED`
- `SUSPICIOUS_IP` (déclenché automatiquement si IP dépasse le seuil)

**Règles de détection (5 règles) :** `monitoring/elasticsearch/detection-rules.ndjson`

| Règle | Sévérité | Déclencheur |
|-------|----------|-------------|
| Brute Force | HIGH | 5+ AUTH_FAILURE même user en 5min |
| MFA Bypass | CRITICAL | AUTH_SUCCESS password sans 2FA dans la minute |
| Hors-Horaire | MEDIUM | Connexion réussie entre 00h-05h UTC |
| IP Suspecte / Credential Stuffing | HIGH | 1 IP, 3+ comptes différents en 10min |
| Énumération comptes | MEDIUM | 5+ tentatives emails inconnus depuis 1 IP |

**Import des règles dans Kibana :**
```
Kibana → Security → Detection Rules → Import Rules → detection-rules.ndjson
```

---

## Tests

```bash
cd backend-code

# Lancer les tests
npm run test

# Avec couverture (objectif ≥ 70%)
npm run test:cov

# Tests en mode watch
npm run test:watch
```

Fichiers de tests :
- `src/auth/auth.service.spec.ts` — Flux register/login/2FA/PIN
- `src/logging/logging.service.spec.ts` — Logs JSON + Syslog
- `src/metrics/metrics.service.spec.ts` — Métriques Prometheus
- `src/mfa/totp/totp.service.spec.ts` — TOTP + chiffrement AES-256-GCM
- `src/mfa/webauthn/webauthn.service.spec.ts` — WebAuthn FIDO2

---

## Structure du Projet

```
08_Code_Base/
├── backend-code/          # NestJS API (port 3001)
│   ├── src/
│   │   ├── auth/          # Authentification + Passport.js
│   │   ├── mfa/           # TOTP + WebAuthn/FIDO2
│   │   ├── logging/       # Logs structurés + Syslog SIEM
│   │   ├── metrics/       # Prometheus prom-client
│   │   ├── redis/         # Cache + sessions
│   │   ├── email/         # Nodemailer SMTP
│   │   └── database/      # Prisma service
│   └── prisma/
│       └── schema.prisma
├── frontend-web/          # Next.js (port 3006)
│   ├── pages/
│   │   ├── auth/          # magic, 2fa, pin, totp, webauthn
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── api/index.ts       # Client Axios + intercepteurs JWT
│   └── context/authStore.ts  # Zustand (access token en mémoire)
├── monitoring/
│   ├── prometheus/        # prometheus.yml
│   ├── grafana/
│   │   ├── dashboards/    # mfa-security.json (17 panels)
│   │   └── provisioning/  # datasources + dashboards auto-chargés
│   ├── logstash/
│   │   └── pipeline/      # brokeria.conf (Syslog → Elasticsearch)
│   └── elasticsearch/
│       └── detection-rules.ndjson  # 5 règles SIEM
├── mobile/                # React Native + Expo
├── ai-module/             # Python patterns & indicateurs techniques
└── docker-compose.yml     # Stack complète en une commande
```

---

## Sécurité — Points Clés

- **Pas de tokens en localStorage** — access token en mémoire (Zustand), refresh token httpOnly cookie
- **Rotation JTI** — chaque refresh invalide l'ancien token (impossible de réutiliser un token volé)
- **TOTP chiffré** — secret stocké chiffré AES-256-GCM avec IV aléatoire par chiffrement
- **WebAuthn userVerification=required** — force biométrie / PIN device (facteur d'inhérence)
- **CORS strict** — configuré via `CORS_ORIGINS` env var
- **Validation DTOs** — class-validator sur tous les inputs

---

## Licence

MIT — Projet académique BrokerIA 2026
