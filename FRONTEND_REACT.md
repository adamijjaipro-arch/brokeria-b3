# 🎨 FRONTEND - REACT 18 + TYPESCRIPT

## SETUP & CONFIGURATION

### 1. package.json

```json
{
  "name": "broker-ia-frontend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint src --ext ts,tsx",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.18.0",
    "axios": "^1.6.0",
    "zustand": "^4.4.1",
    "tailwindcss": "^3.3.0",
    "recharts": "^2.10.0",
    "lucide-react": "^0.294.0",
    "clsx": "^2.0.0",
    "react-toastify": "^9.1.3"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@types/node": "^20.10.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.2.0",
    "tailwindcss": "^3.3.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0"
  }
}
```

### 2. tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### 3. vite.config.ts

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
```

---

## 🏗️ PROJECT STRUCTURE (Simplified)

```
src/
├── App.tsx                    # Root component
├── main.tsx                   # Entry point
├── index.css                  # Tailwind + globals
│
├── components/
│   ├── common/
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── Loading.tsx
│   │
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   └── RegisterForm.tsx
│   │
│   └── dashboard/
│       ├── SignalWidget.tsx
│       └── PerformanceWidget.tsx
│
├── pages/
│   ├── Login.tsx
│   ├── Dashboard.tsx
│   ├── Signals.tsx
│   ├── Simulator.tsx
│   └── Profile.tsx
│
├── services/
│   ├── api.ts                 # Axios config
│   ├── auth.ts                # Auth API
│   └── signals.ts             # Signals API
│
├── hooks/
│   ├── useAuth.ts
│   └── useApi.ts
│
├── stores/
│   └── authStore.ts           # Zustand store
│
└── types/
    └── index.ts               # TypeScript interfaces
```

---

## 📝 TYPES & INTERFACES

### 4. types/index.ts

```typescript
// User & Auth
export interface User {
  id: number
  email: string
  username: string
  full_name?: string
  is_active: boolean
  role: 'user' | 'admin'
  created_at: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest extends LoginRequest {
  username: string
  full_name?: string
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
}

// Signals
export interface Signal {
  id: number
  user_id: number
  asset: string
  timeframe: string
  direction: 'BUY' | 'SELL' | 'HOLD'
  pattern_type: string
  confidence: number
  entry_price: number
  stop_loss: number
  take_profit: number
  risk_reward: number
  created_at: string
  detected_patterns: string[]
  indicators: Record<string, any>
}

export interface SignalFilter {
  asset?: string
  direction?: string
  timeframe?: string
  min_confidence?: number
}

// Simulator
export interface DCARequest {
  initial_amount: number
  monthly_investment: number
  months: number
  annual_return?: number
}

export interface DCAResponse {
  initial_amount: number
  monthly_investment: number
  months: number
  total_invested: number
  final_amount: number
  gains: number
  roi: number
  monthly_data: Array<{
    month: number
    balance: number
    total_invested: number
  }>
}

// Subscription
export interface Subscription {
  id: number
  user_id: number
  plan: 'free' | 'premium' | 'elite'
  status: string
  started_at: string
  ends_at?: string
}
```

---

## 🔌 API SERVICE

### 5. services/api.ts

```typescript
import axios, { AxiosInstance } from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Interceptor pour ajouter le token JWT
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('access_token')
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
          // Redirect to login si non-authentifié
          window.location.href = '/login'
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

  async delete(url: string, config?: any) {
    return this.client.delete(url, config)
  }
}

export const apiClient = new ApiClient()
```

### 6. services/auth.ts

```typescript
import { apiClient } from './api'
import { LoginRequest, RegisterRequest, TokenResponse, User } from '@/types'

export const authService = {
  async login(credentials: LoginRequest): Promise<TokenResponse> {
    const response = await apiClient.post('/auth/login', credentials)
    return response.data
  },

  async register(data: RegisterRequest): Promise<User> {
    const response = await apiClient.post('/auth/register', data)
    return response.data
  },

  async logout() {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
  },

  async getProfile(): Promise<User> {
    const response = await apiClient.get('/users/me')
    return response.data
  },

  getStoredToken(): string | null {
    return localStorage.getItem('access_token')
  },

  setTokens(accessToken: string, refreshToken: string) {
    localStorage.setItem('access_token', accessToken)
    localStorage.setItem('refresh_token', refreshToken)
  },
}
```

### 7. services/signals.ts

```typescript
import { apiClient } from './api'
import { Signal, SignalFilter } from '@/types'

export const signalService = {
  async getSignals(filters?: SignalFilter, limit = 50, offset = 0): Promise<Signal[]> {
    const params = { ...filters, limit, offset }
    const response = await apiClient.get('/signals/', { params })
    return response.data
  },

  async getRecentSignals(hours = 24): Promise<Signal[]> {
    const response = await apiClient.get('/signals/recent', { params: { hours } })
    return response.data
  },

  async generateSignal(signal: any): Promise<Signal> {
    const response = await apiClient.post('/signals/generate', signal)
    return response.data
  },
}
```

### 8. services/simulator.ts

```typescript
import { apiClient } from './api'
import { DCARequest, DCAResponse } from '@/types'

export const simulatorService = {
  async calculateDCA(params: DCARequest): Promise<DCAResponse> {
    const response = await apiClient.post('/simulator/dca', params)
    return response.data
  },
}
```

---

## 🏪 STATE MANAGEMENT (Zustand)

### 9. stores/authStore.ts

```typescript
import { create } from 'zustand'
import { User, TokenResponse } from '@/types'
import { authService } from '@/services/auth'

interface AuthStore {
  user: User | null
  isLoading: boolean
  error: string | null
  isAuthenticated: boolean

  // Actions
  login: (email: string, password: string) => Promise<void>
  register: (email: string, username: string, password: string, fullName?: string) => Promise<void>
  logout: () => void
  setUser: (user: User | null) => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoading: false,
  error: null,
  isAuthenticated: false,

  login: async (email, password) => {
    set({ isLoading: true, error: null })
    try {
      const tokens = await authService.login({ email, password })
      authService.setTokens(tokens.access_token, tokens.refresh_token)
      // TODO: Récupérer l'user profil
      set({ isAuthenticated: true, isLoading: false })
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
    }
  },

  register: async (email, username, password, fullName) => {
    set({ isLoading: true, error: null })
    try {
      await authService.register({ email, username, password, full_name: fullName })
      set({ isLoading: false })
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
    }
  },

  logout: () => {
    authService.logout()
    set({ user: null, isAuthenticated: false })
  },

  setUser: (user) => set({ user }),
}))
```

---

## 🎯 CUSTOM HOOKS

### 10. hooks/useAuth.ts

```typescript
import { useAuthStore } from '@/stores/authStore'
import { useEffect } from 'react'

export const useAuth = () => {
  const { user, isAuthenticated, isLoading, error, login, register, logout } = useAuthStore()

  // Check si token existe au chargement
  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token && !isAuthenticated) {
      // TODO: Vérifier le token et charger le user
    }
  }, [])

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
  }
}
```

### 11. hooks/useApi.ts

```typescript
import { useState, useCallback } from 'react'
import { apiClient } from '@/services/api'

interface UseApiState<T> {
  data: T | null
  loading: boolean
  error: Error | null
}

export function useApi<T>(initialState?: T) {
  const [state, setState] = useState<UseApiState<T>>({
    data: initialState || null,
    loading: false,
    error: null,
  })

  const request = useCallback(async (url: string, method: 'GET' | 'POST' | 'PUT' = 'GET', data?: any) => {
    setState({ data: null, loading: true, error: null })
    try {
      let response
      if (method === 'GET') {
        response = await apiClient.get(url)
      } else if (method === 'POST') {
        response = await apiClient.post(url, data)
      } else {
        response = await apiClient.put(url, data)
      }
      setState({ data: response.data, loading: false, error: null })
      return response.data
    } catch (error: any) {
      setState({ data: null, loading: false, error })
      throw error
    }
  }, [])

  return { ...state, request }
}
```

---

## 🖥️ COMPONENTS

### 12. components/auth/LoginForm.tsx

```typescript
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Mail, Lock, AlertCircle } from 'lucide-react'

export const LoginForm = () => {
  const navigate = useNavigate()
  const { login, isLoading, error } = useAuth()
  const [formData, setFormData] = useState({ email: '', password: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await login(formData.email, formData.password)
      navigate('/dashboard')
    } catch (err) {
      console.error('Login failed:', err)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Broker IA</h1>
        <p className="text-gray-600 mb-6">Connectez-vous à votre compte</p>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded flex items-center gap-2">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Mail size={16} className="inline mr-2" />
              Email
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Lock size={16} className="inline mr-2" />
              Mot de passe
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50"
          >
            {isLoading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <p className="text-center text-gray-600 mt-6">
          Pas de compte?{' '}
          <a href="/register" className="text-blue-600 hover:text-blue-700 font-semibold">
            S'inscrire
          </a>
        </p>
      </div>
    </div>
  )
}
```

### 13. components/dashboard/SignalWidget.tsx

```typescript
import { useEffect, useState } from 'react'
import { Signal } from '@/types'
import { signalService } from '@/services/signals'
import { TrendingUp, TrendingDown } from 'lucide-react'

export const SignalWidget = () => {
  const [signals, setSignals] = useState<Signal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSignals()
  }, [])

  const loadSignals = async () => {
    try {
      setLoading(true)
      const data = await signalService.getRecentSignals(24)
      setSignals(data)
    } catch (error) {
      console.error('Failed to load signals:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="animate-pulse">Chargement...</div>

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Signaux Récents</h2>

      <div className="space-y-3">
        {signals.length === 0 ? (
          <p className="text-gray-500">Aucun signal généré</p>
        ) : (
          signals.map((signal) => (
            <div key={signal.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div className="flex items-center gap-3">
                {signal.direction === 'BUY' ? (
                  <TrendingUp className="text-green-600" size={20} />
                ) : (
                  <TrendingDown className="text-red-600" size={20} />
                )}
                <div>
                  <p className="font-semibold text-gray-900">{signal.asset}</p>
                  <p className="text-sm text-gray-600">{signal.pattern_type}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-bold ${signal.direction === 'BUY' ? 'text-green-600' : 'text-red-600'}`}>
                  {signal.direction}
                </p>
                <p className="text-sm text-gray-600">Confiance: {signal.confidence}%</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
```

### 14. pages/Simulator.tsx

```typescript
import { useState } from 'react'
import { DCARequest, DCAResponse } from '@/types'
import { simulatorService } from '@/services/simulator'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Calculator } from 'lucide-react'

export const Simulator = () => {
  const [formData, setFormData] = useState<DCARequest>({
    initial_amount: 1000,
    monthly_investment: 200,
    months: 60,
    annual_return: 0.08,
  })

  const [result, setResult] = useState<DCAResponse | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const data = await simulatorService.calculateDCA(formData)
      setResult(data)
    } catch (error) {
      console.error('DCA calculation failed:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-2">
          <Calculator size={32} />
          Simulateur DCA
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Paramètres</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Montant initial (€)
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={formData.initial_amount}
                  onChange={(e) =>
                    setFormData({ ...formData, initial_amount: parseFloat(e.target.value) })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Investissement mensuel (€)
                </label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={formData.monthly_investment}
                  onChange={(e) =>
                    setFormData({ ...formData, monthly_investment: parseFloat(e.target.value) })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Durée (mois)
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.months}
                  onChange={(e) =>
                    setFormData({ ...formData, months: parseInt(e.target.value) })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rendement annuel (%)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={formData.annual_return! * 100}
                  onChange={(e) =>
                    setFormData({ ...formData, annual_return: parseFloat(e.target.value) / 100 })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50"
              >
                {loading ? 'Calcul...' : 'Calculer'}
              </button>
            </form>
          </div>

          {/* Results */}
          {result && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Résultats</h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-gray-600">Total investi</span>
                  <span className="font-semibold text-gray-900">{result.total_invested.toFixed(2)}€</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-gray-600">Montant final</span>
                  <span className="font-bold text-green-600 text-lg">{result.final_amount.toFixed(2)}€</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                  <span className="text-gray-600">Gains</span>
                  <span className="font-bold text-green-600">{result.gains.toFixed(2)}€</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                  <span className="text-gray-600">ROI</span>
                  <span className="font-bold text-blue-600">{result.roi.toFixed(2)}%</span>
                </div>
              </div>

              {/* Chart */}
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={result.monthly_data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `€${value.toFixed(2)}`} />
                  <Legend />
                  <Line type="monotone" dataKey="balance" stroke="#3B82F6" name="Solde" />
                  <Line type="monotone" dataKey="total_invested" stroke="#10B981" name="Total investi" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
```

---

## 🚀 MAIN APP

### 15. App.tsx

```typescript
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { LoginForm } from '@/components/auth/LoginForm'
import { Dashboard } from '@/pages/Dashboard'
import { Simulator } from '@/pages/Simulator'

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

export function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginForm />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/simulator"
          element={
            <ProtectedRoute>
              <Simulator />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  )
}
```

### 16. main.tsx

```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

---

**Frontend React prêt pour:**
✅ Production build
✅ Déploiement Vercel/Netlify
✅ TypeScript strict mode
✅ Responsive design
