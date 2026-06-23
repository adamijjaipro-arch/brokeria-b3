# Application Web

---

## Vue d'ensemble

L'application web Alvio est construite avec **Next.js 13.4.0** en **Pages Router**
(le dossier `frontend-web/pages/` contient l'ensemble des routes). Elle joue le
rôle d'interface utilisateur complète : dashboard temps réel, gestion des
stratégies IA, consultation des marchés avec graphiques chandeliers, module de
formation (LMS), simulateur DCA, rapports mensuels et panneau de sécurité MFA.

### Choix technologiques

| Technologie | Version | Justification |
|---|---|---|
| **Next.js 13** (Pages Router) | 13.4.0 | SSR natif pour le SEO des pages publiques, routing basé sur le système de fichiers |
| **Zustand** | ^4.5.7 | Store global léger — gestion du token JWT en mémoire (pas de `localStorage`) |
| **Axios** | ^1.4.0 | Client HTTP avec intercepteurs — refresh automatique du JWT sur erreur 401 |
| **Tailwind CSS** | ^3.3.0 | Utility-first — cohérence avec la charte navy/amber/green/violet |
| **lightweight-charts** | ^4.2.3 | Bibliothèque TradingView — graphiques OHLCV chandelier hautes performances |
| **framer-motion** | ^12.34.1 | Animations des cartes, modales et transitions de page |
| **@simplewebauthn/browser** | ^10.0.0 | WebAuthn FIDO2 côté navigateur (enrôlement + authentification) |
| **next-themes** | ^0.4.6 | Basculement dark/light mode |

### Structure des pages (réelle)

```
frontend-web/pages/
├── index.tsx                     ← Landing page (publique, indexée)
├── login.tsx / register.tsx      ← Auth (publiques)
├── dashboard/index.tsx           ← Vue d'ensemble (protégée)
├── markets/index.tsx             ← Top 20 cryptos
│   └── markets/[id].tsx          ← Détail + graphique OHLCV
├── strategies/index.tsx
│   ├── strategies/new.tsx
│   └── strategies/import.tsx     ← Upload PDF → Claude
├── signals/index.tsx
│   └── signals/[id].tsx
├── formation/index.tsx
│   └── formation/[courseId]/[lessonId].tsx
├── simulator/index.tsx           ← DCA
├── reports/index.tsx
├── profile/index.tsx
│   └── profile/security.tsx      ← MFA (TOTP, WebAuthn, PIN)
├── auth/                         ← 2fa, magic, pin, setup-pin, locked,
│                                    github-callback, totp-setup/verify,
│                                    webauthn-setup, create-password
└── api/coingecko/                ← Proxy Next.js (3 routes)
    ├── markets.ts
    ├── coins/[id].ts
    └── ohlc/[id].ts
```

---

## Authentification — flux côté client

### Gestion du token JWT (Zustand store)

L'access token est stocké **exclusivement en mémoire** dans le store Zustand
(jamais dans `localStorage` ni `sessionStorage`). Le refresh token est dans un
cookie `httpOnly` — invisible aux scripts JS.

```typescript
// frontend-web/stores/authStore.ts (pattern Zustand)
interface AuthState {
  accessToken: string | null;
  user: { id: string; email: string; username: string } | null;
  setAuth: (token: string, user: AuthState['user']) => void;
  clearAuth: () => void;
}

const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  setAuth: (token, user) => set({ accessToken: token, user }),
  clearAuth: () => set({ accessToken: null, user: null }),
}));
```

### Intercepteurs Axios — refresh automatique

```typescript
// frontend-web/lib/apiClient.ts
const apiClient = axios.create({ baseURL: '/api', withCredentials: true });

// Injecte le token JWT à chaque requête
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Sur 401 : tente un refresh silencieux, puis relance la requête originale
let isRefreshing = false;
apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          // POST /auth/refresh → cookie httpOnly envoyé automatiquement
          const { data } = await axios.post('/api/auth/refresh', {}, { withCredentials: true });
          useAuthStore.getState().setAuth(data.accessToken, data.user);
        } finally { isRefreshing = false; }
      }
      return apiClient(original); // relance la requête avec le nouveau token
    }
    return Promise.reject(error);
  }
);
```

### Protection des routes côté client

Les pages protégées utilisent un Higher-Order Component `withAuth` ou vérifient
le store Zustand dans `getServerSideProps` :

```typescript
// Pattern utilisé sur /dashboard, /signals, /strategies, etc.
export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const token = ctx.req.cookies['refresh_token'];
  if (!token) return { redirect: { destination: '/login', permanent: false } };
  return { props: {} };
};
```

L'absence du cookie `refresh_token` redirige immédiatement vers `/login`
côté serveur — la page protégée ne s'affiche jamais.

### Flux login complet (UI → backend)

```
1. /login : saisie email + password → POST /auth/login
2. Backend répond : { preAuthToken } (access refusé jusqu'au 2ème facteur)
3. Redirection vers /auth/2fa (saisie OTP reçu par email)
4. POST /auth/2fa/verify { preAuthToken, otp }
5. Si PIN configuré → redirect /auth/pin → POST /auth/pin/verify
6. Réponse finale : { accessToken, user }
   + cookie httpOnly refresh_token posé par le backend
7. useAuthStore.setAuth(accessToken, user) → redirect /dashboard
```

---

## Module Stratégies IA — interface d'import PDF

La page `/strategies/import` permet d'uploader un document PDF décrivant
une stratégie de trading. Le backend extrait le texte, le tronque à 15 000
caractères et le soumet à `claude-sonnet-4-6`.

```typescript
// frontend-web/pages/strategies/import.tsx (simplifié)
const handleImport = async () => {
  const form = new FormData();
  form.append('file', selectedFile);
  form.append('name', strategyName);
  form.append('asset', selectedAsset);    // ex. 'BTC'
  form.append('timeframe', timeframe);    // ex. '1h'

  const { data } = await apiClient.post('/strategies/import', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  // data.rules → StrategyRules JSON extrait par Claude
  // data.signal → Signal BUY créé si ENTRY_SIGNAL détecté
  setExtractedRules(data.rules);
};
```

**Résultat affiché** : les `StrategyRules` JSON extraites par Claude sont rendues
de manière lisible — conditions d'entrée/sortie, indicateurs, paramètres de
risk management (stop_loss %, take_profit %, confidence_score).

### Page des signaux — design long-only

```typescript
// frontend-web/pages/signals/index.tsx
// Un signal BUY OPEN = position active
// Un signal BUY CLOSED = trade terminé (exit_price renseigné)
// Il n'existe pas de signal SELL distinct dans la BDD

const statusColor = (signal: Signal) => {
  if (signal.status === 'OPEN')   return 'text-green-400';  // #10b981
  if (signal.status === 'CLOSED') {
    const profitable = signal.exit_price > signal.entry_price;
    return profitable ? 'text-green-400' : 'text-red-400';
  }
  return 'text-slate-400';
};
```

La confidence (0–100 %) est affichée comme barre de progression amber.
Les patterns détectés (`signal.patterns` JSON array) et les valeurs
d'indicateurs (`signal.indicators` JSON object) sont dépliables.

---

## Page Marchés — données CoinGecko en temps réel

### Architecture proxy Next.js → CoinGecko

Pour éviter l'exposition de la clé API côté client et permettre le cache
serveur, les appels CoinGecko passent par 3 routes API Next.js (`/api/coingecko/*`)
qui proxifient les requêtes vers `api.coingecko.com/api/v3`.

```typescript
// frontend-web/pages/api/coingecko/markets.ts
export default async function handler(req, res) {
  const response = await fetch(
    'https://api.coingecko.com/api/v3/coins/markets' +
    '?vs_currency=usd&order=market_cap_desc&per_page=20&sparkline=true',
    { headers: { 'x-cg-demo-api-key': process.env.COINGECKO_API_KEY } }
  );
  const data = await response.json();
  res.setHeader('Cache-Control', 's-maxage=60'); // cache CDN 60 s
  res.json(data);
}
```

Le backend dispose lui aussi de son propre cache Redis anti-429 (double clé
fraîche + stale 1 h) — détaillé dans la section Architecture logicielle.

### Graphique OHLCV — lightweight-charts 4.2.3

```typescript
// frontend-web/pages/markets/[id].tsx (simplifié)
import { createChart, CandlestickSeries, LineSeries } from 'lightweight-charts';

useEffect(() => {
  const chart = createChart(chartRef.current, {
    layout: { background: { color: '#0f172a' }, textColor: '#94a3b8' },
    grid: { vertLines: { color: '#1e293b' }, horzLines: { color: '#1e293b' } },
    width: chartRef.current.clientWidth,
    height: 400,
  });

  if (ohlcvMode === 'candle') {
    // Mode chandelier — données depuis /markets/:id/ohlcv (endpoint /ohlc CoinGecko)
    const series = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981', downColor: '#ef4444',
      borderUpColor: '#10b981', borderDownColor: '#ef4444',
      wickUpColor: '#10b981', wickDownColor: '#ef4444',
    });
    series.setData(ohlcvData); // [{ time, open, high, low, close }]
  } else {
    // Fallback ligne — si /ohlc CoinGecko échoue ou données insuffisantes
    const series = chart.addSeries(LineSeries, { color: '#f59e0b', lineWidth: 2 });
    series.setData(lineData);  // [{ time, value }]
  }

  return () => chart.remove();
}, [ohlcvData, ohlcvMode]);
```

**Logique de fallback** : `MarketsService.getOhlcv()` tente d'abord l'endpoint
`/coins/{id}/ohlc` (chandeliers natifs). Si CoinGecko retourne une erreur ou
des données insuffisantes, il bascule sur `/coins/{id}/market_chart` (série
de prix) — le frontend adapte l'affichage de chandelier à ligne sans action
utilisateur.

### Sélecteur de période

Les périodes disponibles (`1j`, `7j`, `30j`, `90j`) mappent sur le paramètre
`days` de l'endpoint `/markets/:id/ohlcv?days=N`. Le TTL Redis s'adapte :

| Période | Paramètre `days` | TTL cache Redis |
|---|---|---|
| 1 jour | 1 | 60 s |
| 7 jours | 7 | 180 s |
| 30 jours | 30 | 600 s |
| 90 jours | 90 | 1 800 s |

---

## Module Formation (LMS intégré)

### Modèle de données

```
Course (1) ──── (N) Lesson
   │
   └── UserProgress (N) ── (1) User
       UNIQUE [userId, lessonId]
```

Un `Course` possède un niveau (`DEBUTANT` | `INTERMEDIAIRE` | `AVANCE` | `EXPERT`),
une catégorie (ex. `analyse_technique`, `gestion_du_risque`) et un ordre
d'affichage. Chaque `Lesson` a un type : `VIDEO` (YouTube embed), `ARTICLE`
(contenu Markdown) ou `QUIZ`.

### Page catalogue `/formation`

```typescript
// frontend-web/pages/formation/index.tsx
// Affichage : cards par cours avec progression Prisma UserProgress
const { data: courses } = await apiClient.get('/formation/courses');
// Chaque cours : { id, title, level, category, duration, totalLessons,
//                  completedLessons, progressPercent }
```

Les cours sont filtrables par niveau et catégorie. La progression (% de leçons
complétées) est calculée côté backend par `FormationService` en comptant les
`UserProgress.completed === true` pour ce cours et cet utilisateur.

### Lecteur de leçon `/formation/[courseId]/[lessonId]`

```typescript
// frontend-web/pages/formation/[courseId]/[lessonId].tsx
const lesson = await apiClient.get(`/formation/lessons/${lessonId}`);

// Type VIDEO : embed YouTube
if (lesson.type === 'VIDEO') {
  return <iframe src={`https://www.youtube.com/embed/${extractYouTubeId(lesson.videoUrl)}`}
           allow="accelerometer; autoplay; encrypted-media" allowFullScreen />;
}
// Type ARTICLE : rendu Markdown
if (lesson.type === 'ARTICLE') {
  return <ReactMarkdown>{lesson.content}</ReactMarkdown>;
}
// Type QUIZ : questions/réponses depuis lesson.content (JSON)
```

### Marquage de complétion

```typescript
const markComplete = async () => {
  await apiClient.post('/formation/progress', {
    lessonId,
    courseId,
    completed: true,
    score: quizScore ?? null,
  });
  // Contrainte UNIQUE [userId, lessonId] → upsert côté Prisma, pas de doublons
};
```

---

## Sécurité en arrière-plan

### Résumé des protections côté client

| Risque | Mécanisme |
|---|---|
| Vol du token JWT | Access token en mémoire Zustand (pas de `localStorage`) |
| Accès aux pages protégées | `getServerSideProps` vérifie le cookie `refresh_token` |
| Requêtes non authentifiées | Intercepteur Axios injecte le token à chaque requête |
| Token expiré (15 min) | Intercepteur Axios déclenche `POST /auth/refresh` silencieux sur 401 |
| Exposition clé CoinGecko | Proxy Next.js `/api/coingecko/*` — clé uniquement côté serveur |
| XSS | Toutes les données API rendues via JSX React (échappement automatique) |
| CSRF | Token JWT en header (non forçable cross-origin) + cookie `SameSite: strict` |

### Gestion de la déconnexion

```typescript
// frontend-web/pages/profile/index.tsx
const logout = async () => {
  await apiClient.post('/auth/logout'); // révoque refresh:{jti} dans Redis
  useAuthStore.getState().clearAuth(); // efface l'access token de la mémoire
  // Le cookie httpOnly est effacé par le backend (Set-Cookie: refresh_token=; Max-Age=0)
  router.push('/login');
};
```

La révocation côté Redis garantit que le refresh token est invalide immédiatement,
même si l'utilisateur copie le cookie avant la déconnexion.
