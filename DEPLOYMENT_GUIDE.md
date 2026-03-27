# 🚀 GUIDE DE DÉPLOIEMENT COMPLET

## PHASE 1: SETUP LOCAL (DÉVELOPPEMENT)

---

## 1️⃣ BACKEND FASTAPI

### Installation

```bash
# Créer un dossier de travail
mkdir broker-ia-platform
cd broker-ia-platform

# Créer un virtual environment Python
python -m venv venv

# Activer l'environnement
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Créer la structure du backend
mkdir backend
cd backend

# Créer app structure
mkdir app
mkdir app/api
mkdir app/models
mkdir app/schemas
mkdir app/services
mkdir app/db
mkdir app/utils
mkdir app/middleware

# Copier tous les fichiers depuis les fichiers .md ci-dessus

# Installer les dépendances
pip install -r requirements.txt

# Créer le fichier .env
cp .env.example .env

# Important: Éditer .env et configurer:
# - DATABASE_URL (PostgreSQL connection)
# - REDIS_URL
# - JWT_SECRET_KEY
```

### Démarrer le Backend

```bash
# Option 1: Développement avec hot-reload
uvicorn app.main:app --reload --port 8000

# Option 2: Production
gunicorn -w 4 -k uvicorn.workers.UvicornWorker app.main:app --bind 0.0.0.0:8000
```

✅ API disponible à: http://localhost:8000/docs (Swagger UI)

---

## 2️⃣ FRONTEND WEB REACT

### Installation

```bash
# Créer le projet avec Vite
npm create vite@latest frontend-web -- --template react-ts
cd frontend-web

# Installer les dépendances
npm install

# Installer Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Copier tous les fichiers depuis FRONTEND_REACT.md
# - src/components/
# - src/pages/
# - src/services/
# - src/hooks/
# - src/stores/
# - src/types/
# - etc.

# Créer fichier .env
echo "VITE_API_URL=http://localhost:8000/api" > .env.local
```

### Démarrer le Frontend

```bash
# Développement
npm run dev

# Build production
npm run build

# Preview production build
npm run preview
```

✅ Frontend disponible à: http://localhost:3000

---

## 3️⃣ MODULE IA (PYTHON STANDALONE)

### Installation

```bash
# Créer dossier IA
mkdir ai-module
cd ai-module

# Créer env
python -m venv venv
source venv/bin/activate

# Copier les fichiers Python
# - pattern_detector.py
# - technical_indicators.py
# - signal_generator.py
# - main.py (si FastAPI API)

# Installer dépendances
pip install -r requirements.txt
```

### Démarrer le Module IA

```bash
# Option 1: API standalone
uvicorn main:app --port 8001

# Option 2: Comme module importable (pour integration avec backend)
# Dans le backend, importer:
# from ai_module.signal_generator import SignalGenerator
```

---

## 4️⃣ MOBILE REACT NATIVE

### Installation

```bash
# Installer Expo CLI (plus facile que react-native-cli)
npm install -g expo-cli

# Créer le projet
expo init mobile
cd mobile

# Copier les fichiers depuis MOBILE_REACT_NATIVE.md
# - src/screens/
# - src/components/
# - src/services/
# - src/navigation/

# Installer dépendances
npm install
# ou
yarn install
```

### Démarrer le Mobile

```bash
# Developpement
expo start

# Suivre les instructions pour:
# - Android: Appuyer sur 'a'
# - iOS: Appuyer sur 'i'
# - Web: Appuyer sur 'w'
```

---

## 🗄️ BASE DE DONNÉES

### PostgreSQL Setup

```bash
# Windows: Installer PostgreSQL depuis postgresql.org

# Linux:
sudo apt-get install postgresql postgresql-contrib

# Mac:
brew install postgresql
brew services start postgresql

# Créer la database
createdb broker_ia

# Créer l'utilisateur
psql -U postgres -d broker_ia
CREATE USER broker_user WITH PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE broker_ia TO broker_user;
\q

# Mettre à jour .env backend:
# DATABASE_URL=postgresql://broker_user:password@localhost:5432/broker_ia
```

### Run Migrations (Alembic)

```bash
cd backend

# Initialiser les migrations
alembic init migrations

# Créer une migration basée sur les models
alembic revision --autogenerate -m "Initial schema"

# Appliquer les migrations
alembic upgrade head
```

### Redis Setup

```bash
# Windows: Télécharger depuis github.com/tporadowski/redis/releases
# Ou installer via WSL

# Linux:
sudo apt-get install redis-server
sudo systemctl start redis-server

# Mac:
brew install redis
brew services start redis

# Test:
redis-cli ping
# Devrait retourner: PONG
```

---

## 🔗 ARCHITECTURE LOCAL (DÉVELOPPEMENT)

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND WEB                      │
│            (React @ localhost:3000)                  │
└────────────────┬────────────────────────────────────┘
                 │ HTTP/REST
                 ▼
┌─────────────────────────────────────────────────────┐
│                   BACKEND API                        │
│           (FastAPI @ localhost:8000)                 │
│  ┌────────────┐  ┌─────────┐  ┌──────────────┐     │
│  │ PostgreSQL │  │  Redis  │  │  AI Module   │     │
│  │  localhost │  │  :6379  │  │  :8001       │     │
│  └────────────┘  └─────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│               MOBILE (React Native)                  │
│          (Expo @ localhost:19000+)                   │
│    Partagent le même Backend API                    │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│            AI MODULE (Python Standalone)             │
│             (FastAPI @ localhost:8001)               │
│  - Pattern Detection                                 │
│  - Technical Indicators                              │
│  - Signal Generation                                 │
└─────────────────────────────────────────────────────┘
```

---

## 🚢 PHASE 2: PRODUCTION DEPLOYMENT

### Backend (Docker)

```dockerfile
# Dockerfile (backend/)
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY app/ ./app/

CMD ["gunicorn", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "app.main:app", "--bind", "0.0.0.0:8000"]
```

### Frontend (Vercel)

```bash
# Vercel automatiquement détecte Vite
# Juste connecter le repo GitHub

# Ou deployer manuellement:
npm run build
vercel deploy --prod
```

### Mobile (AppStore / PlayStore)

```bash
# Android
eas build --platform android

# iOS
eas build --platform ios

# Submitter sur AppStore
eas submit --platform ios
```

### Database (AWS RDS)

```bash
# Créer une RDS PostgreSQL instance
# AWS Console → RDS → Create Database

# Connecter via psql:
psql -h your-rds-endpoint.rds.amazonaws.com -U postgres -d broker_ia
```

### Infrastructure (Docker Compose Production)

```yaml
# docker-compose.yml
version: '3.8'

services:
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: broker_ia
      POSTGRES_USER: broker_user
      POSTGRES_PASSWORD: secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgresql://broker_user:secure_password@db:5432/broker_ia
      REDIS_URL: redis://redis:6379
      JWT_SECRET_KEY: ${JWT_SECRET_KEY}
    ports:
      - "8000:8000"
    depends_on:
      - db
      - redis

  ai-module:
    build: ./ai-module
    ports:
      - "8001:8001"

volumes:
  postgres_data:
```

---

## 🧪 TESTING

### Backend Tests

```bash
cd backend

# Installer pytest
pip install pytest pytest-asyncio

# Créer tests/
mkdir tests
touch tests/__init__.py
touch tests/test_auth.py
touch tests/test_signals.py

# Run tests
pytest

# Avec coverage
pytest --cov=app
```

### Frontend Tests

```bash
cd frontend-web

# Installer testing libraries
npm install -D vitest @testing-library/react @testing-library/jest-dom

# Run tests
npm run test
```

---

## 📊 MONITORING & LOGGING

### Backend Logging

```python
# Dans app/main.py
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)
```

### Frontend Error Tracking

```typescript
// Sentry integration
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "https://your-sentry-key@sentry.io/project",
  environment: import.meta.env.VITE_ENV,
});
```

---

## 🔐 SECURITY CHECKLIST

- [ ] Déployer en HTTPS (Let's Encrypt)
- [ ] Configurer CORS correctement
- [ ] Activer rate limiting (Redis)
- [ ] Hacher les passwords (bcrypt)
- [ ] Valider les inputs (Pydantic)
- [ ] SQL injection prevention (SQLAlchemy ORM)
- [ ] CSRF protection
- [ ] JWT token rotation
- [ ] Secrets management (AWS Secrets Manager)
- [ ] Regular security audits

---

## 📈 PERFORMANCE OPTIMIZATION

### Backend

```python
# Caching avec Redis
from functools import lru_cache

@lru_cache(maxsize=128)
def get_user_signals(user_id: int):
    # ...expensive query
    pass
```

### Frontend

```typescript
// Code splitting
const Dashboard = lazy(() => import('./pages/Dashboard'))

// Image optimization
import { Image } from '@optimization/image'
```

### Database

```sql
-- Créer des indexes
CREATE INDEX idx_signals_user_id ON signals(user_id);
CREATE INDEX idx_signals_created_at ON signals(created_at DESC);
CREATE INDEX idx_signals_asset ON signals(asset);
```

---

## 📚 USEFUL COMMANDS

```bash
# Backend
uvicorn app.main:app --reload          # Dev
gunicorn app.main:app --bind 0.0.0.0   # Prod
alembic upgrade head                    # DB migrations
pytest --cov=app                        # Test coverage

# Frontend
npm run dev                             # Dev server
npm run build                           # Production build
npm run lint                            # ESLint
npm run type-check                      # TypeScript check

# Mobile
expo start                              # Dev server
expo build:android                      # Android APK
expo build:ios                          # iOS IPA

# Database
psql -U postgres -d broker_ia           # Connect to DB
redis-cli                               # Redis CLI
docker-compose up                       # Start all services
```

---

## 🎯 NEXT STEPS

1. **Setup local**: Follow steps 1-4 above
2. **Test locally**: Vérifier que tout fonctionne
3. **Add more features**: Implémenter les endpoints manquants
4. **Integration testing**: Tester le flux complet
5. **Prepare for production**: Dockerize, optimize, secure
6. **Deploy to cloud**: AWS / Vercel / Firebase
7. **Monitor & scale**: Ajouter monitoring, alertes, auto-scaling

---

**Vous avez maintenant un codebase complet et prêt pour le développement!** 🎉
