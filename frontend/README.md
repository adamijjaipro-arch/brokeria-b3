# 🟢 Frontend — Next.js Dashboard

**Le vrai code source est dans [`../frontend-web/`](../frontend-web/)**

## 📁 Structure réelle

```
frontend-web/
├── pages/                     ← Routes (Next.js Pages Router)
│   ├── index.tsx              → Accueil
│   ├── login.tsx, register.tsx
│   ├── dashboard/index.tsx
│   ├── markets/index.tsx, [id].tsx      → Prix & détail marché (CoinGecko via backend)
│   ├── signals/index.tsx, [id].tsx      → Signaux de trading
│   ├── strategies/index.tsx, new.tsx, import.tsx  → Import doc + analyse IA
│   ├── simulator/index.tsx    → Simulateur DCA
│   ├── formation/index.tsx    → E-learning
│   ├── reports/index.tsx
│   ├── profile/index.tsx, security.tsx
│   ├── pricing/index.tsx
│   └── auth/                  → 2fa, magic, pin, setup-pin, totp-setup,
│                                 totp-verify, webauthn-setup, github-callback, locked
├── components/
│   ├── charts/                → TradingChart.tsx (lightweight-charts)
│   ├── common/                → SignalCard, StatCard, PatternChart, DashboardFuturiste, etc.
│   ├── layout/                → AppLayout.tsx, Layout.tsx, PageTransition.tsx
│   └── seo/                   → PageSEO.tsx
├── api/index.ts               ← Client Axios centralisé vers le backend NestJS
├── context/authStore.ts       ← Store d'auth (maison, pas Zustand malgré la dépendance déclarée)
├── hooks/useAuth.ts
├── lib/seo.ts
├── utils/                     → formatters, serverCache.ts
├── types/                     → index.ts, formation.ts
├── middleware.ts              ← Garde d'accès Edge (cookie refresh_token)
├── package.json
└── next.config.js
```

## 🎯 Points clés

- **Next.js 13** (Pages Router), React 18, TypeScript
- **`lightweight-charts`** pour les graphiques (pas Recharts)
- **Axios** centralisé dans `api/index.ts` (injection Bearer JWT, refresh automatique sur 401)
- **TailwindCSS** pour le style
- Déployé sur Vercel (CI/CD automatique)

## 🚀 Pour naviguer

- Affichage des signaux ? → `pages/signals/index.tsx`, `[id].tsx`
- Appels API vers le backend ? → `api/index.ts`
- Import de stratégie assisté par IA ? → `pages/strategies/import.tsx`
- Graphique de trading ? → `components/charts/TradingChart.tsx`
- Layout général ? → `components/layout/AppLayout.tsx`

## 📖 Voir aussi

- Architecture complète → [`ARCHITECTURE_ALVIO_COMPLET.md`](../../../ARCHITECTURE_ALVIO_COMPLET.md) (racine du repo)
- Architecture backend détaillée → [`../docs/ARCHITECTURE_BACKEND.md`](../docs/ARCHITECTURE_BACKEND.md)
- Quick Start → [`../QUICK_START_TEST.md`](../QUICK_START_TEST.md)
