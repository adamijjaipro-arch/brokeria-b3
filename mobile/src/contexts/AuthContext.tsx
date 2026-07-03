import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextType {
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (accessToken: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => setIsLoading(false), 3000);
    (async () => {
      try {
        const token = await AsyncStorage.getItem('accessToken');
        setIsLoggedIn(!!token);
      } catch {
        setIsLoggedIn(false);
      } finally {
        clearTimeout(timeout);
        setIsLoading(false);
      }
    })();
  }, []);

  const login = async (accessToken: string) => {
    await AsyncStorage.setItem('accessToken', accessToken);
    setIsLoggedIn(true);
  };

  const logout = async () => {
    await AsyncStorage.removeItem('accessToken');
    setIsLoggedIn(false);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
