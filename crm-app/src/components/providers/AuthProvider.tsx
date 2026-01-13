'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User, Role } from '@/lib/utils';
import { api } from '@/lib/api';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    hasRole: (roles: Role | Role[]) => boolean;
    token: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('crm_user');
            if (stored) {
                try {
                    const data = JSON.parse(stored);
                    if (data.user && data.token) {
                        setUser(data.user);
                        setToken(data.token);
                    }
                } catch (e) {
                    console.error("Failed to parse user from local storage", e);
                }
            }
        }
    }, []);

    const login = async (email: string, password: string) => {
        try {
            const data = await api.login({ email, password });

            setUser(data.user);
            setToken(data.token);

            localStorage.setItem('crm_user', JSON.stringify({
                user: data.user,
                token: data.token
            }));
        } catch (error: any) {
            console.error('Login failed:', error);
            throw new Error(error.message || 'Invalid email or password');
        }
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('crm_user');
    };

    const hasRole = (roles: Role | Role[]) => {
        if (!user) return false;
        const roleArray = Array.isArray(roles) ? roles : [roles];
        return roleArray.includes(user.role);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
                login,
                logout,
                hasRole,
                token,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
