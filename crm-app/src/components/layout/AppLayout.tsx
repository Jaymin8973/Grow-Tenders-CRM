'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { cn } from '@/lib/utils';

export function AppLayout({ children }: { children: React.ReactNode }) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Prevent hydration mismatch by initially rendering a placeholder if necessary
    // or just ensuring consistent initial state. However, since we want to show the shell ASAP
    // we return the shell structure. The key is that child components like Sidebar check for mount.
    // But for the layout divs, we want to ensure they render consistently.
    // To be perfectly safe against class name mismatches from extensions or other causes:
    if (!mounted) {
        return (
            <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
                {/* Render nothing or a simple loader during hydration if complex logic is involved */}
                {/* For AppLayout, we can just render the basic container or null to be safe */}
                {/* Returning null here might cause a flash, so we return the basic shell without interactivity */}
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
            {/* Sidebar with fixed positioning logic embedded in component */}
            <Sidebar
                collapsed={sidebarCollapsed}
                onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            />

            {/* Main Content Wrapper */}
            <div
                className={cn(
                    "flex-1 flex flex-col min-h-screen transition-[margin] duration-300 ease-in-out",
                    sidebarCollapsed ? "ml-[72px]" : "ml-[260px]"
                )}
            >
                <Header onMenuClick={() => setMobileMenuOpen(!mobileMenuOpen)} />

                <main className="flex-1 p-6 w-full max-w-[1920px] mx-auto animate-in fade-in duration-500">
                    {children}
                </main>
            </div>
        </div>
    );
}
