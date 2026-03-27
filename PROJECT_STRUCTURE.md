# 🏗️ PROJECT STRUCTURE - BROKER IA INTELLIGENT

## STACK TECH FINAL (COHÉRENT & PRODUCTIF)

```
Backend:        Python + FastAPI ✅
Frontend Web:   React 18 + TypeScript + Tailwind + Vite
Frontend Mobile: React Native + TypeScript
IA Module:      Python (pandas, numpy, scikit-learn)
Database:       PostgreSQL + Redis
API Style:      REST (extensible en GraphQL)
Auth:           JWT + Refresh tokens
```

---

## 📁 STRUCTURE DU PROJET

```
broker-ia-intelligent/
│
├── 📁 backend/                           (Python FastAPI)
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                       # Application principale
│   │   ├── config.py                     # Configuration (env vars, BD, etc)
│   │   │
│   │   ├── 📁 api/
│   │   │   ├── __init__.py
│   │   │   ├── routes.py                 # Routes principales
│   │   │   ├── users.py                  # Endpoints users
│   │   │   ├── auth.py                   # Login, register, JWT
│   │   │   ├── strategies.py             # Upload, récupération stratégies
│   │   │   ├── signals.py                # Génération, récupération signaux
│   │   │   ├── simulator.py              # DCA simulator
│   │   │   ├── reports.py                # Bilans mensuels
│   │   │   └── subscriptions.py          # Gestion abonnements
│   │   │
│   │   ├── 📁 models/
│   │   │   ├── __init__.py
│   │   │   ├── user.py                   # ORM User (SQLAlchemy)
│   │   │   ├── strategy.py               # ORM Strategy
│   │   │   ├── signal.py                 # ORM Signal
│   │   │   ├── subscription.py           # ORM Subscription
│   │   │   └── report.py                 # ORM Report
│   │   │
│   │   ├── 📁 schemas/
│   │   │   ├── __init__.py
│   │   │   ├── user.py                   # Pydantic schemas (validation)
│   │   │   ├── strategy.py
│   │   │   ├── signal.py
│   │   │   └── report.py
│   │   │
│   │   ├── 📁 services/
│   │   │   ├── __init__.py
│   │   │   ├── user_service.py           # Logique métier users
│   │   │   ├── auth_service.py           # JWT, hashing, refresh tokens
│   │   │   ├── strategy_service.py       # Upload, parsing stratégies
│   │   │   ├── signal_service.py         # Génération signaux
│   │   │   ├── simulator_service.py      # Calculs DCA
│   │   │   ├── report_service.py         # Génération bilans
│   │   │   └── ai_service.py             # Appel module IA
│   │   │
│   │   ├── 📁 db/
│   │   │   ├── __init__.py
│   │   │   ├── database.py               # Connection BD
│   │   │   ├── session.py                # Session management
│   │   │   └── migrations/               # Alembic migrations (SQL)
│   │   │
│   │   ├── 📁 utils/
│   │   │   ├── __init__.py
│   │   │   ├── jwt_handler.py            # JWT encode/decode
│   │   │   ├── password.py               # Hash password
│   │   │   ├── errors.py                 # Custom exceptions
│   │   │   └── validators.py             # Validation data
│   │   │
│   │   └── 📁 middleware/
│   │       ├── __init__.py
│   │       └── auth.py                   # JWT verification middleware
│   │
│   ├── requirements.txt                  # Dependencies
│   ├── .env.example                      # Env variables template
│   └── README.md
│
├── 📁 frontend-web/                      (React + TypeScript)
│   ├── 📁 src/
│   │   ├── main.tsx                      # Entrypoint
│   │   ├── App.tsx                       # Root component
│   │   │
│   │   ├── 📁 components/
│   │   │   ├── 📁 common/
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── Loading.tsx
│   │   │   │   └── ErrorBoundary.tsx
│   │   │   │
│   │   │   ├── 📁 auth/
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   └── RegisterForm.tsx
│   │   │   │
│   │   │   ├── 📁 dashboard/
│   │   │   │   ├── Dashboard.tsx
│   │   │   │   ├── SignalWidget.tsx
│   │   │   │   └── PerformanceWidget.tsx
│   │   │   │
│   │   │   ├── 📁 strategies/
│   │   │   │   ├── StrategyUpload.tsx
│   │   │   │   └── StrategyList.tsx
│   │   │   │
│   │   │   ├── 📁 signals/
│   │   │   │   ├── SignalsList.tsx
│   │   │   │   └── SignalDetail.tsx
│   │   │   │
│   │   │   ├── 📁 simulator/
│   │   │   │   ├── SimulatorForm.tsx
│   │   │   │   └── SimulatorChart.tsx
│   │   │   │
│   │   │   ├── 📁 reports/
│   │   │   │   └── MonthlyReport.tsx
│   │   │   │
│   │   │   └── 📁 profile/
│   │   │       ├── Profile.tsx
│   │   │       └── SubscriptionManager.tsx
│   │   │
│   │   ├── 📁 pages/
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Strategies.tsx
│   │   │   ├── Signals.tsx
│   │   │   ├── Simulator.tsx
│   │   │   ├── Reports.tsx
│   │   │   └── Profile.tsx
│   │   │
│   │   ├── 📁 services/
│   │   │   ├── api.ts                    # Axios config + base URL
│   │   │   ├── auth.ts                   # Auth API calls
│   │   │   ├── signals.ts                # Signals API calls
│   │   │   ├── strategies.ts             # Strategies API calls
│   │   │   └── simulator.ts              # Simulator API calls
│   │   │
│   │   ├── 📁 hooks/
│   │   │   ├── useAuth.ts                # Authentication hook
│   │   │   ├── useSignals.ts             # Signals hook
│   │   │   └── useApi.ts                 # Generic API hook
│   │   │
│   │   ├── 📁 context/
│   │   │   ├── AuthContext.tsx           # Auth state management
│   │   │   └── UIContext.tsx             # UI state (loading, errors)
│   │   │
│   │   ├── 📁 types/
│   │   │   ├── index.ts                  # TypeScript interfaces
│   │   │   ├── auth.ts
│   │   │   ├── signal.ts
│   │   │   ├── strategy.ts
│   │   │   └── simulator.ts
│   │   │
│   │   ├── 📁 styles/
│   │   │   ├── globals.css               # Tailwind + custom CSS
│   │   │   └── tailwind.config.ts
│   │   │
│   │   └── 📁 utils/
│   │       ├── formatters.ts             # Formattage dates, nombres
│   │       ├── validators.ts             # Validation côté client
│   │       └── storage.ts                # LocalStorage utils
│   │
│   ├── public/                           # Static assets
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── README.md
│
├── 📁 mobile/                            (React Native + TypeScript)
│   ├── 📁 src/
│   │   ├── App.tsx                       # Root navigator
│   │   │
│   │   ├── 📁 screens/
│   │   │   ├── LoginScreen.tsx
│   │   │   ├── RegisterScreen.tsx
│   │   │   ├── DashboardScreen.tsx
│   │   │   ├── SignalsScreen.tsx
│   │   │   ├── SimulatorScreen.tsx
│   │   │   ├── ProfileScreen.tsx
│   │   │   └── StrategyScreen.tsx
│   │   │
│   │   ├── 📁 components/
│   │   │   ├── SignalCard.tsx
│   │   │   ├── SimpleChart.tsx
│   │   │   ├── FormInput.tsx
│   │   │   └── Button.tsx
│   │   │
│   │   ├── 📁 services/
│   │   │   ├── api.ts                    # API calls (même backend)
│   │   │   ├── storage.ts                # AsyncStorage
│   │   │   └── auth.ts
│   │   │
│   │   ├── 📁 context/
│   │   │   └── AuthContext.tsx
│   │   │
│   │   ├── 📁 navigation/
│   │   │   ├── RootNavigator.tsx         # Stack + Tab navigator
│   │   │   └── types.ts
│   │   │
│   │   ├── 📁 types/
│   │   │   └── index.ts
│   │   │
│   │   └── 📁 utils/
│   │       └── formatters.ts
│   │
│   ├── app.json
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
│
└── 📁 ai-module/                         (Python - Standalone)
    ├── strategy_analyzer.py              # NLP + règles extraction
    ├── pattern_detector.py               # Détection patterns
    ├── signal_generator.py               # Génération signaux
    ├── market_data.py                    # Mock données marché
    ├── main.py                           # Point d'entrée / API
    ├── requirements.txt
    └── README.md
```

---

## 📊 FLUX DE DONNÉES

```
1. USER REGISTRATION
   Frontend (Register.tsx) → Backend (POST /api/auth/register)
   → Database (users table) → JWT token → Frontend (localStorage)

2. UPLOAD STRATEGY
   Frontend (StrategyUpload.tsx) → Backend (POST /api/strategies)
   → AI Module (strategy_analyzer.py) → Extract rules
   → Database (strategies, strategy_rules tables) → Response

3. GENERATE SIGNALS
   Periodic job OR user request → AI Module
   → Détection patterns + indicators → Signal generation
   → Database (signals table) → Frontend (GET /api/signals)

4. SIMULATOR
   Frontend (SimulatorForm) → Backend (POST /api/simulator/dca)
   → Service calcule intérêts composés → Retourne résultats
   → Frontend affiche graphique

5. MONTHLY REPORT
   Batch job (end of month) → Calculate performance
   → Generate report → Store in DB → Accessible via GET /api/reports
```

---

## 🔐 SÉCURITÉ

```
✅ Passwords: Hashed with bcrypt
✅ Auth: JWT + refresh tokens (15min access, 7day refresh)
✅ CORS: Frontend origin whitelisted
✅ Rate limiting: Redis-based (10 req/min per IP)
✅ Input validation: Pydantic schemas + client-side
✅ SQL Injection: SQLAlchemy ORM (parameterized queries)
✅ HTTPS: Required in production
```

---

## 🚀 DÉPLOIEMENT

```
Backend:    Docker + Gunicorn + Nginx
Frontend:   Static build → CloudFront / Vercel
Mobile:     Build Android/iOS → Google Play / App Store
AI Module:  Celery workers (async tasks)
Database:   AWS RDS PostgreSQL
Cache:      AWS ElastiCache Redis
```

---

**Next:** Voir fichiers détaillés dans chaque dossier (backend/, frontend-web/, mobile/, ai-module/)
