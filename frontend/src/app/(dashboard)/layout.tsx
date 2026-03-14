'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout';
import { useAuth } from '@/contexts/auth-context';

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

function pathToScreenKey(pathname: string): ScreenKey | null {
    if (pathname === '/today' || pathname.startsWith('/today/')) return 'today';
    if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) return 'dashboard';
    if (pathname === '/leads' || pathname.startsWith('/leads/')) return 'leads';
    if (pathname === '/customers' || pathname.startsWith('/customers/')) return 'customers';
    if (pathname === '/teams' || pathname.startsWith('/teams/')) return 'teams';
    if (pathname === '/daily-reports' || pathname.startsWith('/daily-reports/')) return 'dailyReports';
    if (pathname === '/scraped-tenders' || pathname.startsWith('/scraped-tenders/')) return 'scrapedTenders';
    if (pathname === '/leaderboard' || pathname.startsWith('/leaderboard/')) return 'leaderboard';
    if (pathname === '/inquiries' || pathname.startsWith('/inquiries/')) return 'inquiries';
    if (pathname === '/payments' || pathname.startsWith('/payments/')) return 'payments';
    if (pathname === '/invoices' || pathname.startsWith('/invoices/')) return 'invoices';
    if (pathname === '/leads/transfer-requests' || pathname.startsWith('/leads/transfer-requests/')) return 'transferRequests';
    if (pathname === '/users' || pathname.startsWith('/users/')) return 'users';
    if (pathname === '/targets' || pathname.startsWith('/targets/')) return 'targets';
    if (pathname === '/scraper-logs' || pathname.startsWith('/scraper-logs/')) return 'scraperLogs';
    if (pathname === '/settings' || pathname.startsWith('/settings/')) return 'settings';
    return null;
}

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { isAuthenticated, isLoading, user, screenAccess } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, isLoading, router]);

    useEffect(() => {
        if (isLoading || !isAuthenticated || !user) return;
        if (user.role === 'SUPER_ADMIN') return;
        if (!screenAccess) return;

        const key = pathToScreenKey(pathname);
        if (!key) return;

        if (screenAccess[key] === false) {
            const fallback = user.role === 'EMPLOYEE' ? '/today' : '/dashboard';
            if (pathname !== fallback) {
                router.replace(fallback);
            }
        }
    }, [isAuthenticated, isLoading, pathname, router, screenAccess, user]);

    if (isLoading || !isAuthenticated) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        );
    }

    return <MainLayout>{children}</MainLayout>;
}
