'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';

export default function TasksPage() {
    const { user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!user) return;
        const isAdminMode = user.role === 'SUPER_ADMIN' || user.role === 'MANAGER';
        router.replace(isAdminMode ? '/dashboard' : '/today');
    }, [router, user]);

    return null;
}
