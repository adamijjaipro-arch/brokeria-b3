/**
 * Hook useAuth — interface publique pour toutes les opérations d'authentification.
 *
 * Expose : user, isAuthenticated, isLoading, login, logout, initAuth
 */
import { useCallback, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore, AuthUser } from '@/context/authStore';
import api, { authApi } from '@/api';

export function useAuth() {
  const router = useRouter();
  const { accessToken, user, isAuthenticated, setAuth, clearAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Initialise l'auth au chargement de l'app.
   * Appelle /auth/refresh avec le cookie httpOnly pour récupérer un access token.
   * À appeler dans _app.tsx via useEffect.
   */
  const initAuth = useCallback(async () => {
    if (isAuthenticated) return; // Déjà authentifié (SPA navigation)
    try {
      // Le cookie refresh_token est envoyé automatiquement (withCredentials: true)
      const { data } = await api.post<{ accessToken: string }>('/auth/refresh');
      // Récupère le profil avec le nouveau token
      const { data: profile } = await authApi.getProfile(data.accessToken);
      setAuth(data.accessToken, profile);
    } catch {
      // Pas de cookie valide → utilisateur non connecté (état normal)
      clearAuth();
    }
  }, [isAuthenticated, setAuth, clearAuth]);

  /**
   * Étape 1 du flux MFA : vérifie email + mot de passe.
   * Retourne le preAuthToken pour continuer vers /auth/2fa.
   * L'auth n'est PAS finalisée ici — setAuth est appelé après vérification OTP + PIN.
   */
  const login = useCallback(
    async (email: string, password: string): Promise<{ preAuthToken: string }> => {
      setIsLoading(true);
      try {
        const { data } = await authApi.login(email, password);
        return data;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  /**
   * Déconnexion : invalide le refresh token côté serveur (Redis) + supprime le cookie.
   */
  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Silencieux : on déconnecte côté client quoi qu'il arrive
    }
    clearAuth();
    router.push('/login');
  }, [clearAuth, router]);

  return {
    user,
    accessToken,
    isAuthenticated,
    isLoading,
    initAuth,
    login,
    logout,
  };
}
