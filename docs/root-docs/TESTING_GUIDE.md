# Guide de Test - Broker IA Platform
## Étapes complètes pour démarrer et tester

---

## 📋 PRÉ-REQUIS

### 1. Node.js et npm
**Télécharger**: https://nodejs.org/ (version 18+ LTS recommandée)

Vérifier après installation:
```bash
node --version    # v18.x.x
npm --version     # 9.x.x
```

### 2. Python 3.8+
**Télécharger**: https://python.org/

Vérifier après installation:
```bash
python --version  # Python 3.8+
```

### 3. PostgreSQL 15+ (optionnel - utiliser Docker sinon)
**Télécharger**: https://www.postgresql.org/download/

### 4. Git
**Télécharger**: https://git-scm.com/

### 5. Docker + Docker Compose (optionnel mais recommandé)
**Télécharger**: https://www.docker.com/products/docker-desktop

---

## 🚀 OPTION 1: TEST RAPIDE AVEC DOCKER (RECOMMANDÉ)

### Étape 1: Vérifier Docker
```bash
docker --version
docker-compose --version
```

### Étape 2: Démarrer tous les services
```bash
cd c:\Users\ijjai_a\Desktop\brokeria\08_Code_Base

# Démarrer tous les conteneurs
docker-compose up -d

# Vérifier le statut
docker-compose ps
```

### Étape 3: Vérifier les services
```bash
# Backend (NestJS)
curl http://localhost:3001

# Frontend (Next.js) - Attendre 1-2 minutes au démarrage
curl http://localhost:3000

# PostgreSQL
docker-compose exec postgres psql -U brokeria_user -d brokeria -c "SELECT 1;"

# Redis
docker-compose exec redis redis-cli ping
```

### Étape 4: Tester l'API

#### Créer un utilisateur:
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@brokerla.com",
    "username": "testuser",
    "password": "TestPass123!"
  }'
```

#### Se connecter:
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@brokerla.com",
    "password": "TestPass123!"
  }'
```

**Réponse attendue**:
```json
{
  "access_token": "eyJhbGc...",
  "refresh_token": "eyJhbGc...",
  "user": { "id": "...", "email": "test@brokerla.com" }
}
```

#### Créer un signal (remplacer TOKEN par le JWT reçu):
```bash
curl -X POST http://localhost:3001/api/signals \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "asset": "BTC/USDT",
    "direction": "BUY",
    "entry_price": 45000,
    "stop_loss": 44000,
    "take_profit": 46000,
    "confidence": 85,
    "patterns": ["Hammer", "Bullish Engulfing"]
  }'
```

#### Récupérer les signaux:
```bash
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3001/api/signals
```

#### Tester le simulateur DCA:
```bash
curl -X POST http://localhost:3001/api/simulator/dca \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "initialAmount": 10000,
    "monthlyInvestment": 500,
    "months": 24,
    "annualReturn": 0.08,
    "volatility": 0.15
  }'
```

**Réponse attendue**:
```json
{
  "initialAmount": 10000,
  "monthlyInvestment": 500,
  "months": 24,
  "totalInvested": 22000,
  "finalBalance": 25300,
  "totalGains": 3300,
  "roi": 15
}
```

---

## 🛠️ OPTION 2: SETUP MANUEL (DÉVELOPPEMENT)

### Terminal 1: Backend

```bash
cd c:\Users\ijjai_a\Desktop\brokeria\08_Code_Base\backend-code

# Installer les dépendances
npm install

# Créer le fichier .env
copy .env.example .env

# IMPORTANT: Éditer .env avec vos paramètres
# DATABASE_URL=postgresql://brokeria_user:brokeria_password@localhost:5432/brokeria
# JWT_SECRET=votre_clé_secrète_aléatoire
```

**Si vous utilisez Docker pour PostgreSQL**:
```bash
docker-compose up -d postgres redis
```

**Initialiser la base de données**:
```bash
npx prisma migrate dev --name init
npx prisma generate
```

**Démarrer le serveur**:
```bash
npm run start:dev
```

Vous devriez voir:
```
✓ Listening on port 3001
```

### Terminal 2: Frontend

```bash
cd c:\Users\ijjai_a\Desktop\brokeria\08_Code_Base\frontend-web

# Installer les dépendances
npm install

# Créer .env.local
copy .env.local.example .env.local

# Démarrer le serveur
npm run dev
```

Vous devriez voir:
```
ready - started server on 0.0.0.0:3000
```

Ouvrir: http://localhost:3000

### Terminal 3: Mobile (optionnel)

```bash
cd c:\Users\ijjai_a\Desktop\brokeria\08_Code_Base\mobile

# Installer les dépendances
npm install

# Créer .env
copy .env.example .env

# Démarrer Expo
npm start
```

---

## 🧪 OPTION 3: TEST DU MODULE IA (PYTHON)

### Installation des dépendances Python:

```bash
cd c:\Users\ijjai_a\Desktop\brokeria\08_Code_Base\ai-module

# Créer un environnement virtuel (recommandé)
python -m venv venv

# Activer l'environnement
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Installer les packages
pip install -r requirements.txt
```

### Exécuter le test:

```bash
python test_ai_module.py
```

**Résultat attendu**:
```
==================================================
TEST 1: Candlestick Pattern Detection
==================================================
✅ Detected 2 candlestick patterns
   - Hammer: BUY (85%)

==================================================
TEST 2: Technical Indicators
==================================================
✅ Technical indicators calculated
   - RSI(14): 35.42
   - MACD line: 0.0523

...

TESTING COMPLETE
=========================================="
```

---

## ✅ CHECKLIST DE VÉRIFICATION

Après le démarrage, vérifier:

- [ ] Backend répond sur http://localhost:3001
- [ ] Frontend charge sur http://localhost:3000
- [ ] Enregistrement utilisateur fonctionne ✅
- [ ] Login retourne un JWT ✅
- [ ] Création de signal fonctionne ✅
- [ ] Récupération des signaux fonctionne ✅
- [ ] Simulateur DCA fonctionne ✅
- [ ] Base de données est disponible ✅
- [ ] Redis fonctionne (optionnel) ✅

---

## 🔧 DÉPANNAGE

### Port déjà utilisé
```bash
# Trouver le processus utilisant le port (Windows PowerShell)
Get-Process -Id (Get-NetTCPConnection -LocalPort 3001).OwningProcess

# Tuer le processus
Stop-Process -Id PID -Force
```

### Erreur de base de données
```bash
# Vérifier la connexion PostgreSQL
psql -U brokeria_user -h localhost -d brokeria

# Réinitialiser les migrations
npx prisma migrate reset
```

### Erreur de dépendances npm
```bash
# Nettoyer et réinstaller
rm -r node_modules
npm cache clean --force
npm install
```

### Module Python manquant
```bash
pip install --upgrade pandas numpy scikit-learn scipy
```

---

## 📊 URLs IMPORTANTES

| Service | URL | Credentials |
|---------|-----|------------|
| Frontend | http://localhost:3000 | Email/Password |
| Backend API | http://localhost:3001 | JWT Token |
| PostgreSQL | localhost:5432 | brokeria_user/brokeria_password |
| Redis | localhost:6379 | (no password) |
| Swagger API Docs | http://localhost:3001/api | (si configuré) |

---

## 📝 FICHIERS DE CONFIGURATION

Créer/Éditer ces fichiers:

### Backend (.env)
```
DATABASE_URL=postgresql://brokeria_user:brokeria_password@localhost:5432/brokeria
JWT_SECRET=your_secure_random_secret_key_here
JWT_EXPIRATION=15m
JWT_REFRESH_SECRET=your_secure_random_refresh_key_here
JWT_REFRESH_EXPIRATION=7d
PORT=3001
NODE_ENV=development
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Mobile (.env)
```
EXPO_PUBLIC_API_URL=http://localhost:3001
```

---

## 🎉 SUCCÈS!

Si tous les tests passent, votre plateforme est prête! 🚀

Prochaines étapes:
1. Créer plus de stratégies de trading
2. Tester l'intégration IA avec les patterns
3. Configurer les notifications email
4. Déployer en production

Pour plus de détails: voir README_FULL_STACK.md
