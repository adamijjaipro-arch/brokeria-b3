# 📱 MOBILE - REACT NATIVE + TYPESCRIPT

## SETUP & CONFIGURATION

### 1. package.json

```json
{
  "name": "broker-ia-mobile",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "android": "react-native run-android",
    "ios": "react-native run-ios",
    "start": "react-native start",
    "lint": "eslint src --ext ts,tsx",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-native": "^0.72.0",
    "@react-navigation/native": "^6.1.0",
    "@react-navigation/bottom-tabs": "^6.5.0",
    "@react-navigation/stack": "^6.3.0",
    "axios": "^1.6.0",
    "zustand": "^4.4.1",
    "@react-native-async-storage/async-storage": "^1.21.0",
    "react-native-gesture-handler": "^2.13.0",
    "react-native-reanimated": "^3.4.0",
    "react-native-chart-kit": "^6.12.0",
    "react-native-svg": "^13.13.0",
    "react-native-vector-icons": "^10.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-native": "^0.72.0",
    "typescript": "^5.3.0",
    "@react-native-community/eslint-config": "^3.2.0"
  }
}
```

### 2. tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "jsx": "react-native",
    "declaration": true,
    "outDir": "./lib",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src"],
  "exclude": ["node_modules"]
}
```

---

## 📁 PROJECT STRUCTURE

```
mobile/
├── src/
│   ├── App.tsx                    # Root
│   ├── index.tsx                  # Entry point
│   │
│   ├── screens/
│   │   ├── LoginScreen.tsx
│   │   ├── RegisterScreen.tsx
│   │   ├── DashboardScreen.tsx
│   │   ├── SignalsScreen.tsx
│   │   ├── SimulatorScreen.tsx
│   │   └── ProfileScreen.tsx
│   │
│   ├── components/
│   │   ├── SignalCard.tsx
│   │   ├── SimpleChart.tsx
│   │   ├── FormInput.tsx
│   │   └── Button.tsx
│   │
│   ├── navigation/
│   │   ├── RootNavigator.tsx
│   │   └── types.ts
│   │
│   ├── services/
│   │   ├── api.ts
│   │   ├── auth.ts
│   │   └── storage.ts
│   │
│   ├── stores/
│   │   └── authStore.ts
│   │
│   ├── types/
│   │   └── index.ts
│   │
│   └── utils/
│       └── formatters.ts
│
├── app.json
└── package.json
```

---

## 🔌 API SERVICE

### 3. services/api.ts

```typescript
import axios, { AxiosInstance } from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'

const API_BASE_URL = 'http://YOUR_BACKEND_URL/api'  // Configure avec votre URL

class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Interceptor pour ajouter le token
    this.client.interceptors.request.use(async (config) => {
      const token = await AsyncStorage.getItem('access_token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    })

    // Interceptor pour gérer les erreurs
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          AsyncStorage.removeItem('access_token')
          // Redirect to login
        }
        return Promise.reject(error)
      }
    )
  }

  async get(url: string, config?: any) {
    return this.client.get(url, config)
  }

  async post(url: string, data?: any, config?: any) {
    return this.client.post(url, data, config)
  }

  async put(url: string, data?: any, config?: any) {
    return this.client.put(url, data, config)
  }
}

export const apiClient = new ApiClient()
```

### 4. services/auth.ts

```typescript
import { apiClient } from './api'
import { storage } from './storage'

export const authService = {
  async login(email: string, password: string) {
    const response = await apiClient.post('/auth/login', { email, password })
    const { access_token, refresh_token } = response.data
    
    await storage.setTokens(access_token, refresh_token)
    return response.data
  },

  async register(email: string, username: string, password: string) {
    const response = await apiClient.post('/auth/register', {
      email,
      username,
      password,
    })
    return response.data
  },

  async logout() {
    await storage.clearTokens()
  },
}
```

### 5. services/storage.ts

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage'

export const storage = {
  async setTokens(accessToken: string, refreshToken: string) {
    await Promise.all([
      AsyncStorage.setItem('access_token', accessToken),
      AsyncStorage.setItem('refresh_token', refreshToken),
    ])
  },

  async getAccessToken(): Promise<string | null> {
    return AsyncStorage.getItem('access_token')
  },

  async clearTokens() {
    await Promise.all([
      AsyncStorage.removeItem('access_token'),
      AsyncStorage.removeItem('refresh_token'),
    ])
  },

  async setUser(user: any) {
    await AsyncStorage.setItem('user', JSON.stringify(user))
  },

  async getUser() {
    const user = await AsyncStorage.getItem('user')
    return user ? JSON.parse(user) : null
  },
}
```

---

## 🎨 COMPONENTS

### 6. components/FormInput.tsx

```typescript
import React from 'react'
import { View, TextInput, Text, StyleSheet } from 'react-native'

interface FormInputProps {
  label: string
  placeholder: string
  value: string
  onChangeText: (text: string) => void
  secureTextEntry?: boolean
  keyboardType?: 'default' | 'email-address' | 'numeric'
}

export const FormInput: React.FC<FormInputProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = 'default',
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        placeholderTextColor="#999"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#000',
  },
})
```

### 7. components/Button.tsx

```typescript
import React from 'react'
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native'

interface ButtonProps {
  title: string
  onPress: () => void
  loading?: boolean
  disabled?: boolean
  variant?: 'primary' | 'secondary'
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        variant === 'primary' ? styles.primary : styles.secondary,
        disabled && styles.disabled,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={styles.text}>{title}</Text>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: '#2563EB',
  },
  secondary: {
    backgroundColor: '#f0f0f0',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
})
```

### 8. components/SignalCard.tsx

```typescript
import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface SignalCardProps {
  asset: string
  direction: 'BUY' | 'SELL'
  confidence: number
  patternType: string
  entryPrice: number
}

export const SignalCard: React.FC<SignalCardProps> = ({
  asset,
  direction,
  confidence,
  patternType,
  entryPrice,
}) => {
  const isBuy = direction === 'BUY'
  const backgroundColor = isBuy ? '#E8F5E9' : '#FFEBEE'
  const textColor = isBuy ? '#2E7D32' : '#C62828'

  return (
    <View style={[styles.card, { backgroundColor }]}>
      <View style={styles.header}>
        <View style={styles.assetInfo}>
          <Text style={styles.asset}>{asset}</Text>
          <Text style={styles.pattern}>{patternType}</Text>
        </View>
        <View style={[styles.directionBadge, { backgroundColor: textColor }]}>
          <Text style={styles.directionText}>{direction}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View>
          <Text style={styles.label}>Entrée</Text>
          <Text style={styles.value}>${entryPrice.toFixed(2)}</Text>
        </View>
        <View>
          <Text style={styles.label}>Confiance</Text>
          <Text style={[styles.value, { color: textColor }]}>{confidence}%</Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  assetInfo: {
    flex: 1,
  },
  asset: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  pattern: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  directionBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  directionText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
})
```

### 9. components/SimpleChart.tsx

```typescript
import React from 'react'
import { View, StyleSheet } from 'react-native'
import { LineChart } from 'react-native-chart-kit'

interface SimpleChartProps {
  data: Array<{ month: number; balance: number }>
  width: number
  height?: number
}

export const SimpleChart: React.FC<SimpleChartProps> = ({
  data,
  width,
  height = 220,
}) => {
  const chartData = {
    labels: data.map(d => `M${d.month}`),
    datasets: [
      {
        data: data.map(d => d.balance),
        color: () => '#2563EB',
        strokeWidth: 2,
      },
    ],
  }

  return (
    <View style={styles.container}>
      <LineChart
        data={chartData}
        width={width}
        height={height}
        chartConfig={{
          backgroundColor: '#fff',
          backgroundGradientFrom: '#fff',
          backgroundGradientTo: '#fff',
          decimalPlaces: 0,
          color: () => '#ddd',
          labelColor: () => '#666',
          style: { borderRadius: 8 },
        }}
        style={styles.chart}
        bezier
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 16,
  },
  chart: {
    borderRadius: 8,
  },
})
```

---

## 📱 SCREENS

### 10. screens/LoginScreen.tsx

```typescript
import React, { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native'
import { useAuthStore } from '@/stores/authStore'
import { FormInput } from '@/components/FormInput'
import { Button } from '@/components/Button'
import { authService } from '@/services/auth'

export const LoginScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const setUser = useAuthStore((state) => state.setUser)

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs')
      return
    }

    setLoading(true)
    try {
      const response = await authService.login(email, password)
      setUser({ email })
      navigation.replace('Dashboard')
    } catch (error: any) {
      Alert.alert('Erreur', error.response?.data?.detail || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Broker IA</Text>
        <Text style={styles.subtitle}>Trading Intelligence</Text>
      </View>

      <FormInput
        label="Email"
        placeholder="user@example.com"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />

      <FormInput
        label="Mot de passe"
        placeholder="••••••••"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <Button
        title="Se connecter"
        onPress={handleLogin}
        loading={loading}
      />

      <View style={styles.footer}>
        <Text style={styles.footerText}>Pas de compte? </Text>
        <Text
          style={styles.link}
          onPress={() => navigation.navigate('Register')}
        >
          S'inscrire
        </Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2563EB',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    color: '#666',
  },
  link: {
    color: '#2563EB',
    fontWeight: '600',
  },
})
```

### 11. screens/DashboardScreen.tsx

```typescript
import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native'
import { Signal } from '@/types'
import { apiClient } from '@/services/api'
import { SignalCard } from '@/components/SignalCard'
import { TrendingUp } from 'lucide-react'

export const DashboardScreen: React.FC = () => {
  const [signals, setSignals] = useState<Signal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSignals()
  }, [])

  const loadSignals = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/signals/recent?hours=24')
      setSignals(response.data)
    } catch (error) {
      console.error('Failed to load signals:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    )
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TrendingUp size={24} color="#2563EB" />
        <Text style={styles.headerTitle}>Signaux Récents</Text>
      </View>

      <View style={styles.content}>
        {signals.length === 0 ? (
          <Text style={styles.emptyText}>Aucun signal généré</Text>
        ) : (
          signals.map((signal) => (
            <SignalCard
              key={signal.id}
              asset={signal.asset}
              direction={signal.direction as 'BUY' | 'SELL'}
              confidence={signal.confidence}
              patternType={signal.pattern_type}
              entryPrice={signal.entry_price}
            />
          ))
        )}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  content: {
    padding: 12,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 40,
  },
})
```

### 12. screens/SimulatorScreen.tsx

```typescript
import React, { useState } from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { DCARequest, DCAResponse } from '@/types'
import { apiClient } from '@/services/api'
import { FormInput } from '@/components/FormInput'
import { Button } from '@/components/Button'
import { SimpleChart } from '@/components/SimpleChart'

export const SimulatorScreen: React.FC = () => {
  const [formData, setFormData] = useState<DCARequest>({
    initial_amount: 1000,
    monthly_investment: 200,
    months: 60,
    annual_return: 0.08,
  })

  const [result, setResult] = useState<DCAResponse | null>(null)
  const [loading, setLoading] = useState(false)

  const handleCalculate = async () => {
    setLoading(true)
    try {
      const response = await apiClient.post('/simulator/dca', formData)
      setResult(response.data)
    } catch (error) {
      console.error('DCA calculation failed:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.formContainer}>
        <FormInput
          label="Montant initial (€)"
          placeholder="1000"
          value={formData.initial_amount.toString()}
          onChangeText={(text) =>
            setFormData({ ...formData, initial_amount: parseFloat(text) || 0 })
          }
          keyboardType="numeric"
        />

        <FormInput
          label="Investissement mensuel (€)"
          placeholder="200"
          value={formData.monthly_investment.toString()}
          onChangeText={(text) =>
            setFormData({ ...formData, monthly_investment: parseFloat(text) || 0 })
          }
          keyboardType="numeric"
        />

        <FormInput
          label="Durée (mois)"
          placeholder="60"
          value={formData.months.toString()}
          onChangeText={(text) =>
            setFormData({ ...formData, months: parseInt(text) || 0 })
          }
          keyboardType="numeric"
        />

        <FormInput
          label="Rendement annuel (%)"
          placeholder="8"
          value={(formData.annual_return! * 100).toString()}
          onChangeText={(text) =>
            setFormData({ ...formData, annual_return: parseFloat(text) / 100 || 0 })
          }
          keyboardType="numeric"
        />

        <Button
          title="Calculer"
          onPress={handleCalculate}
          loading={loading}
        />
      </View>

      {result && (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>Résultats</Text>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Montant final</Text>
            <Text style={styles.statValue}>€{result.final_amount.toFixed(2)}</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Gains</Text>
            <Text style={[styles.statValue, { color: '#10B981' }]}>
              €{result.gains.toFixed(2)}
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>ROI</Text>
            <Text style={[styles.statValue, { color: '#2563EB' }]}>
              {result.roi.toFixed(2)}%
            </Text>
          </View>

          <SimpleChart data={result.monthly_data} width={350} />
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  formContainer: {
    padding: 16,
    backgroundColor: '#fff',
    margin: 12,
    borderRadius: 8,
  },
  resultsContainer: {
    padding: 16,
    backgroundColor: '#fff',
    margin: 12,
    borderRadius: 8,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
})
```

---

## 🧭 NAVIGATION

### 13. navigation/RootNavigator.tsx

```typescript
import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { useAuthStore } from '@/stores/authStore'

// Screens
import { LoginScreen } from '@/screens/LoginScreen'
import { DashboardScreen } from '@/screens/DashboardScreen'
import { SignalsScreen } from '@/screens/SignalsScreen'
import { SimulatorScreen } from '@/screens/SimulatorScreen'
import { ProfileScreen } from '@/screens/ProfileScreen'

const Stack = createStackNavigator()
const Tab = createBottomTabNavigator()

const AuthNavigator = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="Login"
      component={LoginScreen}
      options={{ headerShown: false }}
    />
  </Stack.Navigator>
)

const AppNavigator = () => (
  <Tab.Navigator
    screenOptions={{
      headerTitleAlign: 'center',
      tabBarActiveTintColor: '#2563EB',
      tabBarInactiveTintColor: '#999',
    }}
  >
    <Tab.Screen
      name="Dashboard"
      component={DashboardScreen}
      options={{ title: 'Tableau de bord' }}
    />
    <Tab.Screen
      name="Signals"
      component={SignalsScreen}
      options={{ title: 'Signaux' }}
    />
    <Tab.Screen
      name="Simulator"
      component={SimulatorScreen}
      options={{ title: 'Simulateur' }}
    />
    <Tab.Screen
      name="Profile"
      component={ProfileScreen}
      options={{ title: 'Profil' }}
    />
  </Tab.Navigator>
)

export const RootNavigator = () => {
  const isAuthenticated = useAuthStore((state) => !!state.user)

  return (
    <NavigationContainer>
      {isAuthenticated ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  )
}
```

---

**Mobile React Native prêt pour:**
✅ iOS & Android deployment
✅ Same backend as web
✅ Offline support (AsyncStorage)
✅ Native performance
