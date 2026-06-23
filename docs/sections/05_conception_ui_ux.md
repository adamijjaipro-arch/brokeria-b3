# Conception fonctionnelle UI/UX

---

## Charte graphique Alvio

La charte graphique d'Alvio est construite autour d'une identité visuelle
**trading premium** : fond sombre (navy), accents chauds (amber) pour les données
importantes, vert pour les signaux positifs et violet pour les fonctions secondaires.

### Palette de couleurs

| Rôle | Couleur | Code hex | Usage |
|---|---|---|---|
| Fond principal | Navy | `#0f172a` | Background global, cartes |
| Primaire / CTA | Amber | `#f59e0b` | Boutons, prix, valeurs clés, titres |
| Signaux positifs | Vert | `#10b981` | BUY, hausse, succès, confiance |
| Accent / secondaire | Violet | `#6366f1` | Badges, étapes MFA, navigation active |
| Texte secondaire | Slate | `#94a3b8` | Labels, descriptions, métadonnées |
| Surface carte | Glass | `#1e293b` | Cartes en glassmorphism |

### Style visuel

- **Glassmorphism** : cartes avec fond semi-transparent (`#1e293b`), bordure
  fine (`1px solid rgba(255,255,255,0.08)`) et `backdrop-filter: blur(12px)`.
- **Typography** : `Inter` (ou `DejaVu Sans` en fallback) — hiérarchie en
  poids 400 / 600 / 700.
- **Animations** : transitions fluides via `framer-motion 12.34.1` (fade-in,
  slide-up pour les modales et les notifications).
- **Logo** : triangle + ligne graphique ascendante — symbole d'une tendance
  haussière, cohérent avec le positionnement trading.
- **Icônes** : `ionicons 7.2.1` (mobile) + SVG inline (web).

---

## Application Web — Zoning et pages réelles

### Structure de navigation (Next.js 13 Pages Router)

```
/ (landing)
│
├── /login          ← email/password → 2FA → PIN
├── /register
│
├── /dashboard           ← vue d'ensemble (signaux récents, marchés top 3, stats)
│
├── /markets             ← top 20 cryptos (CoinGecko, cache 60 s)
│   └── /markets/[id]    ← détail + graphique OHLCV chandelier (lightweight-charts)
│
├── /strategies          ← liste des stratégies
│   ├── /strategies/new
│   └── /strategies/import  ← upload PDF → pdf-parse → Claude AI → StrategyRules
│
├── /signals             ← liste signaux (50 derniers)
│   └── /signals/[id]    ← détail signal (asset, confidence, patterns, indicateurs)
│
├── /formation           ← catalogue cours (LMS)
│   └── /formation/[courseId]/[lessonId]  ← lecteur vidéo / article / quiz
│
├── /simulator           ← simulateur DCA (fixed ou monte_carlo)
├── /reports             ← rapports mensuels
│
├── /profile             ← préférences, photo, email_notifications
│   └── /profile/security   ← MFA (TOTP QR, WebAuthn, PIN)
│
└── /auth/*
    ├── /auth/2fa           ← saisie OTP email
    ├── /auth/magic         ← réception magic link
    ├── /auth/pin           ← saisie PIN (3ème facteur)
    ├── /auth/totp-verify   ← saisie code TOTP
    └── /auth/github-callback
```

### Zoning — Dashboard (page principale connectée)

```
┌─────────────────────────────────────────────────────────────────┐
│  HEADER : Logo Alvio  |  Nav : Markets / Strategies / Signals   │
│           Formation / Simulator / Reports   |  [Profil]  [Notif]│
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────────┐  ┌────────────────────┐  ┌───────────┐  │
│  │  Signaux récents   │  │  Top 3 marchés     │  │  Stats    │  │
│  │  (5 derniers)      │  │  BTC / ETH / SOL   │  │  du mois  │  │
│  │  [asset][BUY]      │  │  prix + variation  │  │  Win rate │  │
│  │  [confidence %]    │  │  (sparkline)       │  │  P&L est. │  │
│  └────────────────────┘  └────────────────────┘  └───────────┘  │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  Stratégie active — [NOM STRATÉGIE]                         │ │
│  │  Asset : BTC | Timeframe : 1h | Status : active             │ │
│  │  Règles extraites : RSI < 30, EMA cross, ATR > seuil        │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Zoning — Page Marchés `/markets/[id]`

```
┌─────────────────────────────────────────────────────────────────┐
│  BTC/USD  $67,420  +2.4% (24h)   [1j] [7j] [30j] [90j]        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                                                             │ │
│  │   GRAPHIQUE OHLCV — lightweight-charts 4.2.3               │ │
│  │   (chandeliers si /ohlc disponible, sinon line chart)       │ │
│  │                                                             │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌──────────────────────────┐  ┌──────────────────────────────┐  │
│  │  Market Cap : $1.32T     │  │  Volume 24h : $28.4B         │  │
│  │  Rang : #1               │  │  Circulating : 19.7M BTC     │  │
│  └──────────────────────────┘  └──────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Zoning — Import stratégie `/strategies/import`

```
┌─────────────────────────────────────────────────────────────────┐
│  IMPORT DE STRATÉGIE                                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  [  Glisser un fichier PDF ou cliquer pour sélectionner  ]  │ │
│  │       (PDF, TXT, MD — max 10 MB)                            │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  Nom de la stratégie : [________________]                         │
│  Asset : [BTC ▼]   Timeframe : [1h ▼]                           │
│                                                                   │
│  [  Analyser avec Claude AI  ]  ← POST /strategies/import        │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  RÉSULTAT — StrategyRules extraites :                        │ │
│  │  • entry_conditions : RSI < 30, EMA20 > EMA50               │ │
│  │  • exit_conditions  : RSI > 70 OR stop_loss atteint         │ │
│  │  • risk_management  : stop_loss 2%, take_profit 6%          │ │
│  │  • confidence_score : 87                                     │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## Application Mobile — 5 écrans réels

La navigation mobile combine un **Stack Navigator** (auth) et un
**Bottom Tab Navigator** (écrans connectés).

```
Stack Navigator (auth)
  └── LoginScreen
        └── [après login réussi]
              ↓
        Bottom Tab Navigator
          ├── Tab 1 : DashboardScreen   (vue d'ensemble, signaux récents)
          ├── Tab 2 : SignalsScreen      (liste des signaux BUY/OPEN)
          ├── Tab 3 : SimulatorScreen    (saisie paramètres DCA)
          └── Tab 4 : ProfileScreen      (préférences, déconnexion)
```

> **Note** : l'écran Markets n'est pas implémenté dans la version mobile actuelle.
> C'est une perspective d'évolution documentée dans la section Déploiement.

### Zoning mobile — DashboardScreen

```
┌───────────────────────────┐
│  ▲ ALVIO          [Notif] │  ← Header amber
├───────────────────────────┤
│                           │
│  Bonjour, Adam            │
│  ┌───────────────────┐    │
│  │  BTC · BUY · OPEN │    │  ← SignalCard (glassmorphism)
│  │  conf. 87%        │    │
│  │  entry $67,420    │    │
│  └───────────────────┘    │
│  ┌───────────────────┐    │
│  │  ETH · BUY · OPEN │    │
│  │  conf. 72%        │    │
│  └───────────────────┘    │
│                           │
│  [Voir tous les signaux]  │
├───────────────────────────┤
│  [Dashboard][Signals]     │  ← Bottom Tabs (icons ionicons)
│  [Simulator][Profil]      │
└───────────────────────────┘
```

### Zoning mobile — SimulatorScreen

```
┌───────────────────────────┐
│  ▲ Simulateur DCA         │
├───────────────────────────┤
│                           │
│  Capital initial : [___]  │
│  Apport mensuel  : [___]  │
│  Durée (mois)    : [___]  │
│  Rendement ann.  : [___]  │
│  Mode : [Fixed ▼]         │
│                           │
│  [  Simuler  ]            │
├───────────────────────────┤
│  Résultat :               │
│  Investi : 12 000 $       │
│  Final   : 18 450 $       │
│  ROI     : +53.7%         │
└───────────────────────────┘
```

---

## Accessibilité & SEO

### SEO (Next.js)

Next.js 13 (Pages Router) fournit le SSR et la génération statique nativement,
ce qui favorise l'indexabilité :

- **Balises `<title>` et `<meta description>`** personnalisées par page
  via le composant `<Head>` de `next/head`.
- **Open Graph** : balises `og:title`, `og:description`, `og:image` pour
  le partage sur les réseaux sociaux.
- **URL sémantiques** : `/markets/bitcoin`, `/formation/courses/rsi-macd`.
- **Proxy API** (`/api/coingecko/*`) : les données de marché passent par
  Next.js pour éviter l'exposition de la clé API côté client et permettre
  le cache côté serveur.

### Pages publiques indexables

| Page | Contenu indexable |
|---|---|
| `/` (landing) | Présentation Alvio, fonctionnalités, CTA |
| `/pricing` | Tarifs (page statique) |

Les pages connectées (`/dashboard`, `/signals`, etc.) sont protégées
côté serveur (`getServerSideProps` + vérification JWT) — elles ne sont
pas indexées.

### Accessibilité

- Contraste respecté entre le texte blanc (`#f1f5f9`) et le fond navy
  (`#0f172a`) — ratio > 7:1 (WCAG AA).
- Navigation clavier fonctionnelle sur les formulaires d'authentification.
- Labels `aria-label` sur les boutons d'icônes (graphiques, fermeture de modales).
