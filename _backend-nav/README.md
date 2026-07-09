# 🔵 Backend — NestJS API

**Le vrai code source est dans [`../backend-code/`](../backend-code/)**

## 📁 Structure réelle

```
backend-code/
├── src/                       ← 19 modules Nest, directement sous src/ (pas de sous-dossier modules/)
│   ├── auth/                  → Authentification (JWT, GitHub OAuth, magic link)
│   ├── mfa/totp/               → 2FA TOTP (RFC 6238)
│   ├── mfa/webauthn/           → Passkeys FIDO2
│   ├── markets/                → Proxy CoinGecko + cache Redis
│   ├── patterns/               → Détection de patterns (via ai-module Python)
│   ├── signals/                → Cycle de vie des signaux BUY/HOLD/EXIT
│   ├── strategies/             → Import doc stratégies (Claude API)
│   ├── ai/                     → Bridge Claude + sous-processus Python
│   ├── simulator/              → Simulation DCA
│   ├── portfolio/              → Capital utilisateur
│   ├── reports/                → Rapports mensuels
│   ├── formation/               → LMS e-learning
│   ├── database/                → Wrapper Prisma (PrismaService)
│   ├── redis/                   → Cache Redis (@Global)
│   ├── email/                   → Notifications SMTP
│   ├── logging/                 → Audit logs (@Global)
│   ├── metrics/                 → Prometheus (@Global)
│   ├── payments/                → Stub vide (pas d'intégration Stripe)
│   └── users/                   → Stub vide (CRUD user réel dans auth/)
├── prisma/                     → Schema DB (11 modèles) + migrations
├── src/main.ts                  → Entrée application
├── src/app.module.ts             → Déclaration des 19 modules
├── Dockerfile
├── docker-compose.yml            → Compose dev léger (postgres + redis)
├── package.json
└── tsconfig.json
```

## 🎯 Points clés

- **19 modules** organisés par responsabilité fonctionnelle (17 actifs + 2 stubs vides : `payments/`, `users/`)
- **NestJS 10** + TypeScript
- **Prisma Client JS** pour accès DB (PostgreSQL 15-alpine)
- **Redis 7** pour cache + sessions
- MFA multi-couche : JWT + WebAuthn FIDO2 + TOTP + Magic Link
- Déployé sur Railway

## 🚀 Pour naviguer

- Module d'authentification ? → `src/auth/`
- Détection de patterns ? → `src/patterns/`
- Génération de signaux ? → `src/signals/`
- Intégration IA (Claude) ? → `src/ai/` (appelle `../ai-module/` en subprocess)
- Schéma DB ? → `prisma/schema.prisma` (11 modèles Prisma)

## 📖 Voir aussi

- Architecture backend complète → [`../docs/ARCHITECTURE_BACKEND.md`](../docs/ARCHITECTURE_BACKEND.md)
- Quick Start → [`../QUICK_START_TEST.md`](../QUICK_START_TEST.md)
- Dossier Jury → [`../docs/ALVIO_DOSSIER_JURY.md`](../docs/ALVIO_DOSSIER_JURY.md)

---
*Portail de navigation uniquement — `backend/` (à la racine de ce dépôt) contient une spec FastAPI abandonnée, ne pas confondre avec `backend-code/` ci-dessus.*
