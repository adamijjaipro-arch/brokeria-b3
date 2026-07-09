# 🟣 Mobile — React Native + Expo SDK 49

**Le vrai code source est dans [`../mobile/`](../mobile/)**

## 📁 Structure réelle

```
mobile/
├── App.tsx                    → Entrée app (GestureHandlerRootView → AuthProvider → RootNavigator)
├── app.json                    → Config Expo (SDK 49, identité "Broker IA", com.brokerla.mobile)
├── src/
│   ├── constants/api.ts        → API_URL (10.0.2.2:3001, alias émulateur Android)
│   ├── contexts/AuthContext.tsx → Provider auth (login/logout, AsyncStorage)
│   ├── hooks/useAuth.ts         → Re-export du contexte auth
│   ├── navigation/RootNavigator.tsx → AuthStack vs TabNavigator (React Navigation)
│   └── screens/
│       ├── auth/                → LoginScreen, RegisterScreen
│       ├── dashboard/           → DashboardScreen
│       ├── signals/             → SignalsScreen, SignalDetailScreen
│       ├── simulator/           → SimulatorScreen
│       └── profile/             → ProfileScreen
└── package.json
```

## 🎯 Points clés

- **React Native 0.72** + **Expo SDK 49**, TypeScript
- Navigation via **React Navigation** (`@react-navigation/native` + bottom-tabs + stack) — **pas** Expo Router
- Pas de couche client API centralisée (chaque écran appelle Axios directement)
- Périmètre fonctionnel réduit vs frontend web :
  - ✅ Auth, Dashboard, Signals, Simulator, Profile
  - ❌ Markets, Strategies, Formation (pas encore mobile)

## ⚠️ Points d'attention

- Identité produit divergente : mobile encore **"Broker IA"** (`com.brokerla.mobile`) vs web **"Alvio"**
- Pas de fichier `eas.json` dans le repo — build/déploiement EAS non configuré à ce jour

## 🚀 Pour naviguer

- Écran d'accueil / navigation racine ? → `src/navigation/RootNavigator.tsx`
- Login / auth ? → `src/screens/auth/`
- Signaux ? → `src/screens/signals/`
- Simulateur DCA ? → `src/screens/simulator/`

## 📖 Voir aussi

- Quick Start → [`../QUICK_START_TEST.md`](../QUICK_START_TEST.md)
- Schéma DB (Prisma) → [`../backend-code/prisma/schema.prisma`](../backend-code/prisma/schema.prisma)

---
*Portail de navigation uniquement — le vrai `README.md` de développement reste dans [`../mobile/README.md`](../mobile/README.md), non modifié.*
