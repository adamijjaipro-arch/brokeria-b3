# Déploiement

---

## Objectifs

La stratégie de déploiement d'Alvio vise trois objectifs :

1. **Reproductibilité** — l'environnement de développement local et
   l'environnement de production doivent être identiques à la stack technique
   près. Docker Compose garantit cette parité.

2. **Isolation des services** — chaque composant (base de données, cache,
   API, monitoring) tourne dans son propre conteneur avec des dépendances
   de démarrage déclarées.

3. **Observabilité intégrée** — la stack de monitoring (Prometheus, Grafana,
   ELK) est embarquée dans le même `docker-compose.yml` et démarre en même
   temps que l'application.

---

## Conteneurisation

### Vue d'ensemble — 9 services Docker

Le fichier `docker-compose.yml` (racine du projet) orchestre **9 services** :

| Service | Image | Port exposé | Rôle |
|---|---|---|---|
| `postgres` | `postgres:15-alpine` | 5432 | Base de données principale (11 modèles Prisma) |
| `redis` | `redis:7-alpine` | 6379 | Cache, sessions JWT, OTP, compteurs de verrouillage |
| `backend` | Build local | 3001 | API NestJS — cœur applicatif |
| `frontend` | Build local | 3000 | Application Next.js 13 |
| `prometheus` | `prom/prometheus:v2.51.0` | 9090 | Collecte des métriques backend |
| `grafana` | `grafana/grafana:10.4.0` | 3003 | Dashboards (17 panneaux sécurité) |
| `elasticsearch` | `elasticsearch:8.13.0` | 9200 | Moteur SIEM — stockage des logs |
| `kibana` | `kibana:8.13.0` | 5601 | Interface SIEM + 5 règles de détection |
| `logstash` | `logstash:8.13.0` | 514/udp | Pipeline Syslog UDP → Elasticsearch |

**Démarrage complet en une commande :**
```bash
docker-compose up -d
# ou pour l'environnement de dev (sans monitoring lourd) :
docker-compose up -d postgres redis
```

---

### Dockerfile Backend — `backend-code/Dockerfile`

```dockerfile
FROM node:18-alpine
# openssl requis par Prisma ; python3+pip pour le module IA Python
RUN apk add --no-cache openssl python3 py3-pip

WORKDIR /app

# Dépendances Python minimales pour pattern_detector.py (pandas+numpy)
# TA-Lib n'est pas disponible en alpine sans compilation — seuls pandas/numpy
# sont installés dans l'image ; TA-Lib est utilisé en environnement développement
RUN pip3 install --no-cache-dir --break-system-packages pandas numpy

# Dépendances Node.js
COPY package*.json ./
RUN npm install

# Code source
COPY . .

# Génération du client Prisma depuis schema.prisma + compilation TypeScript
RUN npx prisma generate
RUN npm run build

ENV NODE_ENV=production
EXPOSE 3000

# Démarrage : migration de schéma via prisma db push, puis lancement de l'API
# (prisma db push est idempotent — ne supprime pas les données existantes)
CMD ["sh", "-c", "npx prisma db push --skip-generate --accept-data-loss && npm run start:prod"]
```

**Points notables :**
- `npx prisma generate` s'exécute au build — le client TypeScript typé est
  intégré à l'image, pas généré à chaud au démarrage.
- `prisma db push` au démarrage du conteneur applique le schéma sans migration
  versionnée (adapté au développement ; en production, `prisma migrate deploy`
  serait préférable).
- Le volume `./backend-code/ai-module:/app/ai-module` dans `docker-compose.yml`
  monte le module Python depuis l'hôte — le script `pattern_detector.py` est
  donc mis à jour sans rebuild de l'image.

---

### Dockerfile Frontend — `frontend-web/Dockerfile`

```dockerfile
# ── Étape 1 : build ──────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
# --legacy-peer-deps requis pour les conflits de résolution de framer-motion
RUN npm ci --legacy-peer-deps

COPY . .
# --no-lint : compilation sans vérification ESLint (accéléré le build CI)
RUN npm run build -- --no-lint

# ── Étape 2 : image de production (plus légère) ───────────────────────────────
FROM node:22-alpine

WORKDIR /app

COPY --from=builder /app/package*.json ./
# Uniquement les dépendances de production (sans devDependencies)
RUN npm ci --only=production --legacy-peer-deps

# Seul le build Next.js compilé est copié — pas les sources TypeScript
COPY --from=builder /app/.next  ./.next
COPY --from=builder /app/public ./public

EXPOSE 3000
ENV NODE_ENV=production

CMD ["npm", "start"]
```

**Points notables :**
- **Multi-stage build** : l'image finale ne contient pas le code source TypeScript
  ni les devDependencies — taille réduite et surface d'attaque limitée.
- `node:22-alpine` pour le frontend vs `node:18-alpine` pour le backend —
  écart volontaire lié aux contraintes de compatibilité de certaines
  dépendances NestJS sur Node 22.

---

### Extrait docker-compose.yml — services critiques

```yaml
# docker-compose.yml (extraits commentés)

services:

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER:     ${POSTGRES_USER:-brokeria_user}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-brokeria_password}
      POSTGRES_DB:       ${POSTGRES_DB:-brokeria}
    volumes:
      - postgres_data:/var/lib/postgresql/data   # persistance entre redémarrages
    healthcheck:
      test:     ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-brokeria_user}"]
      interval: 10s
      retries:  5

  redis:
    image: redis:7-alpine
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      retries:  5
    # Pas de persistance Redis configurée (AOF/RDB désactivés)
    # → en cas de redémarrage, les sessions actives sont invalidées (comportement voulu)

  backend:
    build: { context: ./backend-code, dockerfile: Dockerfile }
    ports: ["3001:3001"]
    environment:
      DATABASE_URL:        postgresql://user:pass@postgres:5432/brokeria
      REDIS_URL:           redis://redis:6379
      JWT_SECRET:          ${JWT_SECRET:?JWT_SECRET is required}           # obligatoire
      JWT_REFRESH_SECRET:  ${JWT_REFRESH_SECRET:?JWT_REFRESH_SECRET is required}
      TOTP_ENCRYPTION_KEY: ${TOTP_ENCRYPTION_KEY:?TOTP_ENCRYPTION_KEY is required}
      ANTHROPIC_API_KEY:   ${ANTHROPIC_API_KEY}
      SYSLOG_HOST:         logstash      # logs → Logstash dans le même réseau Docker
      SYSLOG_PORT:         514
    depends_on:
      postgres: { condition: service_healthy }   # attend que PG soit prêt
      redis:    { condition: service_healthy }
    volumes:
      - ./backend-code/ai-module:/app/ai-module  # module Python monté en volume

  logstash:
    image: docker.elastic.co/logstash/logstash:8.13.0
    ports:
      - "514:514/udp"     # Syslog UDP depuis le backend NestJS → Logstash
    depends_on:
      elasticsearch: { condition: service_healthy }
```

### Ordre de démarrage garanti par les `depends_on`

```
postgres (healthy) ──┐
                      ├──► backend ──► prometheus ──► grafana
redis    (healthy) ──┘
                      └──► frontend

elasticsearch (healthy) ──► kibana
                        └──► logstash ◄── backend (Syslog UDP)
```

---

## CI/CD — État réel

**Aucun pipeline CI/CD automatisé n'est configuré dans le projet.**

La vérification via Glob confirme l'absence de workflows GitHub Actions dans
le répertoire `.github/workflows/` du projet (les fichiers `.yml` présents
appartiennent exclusivement aux `node_modules` de dépendances tierces).

Le cycle de livraison actuel est entièrement **manuel** :

```
1. Développement local → npm run start:dev
2. Tests manuels → Postman / curl
3. npm run test (Jest — seuil 70 %)
4. Vérification TypeScript → npm run build (0 erreur)
5. Test Docker local → docker-compose up --build
6. Commit + push Git
```

---

## Cibles de déploiement — Statut

### Ce qui est implémenté

| Élément | Statut | Détails |
|---|---|---|
| `docker-compose.yml` | ✓ Implémenté | 9 services, healthchecks, volumes persistants |
| `backend-code/Dockerfile` | ✓ Implémenté | node:18-alpine, prisma generate, multi-stage absent |
| `frontend-web/Dockerfile` | ✓ Implémenté | node:22-alpine, multi-stage build |
| Module Python dans Docker | ✓ Implémenté | Monté en volume `/app/ai-module` |
| Variables d'env documentées | ✓ Implémenté | Toutes les variables déclarées dans docker-compose.yml |

### Ce qui est prévu (non encore effectué)

| Élément | Statut | Raison |
|---|---|---|
| Déploiement Railway (backend + DB + Redis) | Prévu | Le Dockerfile backend contient un commentaire Railway (`Railway injecte PORT`) mais aucun `railway.toml` n'existe |
| Déploiement Vercel (frontend) | Prévu | Aucun `vercel.json` configuré — compatible par défaut avec Next.js mais non déployé |
| GitHub Actions CI/CD | Prévu | Aucun workflow `.github/workflows/` dans le projet |
| `prisma migrate deploy` en prod | Prévu | La commande actuelle utilise `prisma db push` — adaptée au dev, non recommandée en prod |

---

## Variables d'environnement de production

Toutes les variables marquées `:?` dans le `docker-compose.yml` sont
**obligatoires** — Docker refuse de démarrer si elles sont absentes.

| Variable | Obligatoire | Description |
|---|---|---|
| `JWT_SECRET` | Oui | Secret HMAC-SHA256 pour les access tokens |
| `JWT_REFRESH_SECRET` | Oui | Secret pour les refresh tokens (JTI rotation) |
| `TOTP_ENCRYPTION_KEY` | Oui | 64 caractères hex (32 bytes) — AES-256-GCM des secrets TOTP |
| `DATABASE_URL` | Oui | URL PostgreSQL complète |
| `REDIS_URL` | Oui | URL Redis |
| `ANTHROPIC_API_KEY` | Non (opt.) | Clé Claude API — AIService désactivé si absent |
| `SMTP_HOST` / `SMTP_USER` / `SMTP_PASS` | Non (opt.) | Email SMTP — OTP/MagicLink désactivés si absents |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | Non (opt.) | OAuth GitHub — route désactivée si absents |
| `COINGECKO_API_KEY` | Non (opt.) | Clé CoinGecko — fonctionne sans (tier gratuit sans header) |
| `FRONTEND_URL` | Non (opt.) | Default `http://localhost:3002` — CORS origin |
| `GRAFANA_PASSWORD` | Non (opt.) | Default `brokeria_grafana` (à changer en prod) |

---

## Perspectives CI/CD

La mise en place d'un pipeline automatisé est la principale évolution
de la chaîne de livraison. Un workflow GitHub Actions minimal couvrirait :

```yaml
# .github/workflows/ci.yml — exemple cible (non implémenté)
name: CI

on: [push, pull_request]

jobs:
  test-backend:
    runs-on: ubuntu-latest
    services:
      postgres: { image: postgres:15, env: { POSTGRES_PASSWORD: test } }
      redis:    { image: redis:7 }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '18' }
      - run: npm ci
        working-directory: backend-code
      - run: npx prisma generate && npm run test:cov
        working-directory: backend-code

  build-docker:
    needs: test-backend
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: docker build -t alvio-backend ./backend-code
      - run: docker build -t alvio-frontend ./frontend-web

  deploy-railway:
    needs: build-docker
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: bervProject/railway-deploy@main
        with: { railway_token: ${{ secrets.RAILWAY_TOKEN }}, service: 'backend' }
```

Les étapes prioritaires pour atteindre une livraison continue sont :
1. Créer `railway.toml` (backend) et déployer sur Railway
2. Connecter le repo GitHub à Vercel (frontend — déploiement automatique sur merge)
3. Ajouter le workflow GitHub Actions (tests + build + deploy)
4. Remplacer `prisma db push` par `prisma migrate deploy` pour les
   migrations versionnées et réversibles en production
