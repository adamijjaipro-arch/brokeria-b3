# Gestion de projet

---

## Contexte organisationnel

Alvio est un **projet solo** : conception, développement, tests et déploiement
sont assurés par une seule personne. La gestion de projet a donc été adaptée
en conséquence — sans réunions d'équipe, sans matrice RACI multi-acteurs,
mais avec une discipline personnelle rigoureuse sur le découpage en sprints,
la gestion du backlog et le suivi des risques.

---

## Méthodologie — Scrum adapté au solo

La méthode Scrum a été retenue pour sa structure itérative et sa capacité à
produire des incréments fonctionnels à intervalles réguliers. Les cérémonies
ont été allégées pour s'adapter au travail individuel :

| Cérémonie Scrum standard | Adaptation solo |
|---|---|
| Sprint Planning (équipe) | Sélection personnelle du backlog en début de sprint |
| Daily Scrum (15 min, équipe) | Note quotidienne (bloc-notes) : fait hier / à faire / bloquants |
| Sprint Review (demo équipe) | Auto-review : test des fonctionnalités du sprint sur l'environnement local |
| Sprint Retrospective | Analyse des écarts (durée estimée vs réelle) et ajustement du prochain sprint |
| Product Owner | Rôle assumé par moi-même — arbitrage des priorités selon la valeur métier |

**Durée des sprints** : 1 à 2 semaines selon la complexité du module traité.

---

## Product Breakdown Structure (PBS)

Le PBS décompose le produit Alvio en composants livrables indépendants :

```
ALVIO
├── 1. Backend API (NestJS)
│   ├── 1.1 Module Auth (email/password, Magic Link, GitHub, OTP, TOTP, WebAuthn, PIN)
│   ├── 1.2 Module Marchés (CoinGecko, cache Redis, OHLCV)
│   ├── 1.3 Module Stratégies (upload PDF, pdf-parse v2, analyse Claude)
│   ├── 1.4 Module Signaux (génération, scheduler 15 min, long-only)
│   ├── 1.5 Module Formation (Course / Lesson / UserProgress)
│   ├── 1.6 Module Simulateur (DCA fixed + monte_carlo)
│   ├── 1.7 Module Rapports (stats mensuelles par userId/year/month)
│   └── 1.8 Module Monitoring (Prometheus, Logging RFC 5424, Métriques)
│
├── 2. Application Web (Next.js)
│   ├── 2.1 Pages publiques (landing, login, register)
│   ├── 2.2 Dashboard
│   ├── 2.3 Pages Marchés (top 20 + graphique chandelier)
│   ├── 2.4 Pages Stratégies (liste, import PDF, analyse)
│   ├── 2.5 Pages Signaux (liste, détail)
│   ├── 2.6 Module Formation (liste cours, leçon, progression)
│   ├── 2.7 Simulateur DCA
│   ├── 2.8 Rapports mensuels
│   └── 2.9 Profil & Sécurité (MFA, 2FA, WebAuthn)
│
├── 3. Application Mobile (React Native / Expo)
│   ├── 3.1 Écran Login
│   ├── 3.2 Écran Dashboard
│   ├── 3.3 Écran Signaux
│   ├── 3.4 Écran Simulateur
│   └── 3.5 Écran Profil
│
├── 4. Module IA Python
│   ├── 4.1 Détection patterns chartistes (candlestick, chart, harmoniques, Elliott)
│   ├── 4.2 Calcul indicateurs (RSI, MACD, Bollinger, ATR, Stochastique, Ichimoku)
│   ├── 4.3 Scoring engine (confidence_score 0-100)
│   ├── 4.4 Bridge NestJS→Python (spawn stdin/stdout)
│   └── 4.5 Simulateur DCA Python (dca_simulator.py)
│
└── 5. Infrastructure
    ├── 5.1 Docker Compose (7 services)
    ├── 5.2 Prometheus + Grafana (17 panneaux)
    └── 5.3 ELK Stack (5 règles SIEM Kibana)
```

---

## Organisation du backlog — sprints réalisés

| Sprint | Durée | Objectif principal | Livrables clés |
|---|---|---|---|
| S1 | 2 sem. | Fondations backend | Prisma schema (11 modèles), PrismaService, RedisService, AppModule |
| S2 | 2 sem. | Authentification complète | AuthService (519 L), JWT JTI, MFA email OTP, PIN, TOTP, WebAuthn |
| S3 | 1 sem. | Marchés & cache | MarketsService, CoinGecko, cache Redis anti-429, stale fallback |
| S4 | 2 sem. | Strategy Engine IA | pdf-parse v2, AIService Claude (`claude-sonnet-4-6`), StrategyRules |
| S5 | 2 sem. | Module Python & signaux | 15 scripts Python, bridge `spawn`, SignalsService long-only, scheduler |
| S6 | 1 sem. | Formation & simulateur | FormationService, SimulatorService (Box-Muller), ReportsService |
| S7 | 1 sem. | Frontend web complet | 20+ pages Next.js, Zustand, intercepteurs Axios, lightweight-charts |
| S8 | 1 sem. | Application mobile | 5 écrans React Native / Expo, navigation Stack + Bottom Tabs |
| S9 | 1 sem. | Monitoring & tests | Prometheus, Grafana, ELK, 5 spec Jest, Vitest, test_ai_module.py |
| S10 | 1 sem. | Docker & finalisation | docker-compose.yml (7 services), README, dossier jury |

---

## Gestion des risques

| Risque | Probabilité | Impact | Mitigation appliquée |
|---|---|---|---|
| API CoinGecko → erreur 429 (rate limit) | Haute | Moyen | Cache Redis double-clé (TTL frais + TTL stale 1 h) |
| Claude API → réponse hors format JSON | Moyenne | Haut | `cleanJsonResponse()` + `validateStrategyRules()` + relance |
| TA-Lib introuvable sur la machine cible | Moyenne | Haut | Docker image avec TA-Lib compilé ; fallback numpy pur |
| Perte de données Redis (redémarrage) | Faible | Moyen | Sessions critiques persistées en base (AuthLog) ; Redis non persistant par choix |
| Dérive du périmètre (scope creep) | Haute (projet solo) | Moyen | Backlog figé après S4 ; features reportées en perspectives |
| Compilation TypeScript → erreurs Prisma | Réalisé | Haut | `npx prisma generate` intégré au `npm run build` ; types Prisma importés explicitement |
| Tests insuffisants sur les paths critiques | Réalisée | Haut | Jest seuil 70 % (branches, functions, lines, statements) |

---

## Outils de suivi

| Outil | Usage dans ce projet |
|---|---|
| **Git** (mono-repo) | Versionning de l'ensemble du code (backend, frontend, mobile, ai-module) |
| **Commits conventionnels** | `feat:`, `fix:`, `refactor:`, `test:` — historique lisible |
| **Bloc-notes personnel** | Backlog, notes de sprint, suivi des bloquants |
| **docker-compose** | Reproductibilité de l'environnement de dev/test en une commande |
| **Jest --coverage** | Vérification du seuil de couverture à chaque sprint |

---

## Bilan organisationnel

Travailler seul sur un projet de cette envergure impose une discipline stricte
sur deux points critiques :

1. **Découper avant de coder** — le PBS a permis d'identifier les dépendances
   entre modules (le Strategy Engine nécessite Redis opérationnel, le bridge Python
   nécessite les données OHLCV de MarketsService) et de les traiter dans le bon ordre.

2. **Accepter de reporter** — plusieurs fonctionnalités initialement prévues
   (`backtestStrategy`, `getPatternsHistory`, écran Markets mobile) ont été
   consciemment reportées en perspectives pour préserver la qualité des modules
   réalisés.
