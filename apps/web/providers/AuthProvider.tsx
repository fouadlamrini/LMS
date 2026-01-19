'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/types';
import api from '@/lib/axios';
import { Role } from '@/types/enums';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Helper: Redirect user based on their role
  const navigateByRole = useCallback((role: Role) => {
    const routes = {
      [Role.ADMIN]: '/admin/dashoard',
      [Role.TRAINER]: '/trainer/dashoard',
      [Role.LEARNER]: '/learner/dashoard',
    };
    router.push(routes[role] || '/login');
  }, [router]);

  // Helper: Clear local storage and state
  const clearAuth = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }, []);

  const checkAuth = useCallback(async () => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      setIsLoading(false);
      return;
    }

    try {
      setToken(storedToken);
      const { data } = await api.get('/auth/me');
      setUser(data);

      // Only auto-redirect if specifically on the login page during mount
      if (window.location.pathname === '/login') {
        navigateByRole(data.role);
      }
    } catch (error) {
      clearAuth();
    } finally {
      setIsLoading(false);
    }
  }, [navigateByRole, clearAuth]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });

      if (!data.access_token) throw new Error(data.message || 'Login failed');

      localStorage.setItem('token', data.access_token);
      setToken(data.access_token);

      // Fetch fresh user data
      const { data: userData } = await api.get('/auth/me');

      setUser(userData);

      navigateByRole(userData.role);
    } catch (error: any) {
      clearAuth();
      throw new Error(error.response?.data?.message || 'Erreur de connexion');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    clearAuth();
    router.push('/');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};