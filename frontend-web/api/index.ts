/**
 * Client Axios centralisé.
 *
 * Architecture :
 *   - withCredentials: true → le cookie httpOnly refresh_token est envoyé
 *     automatiquement sur chaque requête (y compris /auth/refresh).
 *   - Access token injecté depuis le Zustand store (en mémoire).
 *   - Intercepteur 401 : appelle /auth/refresh, met à jour le store,
 *     rejoue la requête originale.
 */
import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/context/authStore';
export type { Signal, SignalStats, CreateSignalPayload, DCAParams, DCAResult, DCAMonthlyData } from '@/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // Envoie les cookies httpOnly (dont refresh_token)
});

// ─── Request interceptor : injecte le Bearer token depuis le store ────────────
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  // getState() est synchrone → pas de hook nécessaire en dehors de React
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Response interceptor 1 : déroule l'envelope { data: ... } ───────────────
api.interceptors.response.use(
  (res) => {
    if (res.data && Object.prototype.hasOwnProperty.call(res.data, 'data')) {
      res.data = res.data.data;
    }
    return res;
  },
  (error) => Promise.reject(error),
);

// Flag pour éviter plusieurs refreshes simultanés
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

// ─── Response interceptor 2 : refresh automatique sur 401 ────────────────────
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Si ce n'est pas un 401 ou si c'est déjà une tentative de refresh → on propage
    if (
      error.response?.status !== 401 ||
      originalRequest._retry ||
      originalRequest.url === '/auth/refresh'
    ) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // File d'attente : d'autres requêtes attendent le nouveau token
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // Le cookie httpOnly est envoyé automatiquement grâce à withCredentials
      const { data } = await axios.post<{ accessToken: string }>(
        `${BASE_URL}/auth/refresh`,
        {},
        { withCredentials: true },
      );

      const newToken = data.accessToken;

      // Met à jour le store Zustand (sans accéder aux hooks)
      useAuthStore.getState().setAuth(
        newToken,
        useAuthStore.getState().user!,
      );

      processQueue(null, newToken);
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      // Refresh échoué → déconnexion propre
      useAuthStore.getState().clearAuth();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

// ─── Auth API ────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ preAuthToken: string }>(
      '/auth/login',
      { email, password },
    ),

  register: (email: string, username: string, password: string) =>
    api.post<{ preAuthToken: string }>(
      '/auth/register',
      { email, username, password },
    ),

  getProfile: (token?: string) => {
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
    return api.get<{ id: string; email: string; username: string; createdAt: string }>(
      '/auth/profile',
      { headers },
    );
  },

  requestMagicLink: (email: string) =>
    api.post<{ message: string }>('/auth/magic-link/request', { email }),

  verifyMagicLink: (token: string) =>
    api.post<{ accessToken: string; user: { id: string; email: string; username: string } }>(
      '/auth/magic-link/verify',
      { token },
    ),

  verify2FA: (preAuthToken: string, otp: string) =>
    api.post<{ pinAuthToken: string; requiresPinSetup: boolean }>(
      '/auth/2fa/verify',
      { preAuthToken, otp },
    ),

  verifyPin: (pinAuthToken: string, pin: string) =>
    api.post<{ accessToken: string; user: { id: string; email: string; username: string } }>(
      '/auth/pin/verify',
      { pinAuthToken, pin },
    ),

  setupPin: (pinAuthToken: string, pin: string) =>
    api.post<{ accessToken: string; user: { id: string; email: string; username: string } }>(
      '/auth/pin/setup',
      { pinAuthToken, pin },
    ),

  setPassword: (preAuthToken: string, password: string) =>
    api.post<{ preAuthToken: string }>(
      '/auth/set-password',
      { preAuthToken, password },
    ),
};

// ─── Signals API ─────────────────────────────────────────────────────────────
import type { Signal, SignalStats, CreateSignalPayload, DCAParams, DCAResult } from '@/types';

export const signalsApi = {
  getAll: () => api.get<Signal[]>('/signals'),
  getRecent: () => api.get<Signal[]>('/signals/recent'),
  getStatistics: () => api.get<SignalStats>('/signals/statistics'),
  create: (signal: CreateSignalPayload) => api.post<Signal>('/signals', signal),
};

// ─── Simulator API ────────────────────────────────────────────────────────────
export const simulatorApi = {
  runDCA: (params: DCAParams) => api.post<DCAResult>('/simulator/dca', params),
};

// ─── TOTP MFA API ─────────────────────────────────────────────────────────────
export const totpApi = {
  getStatus: () =>
    api.get<{ totpEnabled: boolean }>('/mfa/totp/status'),

  enrollInit: () =>
    api.post<{ qrCodeDataUrl: string; secret: string }>('/mfa/totp/enroll/init'),

  enrollConfirm: (code: string) =>
    api.post<void>('/mfa/totp/enroll/confirm', { code }),

  verify: (code: string) =>
    api.post<boolean>('/mfa/totp/verify', { code }),

  disable: (code: string) =>
    api.post<void>('/mfa/totp/disable', { code }),
};

// ─── WebAuthn MFA API ─────────────────────────────────────────────────────────
export const webAuthnApi = {
  listCredentials: () =>
    api.get<Array<{ id: string; deviceType: string | null; createdAt: string; lastUsedAt: string | null }>>('/mfa/webauthn/credentials'),

  registrationOptions: () =>
    api.post<Record<string, unknown>>('/mfa/webauthn/register/options'),

  registrationVerify: (response: Record<string, unknown>) =>
    api.post<void>('/mfa/webauthn/register/verify', { response }),

  authenticationOptions: () =>
    api.post<Record<string, unknown>>('/mfa/webauthn/auth/options'),

  authenticationVerify: (response: Record<string, unknown>) =>
    api.post<boolean>('/mfa/webauthn/auth/verify', { response }),

  removeCredential: (credentialId: string) =>
    api.delete(`/mfa/webauthn/credentials/${credentialId}`),
};

export default api;
