/**
 * Store d'authentification en mémoire.
 *
 * Architecture :
 *   - Access token → en mémoire (ce store). Jamais dans localStorage ni cookie JS.
 *   - Refresh token → cookie httpOnly posé par le backend.
 *
 * Remplace zustand par une implémentation légère compatible SSR/Next.js 13.
 */
import { useState, useEffect } from 'react';
import type { AuthUser, AuthState } from '@/types';

export type { AuthUser } from '@/types';

// État global en mémoire
let _state: AuthState = {
  accessToken: null,
  user: null,
  isAuthenticated: false,
};

// Abonnés React (pour déclencher les re-renders)
const _listeners = new Set<() => void>();

const _notify = () => _listeners.forEach((l) => l());

const _setAuth = (token: string, user: AuthUser) => {
  _state = { accessToken: token, user, isAuthenticated: true };
  _notify();
};

const _clearAuth = () => {
  _state = { accessToken: null, user: null, isAuthenticated: false };
  _notify();
};

// Hook React — même API qu'un store zustand
export function useAuthStore() {
  const [, rerender] = useState(0);

  useEffect(() => {
    const listener = () => rerender((n) => n + 1);
    _listeners.add(listener);
    return () => {
      _listeners.delete(listener);
    };
  }, []);

  return {
    ..._state,
    setAuth: _setAuth,
    clearAuth: _clearAuth,
  };
}

// Accès hors React (intercepteurs Axios dans api.ts)
useAuthStore.getState = () => ({
  ..._state,
  setAuth: _setAuth,
  clearAuth: _clearAuth,
});
