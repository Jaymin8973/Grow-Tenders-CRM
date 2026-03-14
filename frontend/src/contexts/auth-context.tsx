'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api-client';

interface User {
    id: string;
    email: string;
    showEmail?: boolean;
    firstName: string;
    lastName: string;
    role: 'SUPER_ADMIN' | 'MANAGER' | 'EMPLOYEE';
    avatar?: string;
    phone?: string;
}

type ScreenKey =
    | 'today'
    | 'dashboard'
    | 'leads'
    | 'customers'
    | 'teams'
    | 'dailyReports'
    | 'scrapedTenders'
    | 'leaderboard'
    | 'inquiries'
    | 'payments'
    | 'invoices'
    | 'transferRequests'
    | 'users'
    | 'targets'
    | 'scraperLogs'
    | 'settings';

type ScreenAccessMap = Record<ScreenKey, boolean>;

interface ScreenAccessBundle {
    manager: { role: 'MANAGER'; screens: ScreenAccessMap };
    employee: { role: 'EMPLOYEE'; screens: ScreenAccessMap };
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<{ otpRequired: boolean; email?: string; otpSessionId?: string }>;
    verifySuperAdminOtp: (email: string, password: string, otp: string, otpSessionId?: string) => Promise<void>;
    logout: () => Promise<void>;
    checkRole: (allowedRoles: string[]) => boolean;
    refreshUser: () => Promise<void>;
    screenAccess: ScreenAccessMap | null;
    refreshScreenAccess: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [screenAccess, setScreenAccess] = useState<ScreenAccessMap | null>(null);
    const router = useRouter();

    useEffect(() => {
        // Check for existing session
        const storedUser = localStorage.getItem('user');
        const accessToken = localStorage.getItem('accessToken');
        const storedScreenAccess = localStorage.getItem('screenAccess');

        if (storedUser && accessToken) {
            try {
                const parsedUser = JSON.parse(storedUser);
                setUser(parsedUser);

                // Apply last known screen access immediately for smoother direct-URL loads
                if (parsedUser?.role !== 'SUPER_ADMIN' && storedScreenAccess) {
                    try {
                        setScreenAccess(JSON.parse(storedScreenAccess));
                    } catch {
                        // ignore
                    }
                }
            } catch (e) {
                localStorage.removeItem('user');
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('userId');
                localStorage.removeItem('screenAccess');
            }
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        // Whenever we have a user (session restore or login), refresh screen access in the background.
        if (!user) return;
        if (user.role === 'SUPER_ADMIN') return;

        apiClient
            .get('/permissions/screen-access')
            .then((res) => {
                const bundle = res.data as ScreenAccessBundle;
                const next = user.role === 'MANAGER' ? bundle.manager.screens : bundle.employee.screens;
                setScreenAccess(next);
                localStorage.setItem('screenAccess', JSON.stringify(next));
            })
            .catch(() => {
                // keep last known value if any
            });
    }, [user]);

    const finalizeLogin = useCallback((payload: any) => {
        const { user, accessToken, refreshToken } = payload;

        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('userId', user.id);
        localStorage.setItem('user', JSON.stringify(user));

        setUser(user);

        // Load role-level screen access configuration (best effort)
        // SUPER_ADMIN does not need it.
        if (user.role === 'SUPER_ADMIN') {
            setScreenAccess(null);
        } else {
            apiClient
                .get('/permissions/screen-access')
                .then((res) => {
                    const bundle = res.data as ScreenAccessBundle;
                    const next = user.role === 'MANAGER' ? bundle.manager.screens : bundle.employee.screens;
                    setScreenAccess(next);
                    localStorage.setItem('screenAccess', JSON.stringify(next));
                })
                .catch(() => {
                    setScreenAccess(null);
                    localStorage.removeItem('screenAccess');
                });
        }

        const dashboardPath = getDashboardPath(user.role);
        router.push(dashboardPath);
    }, [router]);

    const login = useCallback(async (email: string, password: string) => {
        const response = await apiClient.post('/auth/login', { email, password });
        if (response.data?.otpRequired) {
            return {
                otpRequired: true,
                email: response.data?.email,
                otpSessionId: response.data?.otpSessionId,
            };
        }
        finalizeLogin(response.data);
        return { otpRequired: false };
    }, [finalizeLogin]);

    const verifySuperAdminOtp = useCallback(async (email: string, password: string, otp: string, otpSessionId?: string) => {
        const response = await apiClient.post('/auth/login', { email, password, otp, otpSessionId });
        if (response.data?.otpRequired) {
            throw new Error('OTP verification failed');
        }
        finalizeLogin(response.data);
    }, [finalizeLogin]);

    const logout = useCallback(async () => {
        try {
            await apiClient.post('/auth/logout');
        } catch (e) {
            // Ignore logout errors
        } finally {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('userId');
            localStorage.removeItem('user');
            localStorage.removeItem('screenAccess');
            setUser(null);
            setScreenAccess(null);
            router.push('/login');
        }
    }, [router]);

    const checkRole = useCallback((allowedRoles: string[]) => {
        if (!user) return false;
        return allowedRoles.includes(user.role);
    }, [user]);

    const refreshUser = useCallback(async () => {
        try {
            const response = await apiClient.get('/users/profile');
            const updatedUser = response.data;
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);
        } catch (error) {
            console.error('Failed to refresh user:', error);
        }
    }, []);

    const refreshScreenAccess = useCallback(async () => {
        if (!user) return;
        if (user.role === 'SUPER_ADMIN') {
            setScreenAccess(null);
            return;
        }

        try {
            const res = await apiClient.get('/permissions/screen-access');
            const bundle = res.data as ScreenAccessBundle;
            const next = user.role === 'MANAGER' ? bundle.manager.screens : bundle.employee.screens;
            setScreenAccess(next);
            localStorage.setItem('screenAccess', JSON.stringify(next));
        } catch {
            setScreenAccess(null);
            localStorage.removeItem('screenAccess');
        }
    }, [user]);

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                isAuthenticated: !!user,
                login,
                verifySuperAdminOtp,
                logout,
                checkRole,
                refreshUser,
                screenAccess,
                refreshScreenAccess,
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

function getDashboardPath(role: string): string {
    switch (role) {
        case 'SUPER_ADMIN':
            return '/dashboard';
        case 'MANAGER':
            return '/dashboard';
        case 'EMPLOYEE':
            return '/dashboard';
        default:
            return '/dashboard';
    }
}
