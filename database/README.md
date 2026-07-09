# 🗄️ Database — PostgreSQL + Prisma

**Schéma et migrations réels dans [`../backend-code/prisma/`](../backend-code/prisma/)**

## 📋 Les 11 modèles réels (`schema.prisma`)

| Modèle | Rôle |
|---|---|
| `User` | Compte utilisateur — email/mot de passe (optionnel), GitHub id, PIN, secret TOTP, préférences |
| `SimulationResult` | Résultat de simulation DCA persisté par utilisateur |
| `PortfolioSnapshot` | Snapshot mensuel du capital (unique par utilisateur + mois + année) |
| `WebAuthnCredential` | Authentifiant FIDO2/WebAuthn enregistré (clé publique, compteur, transports) |
| `Signal` | Signal de trading (actif, direction BUY/SELL/HOLD, prix entrée/stop/take-profit, confiance, statut OPEN/CLOSED) |
| `Strategy` | Stratégie utilisateur (règles JSON extraites par Claude, actif, timeframe, stats) |
| `Report` | Rapport mensuel (peu utilisé — `ReportsService` calcule à la volée) |
| `AuthLog` | Journal d'audit sécurité (action, résultat, IP) |
| `Course` / `Lesson` | Catalogue e-learning |
| `UserProgress` | Suivi de progression par utilisateur |

Enums : `CourseLevel` (DEBUTANT/INTERMEDIAIRE/AVANCE/EXPERT), `LessonType` (VIDEO/ARTICLE/QUIZ).

## 🎯 Points clés

- **PostgreSQL** (`datasource provider = "postgresql"`, lit `DATABASE_URL`) — `postgres:15-alpine` en Docker
- **Prisma Client JS** comme ORM
- Toutes les clés primaires sont des **cuid** (générés côté application, pas des UUID)
- Les **refresh tokens ne sont pas stockés en base** — volontairement déplacés vers Redis pour éviter une double source de vérité (voir commentaire dans `schema.prisma`)

## 🚀 Pour voir le schéma

```bash
cd ../backend-code
cat prisma/schema.prisma
```

## 📖 Voir aussi

- Schéma complet → [`../backend-code/prisma/schema.prisma`](../backend-code/prisma/schema.prisma)
- Migrations → [`../backend-code/prisma/migrations/`](../backend-code/prisma/migrations/)
- Seed data → [`../backend-code/prisma/seed-formation.ts`](../backend-code/prisma/seed-formation.ts)
- Modèle Conceptuel/Logique/Physique (MCD/MLD/MPD) → [`../docs/modelisation/`](../docs/modelisation/)
