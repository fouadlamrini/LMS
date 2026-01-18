// providers/AuthProvider.tsx
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
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
    checkAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    // Check for existing token on mount
    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = () => {
        try {
            const storedToken = localStorage.getItem('token');
            const storedUser = localStorage.getItem('user');

            if (storedToken && storedUser) {
                setToken(storedToken);
                setUser(JSON.parse(storedUser));
            }
        } catch (error) {
            console.error('Error checking auth:', error);
            logout();
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (email: string, password: string) => {
        setIsLoading(true);
        try {
            const response = await api.post('/auth/login', { email, password });

            if (!response.data.access_token) {
                // If API returns an error message instead of token
                throw new Error(response.data.message || 'Login failed');
            }

            const tokenValue = response.data.access_token;

            // Decode JWT to get user ID
            const payload = JSON.parse(atob(tokenValue.split('.')[1]));

            // Store token
            localStorage.setItem('token', tokenValue);

            // Fetch full user data
            const userResponse = await api.get(`/users/${payload.sub}`);
            const userData: User = userResponse.data;

            localStorage.setItem('user', JSON.stringify(userData));
            setToken(tokenValue);
            setUser(userData);

            // Redirect based on role
            switch (userData.role) {
                case Role.ADMIN:
                    router.push('/admin');
                    break;
                case Role.TRAINER:
                    router.push('/trainer');
                    break;
                case Role.LEARNER:
                    router.push('/learner');
                    break;
                default:
                    router.push('/login');
            }
        } catch (error: any) {
            console.error('Login error:', error);

            // Remove any stored data
            localStorage.removeItem('token');
            localStorage.removeItem('user');

            // Extract server error message if available
            const message =
                error.response?.data?.message || // Axios error from NestJS
                error.message ||                 // JS error
                'Erreur de connexion';           // fallback

            // Throw so LoginPage can catch it and show
            throw new Error(message);
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
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

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}