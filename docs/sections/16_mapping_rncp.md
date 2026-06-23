# Mapping des Blocs de Compétences RNCP 37873 — CDA

> **Titre** : Concepteur Développeur d'Applications — RNCP 37873 — Niveau 6
> **Candidat** : Adam Ijjai — Promotion 2025-2026
> **Projet** : Alvio — Plateforme de trading propulsée par IA

Ce tableau de correspondance relie chaque compétence du référentiel RNCP 37873
à une section du présent dossier et à un élément technique réel du projet Alvio.
Les compétences partiellement couvertes sont signalées honnêtement.

---

## Bloc 1 — Développer une application sécurisée

### CP1 — Installer et configurer son environnement de travail en fonction du projet

| Compétence | Preuves dans ce dossier | Éléments techniques réels |
|---|---|---|
| Choisir et installer les outils de développement adaptés au projet | §04 Gestion de projet | Node.js 18, Python 3, Expo CLI, Prisma CLI, Docker Desktop |
| Configurer un environnement de développement local reproductible | §13 Déploiement | `docker-compose.yml` — `docker-compose up -d postgres redis` lance l'environnement complet en une commande |
| Gérer les versions avec un SCM | §04 Gestion de projet | Git mono-repo, commits conventionnels (`feat:`, `fix:`, `refactor:`) |
| Configurer les variables d'environnement sensibles | §08 Architecture, §13 Déploiement | `.env` backend (DATABASE_URL, JWT_SECRET, ANTHROPIC_API_KEY, TOTP_ENCRYPTION_KEY) — variables obligatoires marquées `:?` dans docker-compose.yml |

---

### CP2 — Développer des interfaces utilisateur

| Compétence | Preuves dans ce dossier | Éléments techniques réels |
|---|---|---|
| Développer des interfaces web responsive | §05 UI/UX, §09 Application Web | Next.js 13 Pages Router, Tailwind CSS, 20+ pages (dashboard, markets, signaux, formation, simulateur, MFA) |
| Intégrer une charte graphique cohérente | §05 UI/UX | Palette Alvio (amber #f59e0b, vert #10b981, navy #0f172a, violet #6366f1), glassmorphism, framer-motion |
| Développer une interface mobile native | §10 Application Mobile | React Native 0.72.3 / Expo 49 — 5 écrans (Login, Dashboard, Signals, Simulator, Profile), navigation Stack + Bottom Tabs |
| Afficher des données graphiques interactives | §09 Application Web | `lightweight-charts 4.2.3` (TradingView) — graphiques chandeliers OHLCV avec fallback line chart |
| Respecter les principes d'accessibilité | §05 UI/UX | Contraste > 7:1 (WCAG AA), aria-labels sur icônes, navigation clavier |

---

### CP3 — Développer des composants métier

| Compétence | Preuves dans ce dossier | Éléments techniques réels |
|---|---|---|
| Développer la logique métier côté serveur | §08 Architecture, §11 Module IA | NestJS 10 — services modulaires (AuthService 519L, StrategiesService, SignalsService, MarketsService…) |
| Intégrer une API LLM pour le traitement du langage | §11 Module IA | `AIService.analyzeStrategyDocument()` → Claude API `claude-sonnet-4-6`, max_tokens 4096, SYSTEM_PROMPT JSON strict |
| Développer un bridge inter-processus vers un module Python | §11 Module IA | `PatternDetectionService` → `spawn('python3', ['pattern_detector.py'], { stdio: ['pipe','pipe','pipe'] })` — entrée/sortie JSON via stdin/stdout |
| Implémenter des algorithmes de trading et d'analyse technique | §11 Module IA | 15 scripts Python (RSI, MACD, Bollinger, ATR, Ichimoku, Elliott, harmoniques Gartley/Butterfly/Bat/Crab, scoring engine) |
| Développer un simulateur financier | §09 App Web, §10 App Mobile, §11 IA | `SimulatorService` — DCA mode `fixed` (déterministe) et `monte_carlo` (Box-Muller Gaussian) |
| Implémenter un système de signaux de trading | §11 Module IA | `SignalsService` — design long-only, déduplication, cycle OPEN→CLOSED, scheduler `@Cron('*/15 * * * *')` |
| Développer un module de formation (LMS) | §09 Application Web | `FormationService` — Course/Lesson/UserProgress, types VIDEO/ARTICLE/QUIZ, progression par utilisateur |
| Générer des rapports calculés à la demande | §11 Module IA | `ReportsService.getMonthlyStats()` — win rate, P&L estimé, patterns détectés, indicateurs utilisés |

---

### CP4 — Contribuer à la gestion d'un projet informatique

| Compétence | Preuves dans ce dossier | Éléments techniques réels |
|---|---|---|
| Planifier et découper un projet en itérations | §04 Gestion de projet | Scrum solo — 10 sprints documentés (S1 Fondations → S10 Finalisation) |
| Identifier et gérer les risques projet | §04 Gestion de projet | 7 risques documentés (429 CoinGecko, réponse Claude malformée, TA-Lib, dérive de périmètre…) avec mitigation effective |
| Produire de la documentation technique | §01-§16 (ce dossier) | DONNEES_REELLES.md, PLAN.md, sections `/docs/sections/`, diagrammes `/docs/img/` |
| Gérer le backlog et les priorités en solo | §04 Gestion de projet | PBS complet (5 branches), backlog figé après S4, features reportées explicitement en perspectives |

---

## Bloc 2 — Concevoir et développer une application sécurisée organisée en couches

### CP5 — Analyser les besoins et maquetter une application

| Compétence | Preuves dans ce dossier | Éléments techniques réels |
|---|---|---|
| Identifier les acteurs et les cas d'utilisation | §07 UML | Diagramme use_cases.png — 4 acteurs (Trader, Claude API, CoinGecko, SMTP), 17 cas d'utilisation |
| Produire des zonings et wireframes | §05 UI/UX | Zonings ASCII pour Dashboard, page Marchés, Import PDF, 2 écrans mobiles (Dashboard, Simulator) |
| Définir une charte graphique | §05 UI/UX | Palette 6 couleurs, glassmorphism, framer-motion, ionicons |
| Formaliser la problématique et les livrables | §03 Introduction | Problématique en 3 défis, tableau des 5 livrables avec versions réelles, vue d'ensemble ASCII |

---

### CP6 — Définir l'architecture logicielle d'une application

| Compétence | Preuves dans ce dossier | Éléments techniques réels |
|---|---|---|
| Concevoir une architecture en couches | §08 Architecture, §07 UML | 4 couches NestJS documentées (Controllers → Services → Infra → Data) ; classes.png |
| Choisir et justifier les patterns architecturaux | §08 Architecture | IoC/DI NestJS, modules isolés (`@Module`), services globaux (`@Global()`), `ValidationPipe` whitelist |
| Concevoir le flux de données entre les composants | §07 UML, §11 IA | Diagrammes de séquence seq_strategy.png (PDF→Claude→Signal) et seq_auth.png (MFA 3 phases) |
| Sécuriser les échanges entre couches | §08 Architecture | JWT Bearer en header (pas URL), cookie `httpOnly SameSite:strict`, Prisma requêtes paramétrées, Helmet |
| Concevoir l'architecture globale multi-couches | §08 Architecture | architecture.png — Next.js → NestJS → PostgreSQL/Redis + Python spawn + Claude API + CoinGecko |

---

### CP7 — Concevoir et mettre en place une base de données relationnelle

| Compétence | Preuves dans ce dossier | Éléments techniques réels |
|---|---|---|
| Produire un dictionnaire de données | §06 BDD | 11 tables documentées — champs, types SQL réels, contraintes, valeurs par défaut |
| Modéliser le MCD | §06 BDD | mcd.png — 11 entités, cardinalités réelles, choix de design (AuthLog.userId nullable, long-only Signal) |
| Produire le MLD | §06 BDD | mld.png — PK CUID, FK avec `CASCADE`/`SetNull`, contraintes UNIQUE (userId+month+year, userId+lessonId) |
| Produire le MPD | §06 BDD | mpd.png — types PostgreSQL 15, index composites (`[strategyId,asset,direction,status]`), `FLOAT8`, `SMALLINT` |
| Justifier les choix de conception | §06 BDD | CUID vs entiers séquentiels (sécurité), JSON en TEXT (compat. SQLite dev), SetNull vs CASCADE pour UserProgress |

---

### CP8 — Développer des composants d'accès aux données SQL et NoSQL

| Compétence | Preuves dans ce dossier | Éléments techniques réels |
|---|---|---|
| Implémenter des requêtes SQL via un ORM | §08 Architecture, §11 IA | Prisma v5 — `findMany`, `findFirst`, `create`, `update`, `upsert` — requêtes paramétrées (anti-SQLi natif) |
| Utiliser des index pour optimiser les requêtes | §06 BDD | Index `[userId]`, `[asset]`, `[strategyId,asset,direction,status]` — déduplication en O(log n) |
| Implémenter un cache Redis (NoSQL clé-valeur) | §08 Architecture, §09 App Web | `RedisService` (ioredis) — double clé fraîche + stale (anti-429), sessions JWT (refresh:{jti}), verrouillage (locked:{userId}) |
| Gérer les migrations de schéma | §13 Déploiement | `prisma db push` (dev) — `prisma migrate deploy` identifié comme amélioration prod |
| Implémenter des contraintes d'intégrité | §06 BDD | `@unique`, `@default`, FK avec actions référentielles, `@@unique([userId, month, year])` |

---

## Bloc 3 — Préparer le déploiement d'une application sécurisée

### CP9 — Préparer et exécuter les plans de tests d'une application

| Compétence | Preuves dans ce dossier | Éléments techniques réels |
|---|---|---|
| Rédiger des tests unitaires pour les services critiques | §12 Tests | 5 fichiers Jest — AuthService (login/lockout/2FA/PIN), TOTPService (AES-256-GCM), LoggingService, MetricsService, WebAuthnService |
| Tester les composants UI | §12 Tests | Vitest + @testing-library/react — `SignalCard.test.tsx` (BUY/CLOSED/confidence/long-only) |
| Tester les modules Python | §12 Tests | `test_ai_module.py` — RSI bornes, DCA fixed déterministe vs monte_carlo stochastique |
| Définir un seuil de couverture | §12 Tests | Jest `coverageThreshold: 70 %` (branches, functions, lines, statements) |
| ⚠ Tests d'intégration HTTP (Supertest) | *Partiellement couvert* | **Non implémentés** dans la version actuelle — présentés en perspectives (§12), flux validés manuellement via Postman/cURL |

---

### CP10 — Préparer et documenter le déploiement d'une application

| Compétence | Preuves dans ce dossier | Éléments techniques réels |
|---|---|---|
| Rédiger les Dockerfiles de l'application | §13 Déploiement | `backend-code/Dockerfile` (node:18-alpine, prisma generate, python3+pandas+numpy) et `frontend-web/Dockerfile` (multi-stage node:22-alpine) |
| Orchestrer les services avec Docker Compose | §13 Déploiement | `docker-compose.yml` — 9 services, healthchecks, volumes persistants, dépendances déclarées |
| Documenter les variables d'environnement | §13 Déploiement | Tableau complet des variables obligatoires/optionnelles, valeurs par défaut, descriptions |
| Documenter l'architecture de déploiement | §08 Architecture, §13 Déploiement | Vue d'ensemble schéma ASCII, ports exposés, réseau Docker interne (backend→logstash via SYSLOG_HOST) |
| ⚠ Déploiement effectif sur une plateforme cloud | *Prévu* | **Non encore déployé** — Railway (backend) et Vercel (frontend) identifiés comme cibles, Dockerfiles compatibles, mais `railway.toml` et `vercel.json` absents |

---

### CP11 — Contribuer à la mise en production dans une démarche DevOps

| Compétence | Preuves dans ce dossier | Éléments techniques réels |
|---|---|---|
| Mettre en place une observabilité applicative | §08 Architecture, §13 Déploiement | Prometheus `prom/prometheus:v2.51.0` — scrape `/metrics` toutes les 15 s, 4 compteurs + 1 histogram + 1 gauge |
| Mettre en place des dashboards de métriques | §13 Déploiement | Grafana `grafana/grafana:10.4.0` — 17 panneaux (authentification, MFA, latence, sessions actives) |
| Implémenter un pipeline de logs centralisé | §08 Architecture, §13 Déploiement | RFC 5424 Syslog UDP → Logstash → Elasticsearch 8.13.0 — index `brokeria-security-YYYY.MM.DD` |
| Définir des règles de détection SIEM | §13 Déploiement | Kibana — 5 règles de détection (brute-force, compte verrouillé, IP suspecte, anomalie auth, rejeu) |
| Implémenter un audit trail d'authentification | §08 Architecture | `LoggingService` → `Prisma.authLog.create()` + Syslog UDP — chaque tentative tracée avec userId, action, résultat, IP |
| ⚠ Pipeline CI/CD automatisé | *Prévu* | **Non implémenté** — aucun workflow `.github/workflows/` dans le projet ; cycle de livraison manuel documenté en §13 ; workflow GitHub Actions cible décrit en perspectives |

---

## Synthèse par bloc

| Bloc | Compétences | Pleinement démontrées | Partiellement | Non couvertes |
|---|---|---|---|---|
| **Bloc 1** — Développement sécurisé | 16 | 14 | 0 | 2 (`backtestStrategy`, `getPatternsHistory` non fonctionnels) |
| **Bloc 2** — Conception en couches | 15 | 15 | 0 | 0 |
| **Bloc 3** — Déploiement | 11 | 8 | 3 | 0 |

Les 3 compétences partiellement couvertes du Bloc 3 (tests d'intégration HTTP,
déploiement cloud effectif, CI/CD automatisé) sont documentées en tant que
**perspectives d'évolution** dans les sections correspondantes du dossier.
Elles ne sont pas revendiquées comme réalisées.

---

## Points forts de la démonstration

Pour le jury, les éléments les plus significatifs au regard du niveau 6 (Bac+4)
sont les suivants :

| Élément | Niveau de complexité | Référence |
|---|---|---|
| Système MFA complet from scratch (OTP, TOTP AES-256-GCM, WebAuthn FIDO2, PIN, Magic Link, GitHub OAuth) | Élevé | §08, §07 seq_auth.png |
| Bridge NestJS→Python via `spawn` stdin/stdout avec données OHLCV | Élevé | §11, `pattern-detection.service.ts` |
| Intégration Claude API avec prompt engineering et validation de réponse JSON | Élevé | §11, `ai.service.ts` |
| Architecture en 4 couches NestJS avec 14 controllers, 40+ endpoints, modules isolés | Élevé | §08, classes.png |
| Stack monitoring complète (Prometheus + Grafana 17 panneaux + ELK + 5 règles SIEM) | Élevé | §13, docker-compose.yml |
| BDD PostgreSQL 11 modèles conçus depuis le MCD jusqu'au MPD avec index optimisés | Moyen-élevé | §06, mcd/mld/mpd.png |
| Cache Redis anti-429 double clé (TTL frais + stale 1h) | Moyen | §08, `markets.service.ts` |
| Application mobile React Native / Expo avec 5 écrans fonctionnels | Moyen | §10 |
