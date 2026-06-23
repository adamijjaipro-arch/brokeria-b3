# Introduction

---

## Contexte

Le trading de cryptomonnaies est aujourd'hui accessible à tous, mais les outils
d'analyse technique restent l'apanage des traders expérimentés ou des équipes
disposant de ressources importantes. Un trader individuel dispose rarement d'un
système capable de surveiller les marchés en continu, de détecter des patterns
complexes (formations chartistes, ondes d'Elliott, patterns harmoniques) et
d'émettre des alertes exploitables en temps réel.

Par ailleurs, les Large Language Models (LLM) comme Claude ont rendu possible
une nouvelle approche : **décrire une stratégie de trading en langage naturel
ou dans un document PDF**, et laisser l'IA en extraire des règles formelles
exploitables par un moteur d'exécution.

C'est ce double constat — manque d'outillage accessible + émergence des LLM —
qui est à l'origine d'**Alvio**.

---

## Problématique

> **Comment permettre à un trader individuel de formaliser, activer et surveiller
> sa propre stratégie de trading, en s'appuyant sur l'intelligence artificielle
> pour l'analyse et la détection de patterns, sans nécessiter de compétences
> en développement ou en data science ?**

Cette problématique soulève trois défis techniques concrets :

1. **Extraction de connaissance** — comment transformer un document de stratégie
   (PDF, texte) en règles machine exploitables de manière fiable ?
2. **Détection temps réel** — comment analyser en continu des données de marché
   (OHLCV) avec des algorithmes Python, intégrés dans une API REST NestJS sans
   bloquer le thread principal ?
3. **Sécurité et confiance** — un outil financier manipule des données sensibles
   et doit garantir une authentification robuste, un audit trail complet et une
   résistance aux attaques communes (CSRF, XSS, SQLi, brute-force).

---

## Livrables du projet

### 1. API REST — `broker-ia-backend` (NestJS 10)

Backend principal exposant 14 controllers et une quarantaine d'endpoints REST.
Héberge le Strategy Engine, le bridge Python, le planificateur de signaux
et l'intégralité du système d'authentification MFA.

| Caractéristique | Valeur |
|---|---|
| Framework | NestJS 10 + TypeScript |
| ORM | Prisma v5 — PostgreSQL 15 |
| Cache | Redis 7 via ioredis |
| Port | 3001 |

### 2. Application Web — `alvio-frontend` (Next.js 13)

Interface utilisateur complète : dashboard temps réel, page marchés avec
graphiques chandeliers (lightweight-charts), gestion des stratégies et
des signaux, module formation (LMS), simulateur DCA, rapports mensuels,
et panneau de sécurité MFA.

| Caractéristique | Valeur |
|---|---|
| Framework | Next.js 13.4.0 (Pages Router) |
| State | Zustand 4.5.7 |
| Graphiques | lightweight-charts 4.2.3 |
| Port | 3000 |

### 3. Application Mobile — `broker-ia-mobile` (React Native)

Application mobile compagnon avec 5 écrans fonctionnels :
authentification, dashboard, signaux, simulateur DCA et profil.

| Caractéristique | Valeur |
|---|---|
| Framework | React Native 0.72.3 |
| Toolchain | Expo 49 |
| Navigation | Stack + Bottom Tabs (`@react-navigation`) |

> **Note de périmètre** : L'écran Markets (consultation des prix en temps réel)
> n'est pas implémenté dans la version mobile actuelle — il constitue une
> perspective d'évolution naturelle.

### 4. Module IA Python (`ai-module/`)

15 scripts d'analyse technique appelés depuis NestJS via bridge `spawn`
stdin/stdout. Détecte les patterns chartistes et calcule les indicateurs
(RSI, MACD, Bollinger, ATR, Stochastique, Ichimoku, ondes d'Elliott,
patterns harmoniques).

| Caractéristique | Valeur |
|---|---|
| Langage | Python 3 |
| Libs principales | pandas 2.0.3 · numpy 1.24.3 · TA-Lib 0.4.27 · scikit-learn 1.3.0 |
| Intégration | `spawn` stdin/stdout (pas `exec`) |
| Point d'entrée | `pattern_detector.py` |

### 5. Infrastructure (`docker-compose.yml`)

7 services Docker orchestrés pour un déploiement reproductible en une commande.

| Service | Image | Rôle |
|---|---|---|
| postgres | postgres:15 | Base de données principale |
| redis | redis:7 | Cache + sessions |
| backend | (build local) | API NestJS |
| frontend | (build local) | App Next.js |
| prometheus | prom/prometheus | Collecte métriques |
| grafana | grafana/grafana | Dashboard 17 panneaux |
| logstash | logstash:8 | Pipeline logs → Elasticsearch |

---

## Périmètre fonctionnel — vue d'ensemble

```
Trader
  │
  ├── Web (Next.js :3000) ─────────────────────────────┐
  └── Mobile (Expo :19000) ───────────────────────────┐ │
                                                       ▼ ▼
                                              NestJS API (:3001)
                                                    │
                    ┌───────────────────────────────┼───────────────────┐
                    │                               │                   │
              PostgreSQL 15                      Redis 7          Python spawn
              (Prisma ORM)                   (cache/sessions)   (pattern_detector.py)
                                                                        │
                                                              15 scripts IA
                                                         (RSI, MACD, patterns...)
                    │
           Données marché
            CoinGecko API ◄── /markets/**
            Claude API    ◄── /strategies/import + /strategies/:id/analyze
```

---

## Structure de ce dossier

Ce dossier de projet est organisé selon les blocs de compétences RNCP CDA :

| Section | Bloc RNCP |
|---|---|
| Gestion de projet | Transversal |
| Conception UI/UX | Bloc 2 — Conception |
| Conception BDD (MCD/MLD/MPD) | Bloc 2 — Conception |
| Modélisation UML | Bloc 2 — Conception |
| Architecture logicielle | Bloc 2 — Conception |
| Application Web | Bloc 1 — Développement sécurisé |
| Application Mobile | Bloc 1 — Développement sécurisé |
| Module IA/ML | Bloc 1 — Développement sécurisé |
| Tests | Bloc 1 — Développement sécurisé |
| Déploiement | Bloc 3 — Déploiement |
| Sécurité | Bloc 1 — Développement sécurisé |
| Mapping RNCP | Transversal |
