# Application Mobile

---

## Vue d'ensemble

L'application mobile Alvio est développée avec **React Native 0.72.3** et
**Expo 49**, offrant une version compagnon de la plateforme web pour les
utilisateurs qui souhaitent suivre leurs signaux de trading et simuler
des stratégies DCA depuis leur smartphone.

### Rôle dans l'écosystème Alvio

L'application mobile consomme la même API NestJS que le frontend web
(`broker-ia-backend` sur le port 3001). Elle ne dispose pas d'un backend
dédié — tous les calculs, la détection de patterns et l'accès aux données
de marché passent par les mêmes endpoints REST.

### Choix technologiques

| Technologie | Version | Justification |
|---|---|---|
| **React Native** | 0.72.3 | Codebase JS/TS partageable avec le frontend web (Axios, logique métier) |
| **Expo** | 49.0.0 | Toolchain unifiée (build, test, OTA updates) sans config native Xcode/Gradle |
| **@react-navigation/stack** | ^6.3.16 | Navigation par pile — gestion du flux d'authentification |
| **@react-navigation/bottom-tabs** | ^6.5.8 | Navigation principale à 4 onglets inférieurs |
| **Axios** | ^1.4.0 | Client HTTP — même configuration d'intercepteurs que le web |
| **AsyncStorage** | ^1.17.12 | Persistance locale du token JWT entre les sessions |
| **ionicons** | ^7.2.1 | Icônes natives (compatibles iOS et Android) |

### Périmètre fonctionnel

L'application mobile couvre **5 écrans** fonctionnels. L'écran Markets
(consultation des prix CoinGecko en temps réel avec graphiques OHLCV) n'est
pas implémenté dans la version actuelle — il constitue la principale
perspective d'évolution de l'application mobile.

---

## Navigation — Structure réelle

```typescript
// mobile/src/navigation/RootNavigator.tsx
// Deux navigateurs imbriqués : Stack (auth) + Bottom Tabs (app connectée)

const RootNavigator = () => {
  const { isAuthenticated } = useAuthStore();

  return (
    <NavigationContainer>
      {isAuthenticated ? <AppTabs /> : <AuthStack />}
    </NavigationContainer>
  );
};

// ── Pile d'authentification ──────────────────────────────────────
const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
  </Stack.Navigator>
);

// ── Onglets principaux (après connexion) ────────────────────────
const AppTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarStyle: { backgroundColor: '#0f172a', borderTopColor: '#1e293b' },
      tabBarActiveTintColor: '#f59e0b',    // amber — onglet actif
      tabBarInactiveTintColor: '#94a3b8',  // slate — onglet inactif
      tabBarIcon: ({ color, size }) => {
        const icons = {
          Dashboard: 'home-outline',
          Signals:   'trending-up-outline',
          Simulator: 'calculator-outline',
          Profile:   'person-outline',
        };
        return <Ionicons name={icons[route.name]} size={size} color={color} />;
      },
    })}
  >
    <Tab.Screen name="Dashboard" component={DashboardScreen} />
    <Tab.Screen name="Signals"   component={SignalsScreen} />
    <Tab.Screen name="Simulator" component={SimulatorScreen} />
    <Tab.Screen name="Profile"   component={ProfileScreen} />
  </Tab.Navigator>
);
```

---

## Les 5 écrans réels

### Écran 1 — LoginScreen

`mobile/src/screens/auth/LoginScreen.tsx`

Formulaire email/password. Sur succès, le backend renvoie un `accessToken`
et pose le cookie `httpOnly` refresh_token (géré par le navigateur WebView
d'Expo). L'access token est persisté dans `AsyncStorage` pour survivre
aux relances de l'application.

```typescript
// mobile/src/screens/auth/LoginScreen.tsx
const LoginScreen = ({ navigation }) => {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const { setAuth } = useAuthStore();

  const handleLogin = async () => {
    setLoading(true);
    try {
      // Étape 1 : login → reçoit preAuthToken (2ème facteur requis)
      const { data } = await apiClient.post('/auth/login', { email, password });

      if (data.preAuthToken) {
        // Flux MFA : redirection vers saisie OTP
        // (simplifié dans l'app mobile — l'OTP est saisi sur la même page)
        const otpCode = await promptOtp();
        const verified = await apiClient.post('/auth/2fa/verify', {
          preAuthToken: data.preAuthToken,
          otp: otpCode,
        });
        // Persistance du token en local
        await AsyncStorage.setItem('access_token', verified.data.accessToken);
        setAuth(verified.data.accessToken, verified.data.user);
      }
    } catch (err) {
      Alert.alert('Erreur', err.response?.data?.message ?? 'Connexion échouée');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Logo Alvio — triangle + ligne ascendante */}
      <AlvioLogo color="#f59e0b" size={64} />
      <Text style={styles.title}>Alvio</Text>

      <TextInput style={styles.input} placeholder="Email"
        value={email} onChangeText={setEmail} keyboardType="email-address"
        autoCapitalize="none" placeholderTextColor="#94a3b8" />
      <TextInput style={styles.input} placeholder="Mot de passe"
        value={password} onChangeText={setPassword} secureTextEntry />

      <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading}>
        {loading ? <ActivityIndicator color="#0f172a" />
                 : <Text style={styles.btnText}>Se connecter</Text>}
      </TouchableOpacity>
    </View>
  );
};
```

---

### Écran 2 — DashboardScreen

`mobile/src/screens/dashboard/DashboardScreen.tsx`

Vue d'ensemble : signaux récents (5 derniers), statistiques rapides du mois
en cours et accès rapide aux autres écrans.

```typescript
// mobile/src/screens/dashboard/DashboardScreen.tsx
const DashboardScreen = () => {
  const [signals, setSignals]   = useState([]);
  const [stats, setStats]       = useState(null);
  const today = new Date();

  useEffect(() => {
    const load = async () => {
      const [sigRes, repRes] = await Promise.all([
        apiClient.get('/signals/recent'),    // 5 derniers signaux
        apiClient.get(`/reports/${today.getFullYear()}/${today.getMonth() + 1}`),
      ]);
      setSignals(sigRes.data);
      setStats(repRes.data);
    };
    load();
  }, []);

  return (
    <ScrollView style={styles.screen}>
      <Text style={styles.heading}>Bonjour 👋</Text>

      {/* Stats du mois */}
      {stats && (
        <View style={styles.statsRow}>
          <StatCard label="Signaux" value={stats.total_signals} color="#f59e0b" />
          <StatCard label="Win rate" value={`${stats.win_rate}%`} color="#10b981" />
          <StatCard label="P&L est." value={`${stats.total_pnl_estimate} $`}
                    color={stats.total_pnl_estimate >= 0 ? '#10b981' : '#ef4444'} />
        </View>
      )}

      {/* Liste des 5 signaux récents — design long-only : direction toujours BUY */}
      <Text style={styles.sectionTitle}>Signaux récents</Text>
      {signals.map((s) => (
        <SignalCard key={s.id}
          asset={s.asset}
          status={s.status}          // 'OPEN' ou 'CLOSED'
          confidence={s.confidence}  // 0–100 %
          entryPrice={s.entry_price}
          exitPrice={s.exit_price}   // null si OPEN
        />
      ))}
    </ScrollView>
  );
};
```

**Note de design** : les signaux sont toujours de direction `BUY` (long-only).
`SignalCard` affiche `OPEN` en vert (#10b981) et `CLOSED` en amber (#f59e0b)
si profitable, en rouge (#ef4444) si en perte.

---

### Écran 3 — SignalsScreen

`mobile/src/screens/signals/SignalsScreen.tsx`

Liste paginée des 50 derniers signaux avec filtres par statut (OPEN / CLOSED)
et par actif.

```typescript
// mobile/src/screens/signals/SignalsScreen.tsx
const SignalsScreen = () => {
  const [signals, setSignals] = useState([]);
  const [filter, setFilter]   = useState<'ALL' | 'OPEN' | 'CLOSED'>('ALL');

  useEffect(() => {
    apiClient.get('/signals').then(({ data }) => setSignals(data));
  }, []);

  const filtered = signals.filter((s) =>
    filter === 'ALL' ? true : s.status === filter
  );

  return (
    <View style={styles.screen}>
      {/* Filtres */}
      <View style={styles.filterRow}>
        {['ALL', 'OPEN', 'CLOSED'].map((f) => (
          <TouchableOpacity key={f} style={[styles.filterBtn,
            filter === f && styles.filterActive]} onPress={() => setFilter(f as any)}>
            <Text style={filter === f ? styles.filterTextActive : styles.filterText}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.signalRow}>
            <Text style={styles.asset}>{item.asset}</Text>
            {/* Barre de confiance */}
            <View style={styles.confBar}>
              <View style={[styles.confFill, { width: `${item.confidence}%`,
                backgroundColor: item.confidence > 75 ? '#10b981' : '#f59e0b' }]} />
            </View>
            <Text style={styles.conf}>{item.confidence.toFixed(1)}%</Text>
            <Text style={item.status === 'OPEN' ? styles.open : styles.closed}>
              {item.status}
            </Text>
          </View>
        )}
      />
    </View>
  );
};
```

---

### Écran 4 — SimulatorScreen

`mobile/src/screens/simulator/SimulatorScreen.tsx`

Formulaire de simulation DCA : capital initial, apport mensuel, durée, taux
de rendement annuel, mode (`fixed` ou `monte_carlo`). Les résultats sont
affichés immédiatement après le calcul.

```typescript
// mobile/src/screens/simulator/SimulatorScreen.tsx
const SimulatorScreen = () => {
  const [form, setForm] = useState({
    initialAmount:    '1000',
    monthlyAmount:    '200',
    months:           '24',
    annualReturn:     '12',
    volatility:       '5',
    mode:             'fixed' as 'fixed' | 'monte_carlo',
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const simulate = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.post('/simulator/dca', {
        asset:           'BTC',
        initialAmount:   parseFloat(form.initialAmount),
        monthlyAmount:   parseFloat(form.monthlyAmount),
        months:          parseInt(form.months),
        annualReturn:    parseFloat(form.annualReturn) / 100,
        volatility:      parseFloat(form.volatility) / 100,
        mode:            form.mode,
      });
      setResult(data.result);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.screen}>
      <Text style={styles.heading}>Simulateur DCA</Text>

      <InputField label="Capital initial ($)" value={form.initialAmount}
        onChangeText={(v) => setForm({ ...form, initialAmount: v })}
        keyboardType="numeric" />
      <InputField label="Apport mensuel ($)" value={form.monthlyAmount}
        onChangeText={(v) => setForm({ ...form, monthlyAmount: v })}
        keyboardType="numeric" />
      <InputField label="Durée (mois)" value={form.months}
        onChangeText={(v) => setForm({ ...form, months: v })}
        keyboardType="numeric" />
      <InputField label="Rendement annuel (%)" value={form.annualReturn}
        onChangeText={(v) => setForm({ ...form, annualReturn: v })}
        keyboardType="numeric" />

      {/* Mode de simulation */}
      <View style={styles.modeRow}>
        {(['fixed', 'monte_carlo'] as const).map((m) => (
          <TouchableOpacity key={m} style={[styles.modeBtn,
            form.mode === m && styles.modeBtnActive]}
            onPress={() => setForm({ ...form, mode: m })}>
            <Text style={styles.modeText}>{m === 'fixed' ? 'Fixe' : 'Monte Carlo'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.btn} onPress={simulate} disabled={loading}>
        {loading ? <ActivityIndicator color="#0f172a" />
                 : <Text style={styles.btnText}>Simuler</Text>}
      </TouchableOpacity>

      {/* Résultat */}
      {result && (
        <View style={styles.resultCard}>
          <ResultRow label="Capital investi" value={`${result.totalInvested} $`} />
          <ResultRow label="Valeur finale"   value={`${result.finalBalance} $`}
                     color="#10b981" />
          <ResultRow label="Gains totaux"    value={`${result.totalGains} $`}
                     color={result.totalGains >= 0 ? '#10b981' : '#ef4444'} />
          <ResultRow label="ROI"             value={`${result.roi.toFixed(1)} %`}
                     color="#f59e0b" />
        </View>
      )}
    </ScrollView>
  );
};
```

Le mode `monte_carlo` applique un bruit gaussien (algorithme Box-Muller)
côté backend pour simuler la volatilité du marché — chaque exécution
produit un résultat légèrement différent.

---

### Écran 5 — ProfileScreen

`mobile/src/screens/profile/ProfileScreen.tsx`

Affiche les informations du profil de l'utilisateur (username, email,
préférences de trading) et propose la déconnexion.

```typescript
// mobile/src/screens/profile/ProfileScreen.tsx
const ProfileScreen = () => {
  const { user, clearAuth } = useAuthStore();

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout'); // révoque refresh:{jti} dans Redis
    } finally {
      await AsyncStorage.removeItem('access_token'); // supprime le token local
      clearAuth();                                   // vide le store Zustand
    }
  };

  return (
    <ScrollView style={styles.screen}>
      <View style={styles.avatarZone}>
        {/* Initiales dans un cercle amber */}
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.username?.charAt(0).toUpperCase() ?? '?'}
          </Text>
        </View>
        <Text style={styles.username}>{user?.username}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Préférence de trading</Text>
        <Text style={styles.value}>{user?.trading_preference ?? 'moderate'}</Text>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Ionicons name="log-out-outline" size={20} color="#ef4444" />
        <Text style={styles.logoutText}>Se déconnecter</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};
```

---

## Intégration backend

### Configuration du client HTTP

```typescript
// mobile/src/services/apiClient.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const apiClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001',
  withCredentials: true, // transmet les cookies (refresh_token httpOnly)
  timeout: 10_000,
});

// Injection du token JWT à chaque requête
apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Refresh automatique sur 401
apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      try {
        const { data } = await axios.post(
          `${process.env.EXPO_PUBLIC_API_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        await AsyncStorage.setItem('access_token', data.accessToken);
        error.config.headers.Authorization = `Bearer ${data.accessToken}`;
        return apiClient(error.config);
      } catch {
        // Refresh échoué → déconnexion forcée
        await AsyncStorage.removeItem('access_token');
        useAuthStore.getState().clearAuth();
      }
    }
    return Promise.reject(error);
  }
);
```

### Endpoints consommés par l'application mobile

| Écran | Endpoint NestJS | Description |
|---|---|---|
| LoginScreen | `POST /auth/login` | Login → preAuthToken |
| LoginScreen | `POST /auth/2fa/verify` | Vérification OTP email |
| LoginScreen | `POST /auth/refresh` | Refresh du token JWT |
| DashboardScreen | `GET /signals/recent` | 5 signaux les plus récents |
| DashboardScreen | `GET /reports/:year/:month` | Stats du mois en cours |
| SignalsScreen | `GET /signals` | 50 derniers signaux |
| SimulatorScreen | `POST /simulator/dca` | Simulation DCA (fixed/monte_carlo) |
| SimulatorScreen | `GET /simulator/history` | Historique des simulations |
| ProfileScreen | `GET /auth/profile` | Données utilisateur |
| ProfileScreen | `POST /auth/logout` | Révocation token Redis |

---

## Perspectives d'évolution

Les fonctionnalités suivantes ne sont pas implémentées dans la version mobile
actuelle et constituent des axes de développement futurs :

| Fonctionnalité | Justification du report |
|---|---|
| Écran Markets (prix CoinGecko + OHLCV) | Implémentation complexe (graphiques natifs) — réservée à une prochaine itération |
| Module Formation (LMS mobile) | Lecture vidéo YouTube et contenu Markdown nécessitent des packages natifs supplémentaires |
| Notifications push | Dépend d'Expo Notifications + configuration côté backend (webhook signal → push) |
| Authentification GitHub OAuth | Flux OAuth nécessite un in-app browser natif (`expo-web-browser`) |
| TOTP / WebAuthn mobile | Biométrie native disponible via `expo-local-authentication` |
