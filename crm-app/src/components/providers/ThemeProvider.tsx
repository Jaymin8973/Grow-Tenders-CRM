'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
    theme: Theme;
    resolvedTheme: 'light' | 'dark';
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setTheme] = useState<Theme>('system');
    const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

    useEffect(() => {
        const stored = localStorage.getItem('theme') as Theme | null;
        if (stored) {
            setTheme(stored);
        }
    }, []);

    useEffect(() => {
        const root = document.documentElement;

        const updateTheme = () => {
            let resolved: 'light' | 'dark';

            if (theme === 'system') {
                resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            } else {
                resolved = theme;
            }

            setResolvedTheme(resolved);
            root.setAttribute('data-theme', resolved);
            root.classList.toggle('dark', resolved === 'dark');
        };

        updateTheme();

        if (theme === 'system') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            mediaQuery.addEventListener('change', updateTheme);
            return () => mediaQuery.removeEventListener('change', updateTheme);
        }
    }, [theme]);

    const handleSetTheme = (newTheme: Theme) => {
        localStorage.setItem('theme', newTheme);
        setTheme(newTheme);
    };

    return (
        <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme: handleSetTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
