# À propos de moi

---

## Profil

Je suis développeur fullstack en formation **Concepteur Développeur d'Applications**
(CDA — RNCP 37873, Niveau 6), avec une appétence marquée pour les architectures
backend complexes, l'intelligence artificielle appliquée et la sécurité logicielle.

Alvio est mon projet de titre : je l'ai conçu, développé et déployé seul, de la
modélisation de la base de données jusqu'à l'application mobile, en passant par
un module IA Python intégré via bridge `spawn`.

---

## Compétences techniques mobilisées dans ce projet

### Backend & API
- **NestJS 10** (TypeScript) — architecture modulaire en couches (controllers,
  services, guards, strategies Passport)
- **Prisma v5** — ORM typé sur PostgreSQL 15, 11 modèles, migrations gérées
- **Redis 7** via `ioredis` — cache anti-429, gestion des sessions, compteurs
  de verrouillage
- **JWT** avec rotation JTI — access token 15 min en mémoire + refresh token 7 j
  en cookie httpOnly

### Frontend & Mobile
- **Next.js 13** (Pages Router) avec `Zustand` pour le state et `Axios` pour
  les appels API (intercepteurs 401 / refresh automatique)
- **lightweight-charts 4.2.3** (TradingView) pour les graphiques OHLCV
- **React Native 0.72.3 / Expo 49** — application mobile avec navigation
  Stack + Bottom Tabs, 5 écrans fonctionnels

### Intelligence artificielle
- **Claude API** (`claude-sonnet-4-6`) — analyse de documents PDF de stratégie
  et extraction de règles JSON structurées
- **Python** (pandas 2.0.3, numpy 1.24.3, TA-Lib 0.4.27, scikit-learn 1.3.0) —
  15 scripts d'analyse technique, appelés via bridge `spawn` stdin/stdout depuis
  NestJS
- Indicateurs implémentés : RSI, MACD, Stochastique, Bandes de Bollinger, ATR,
  Ichimoku, ondes d'Elliott, patterns harmoniques (Gartley, Butterfly, Bat, Crab)

### Sécurité & Authentification
- **Multi-facteurs** (MFA) : OTP par email, TOTP (RFC 6238, chiffré AES-256-GCM),
  WebAuthn FIDO2 (`@simplewebauthn/server`), PIN haché bcrypt
- Verrouillage de compte configurable (`MAX_AUTH_FAILURES=3`, `LOCK_TTL_SECONDS=1800`)
  géré dans Redis
- Audit trail complet dans la table `AuthLog` + export RFC 5424 Syslog UDP → Logstash

### DevOps & Observabilité
- **Docker Compose** — 7 services orchestrés (postgres, redis, backend, frontend,
  prometheus, grafana, logstash)
- **Prometheus + Grafana** — 17 panneaux de métriques sécurité
- **ELK Stack** (Elasticsearch 8, Logstash, Kibana) — 5 règles SIEM de détection

---

## Choix pédagogiques

Ce projet a délibérément évité les raccourcis :

- Pas de service d'authentification tiers (pas d'Auth0, pas de Firebase Auth) —
  l'ensemble du système MFA est implémenté from scratch pour maîtriser chaque
  mécanisme.
- Pas de ORM "magic" caché derrière une abstraction — Prisma est utilisé
  directement, avec des requêtes typées et des index optimisés.
- Le bridge Python n'utilise pas `child_process.exec` mais `spawn` avec
  `stdio: ['pipe','pipe','pipe']` pour une meilleure gestion des flux et de
  la mémoire.

Ces choix génèrent plus de complexité, mais ils correspondent précisément aux
attendus d'un Concepteur Développeur d'Applications de niveau 6 : concevoir
des architectures robustes, sécurisées, et maintenables.
