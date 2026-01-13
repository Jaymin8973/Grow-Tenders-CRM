'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/dashboard');
    } else {
      router.replace('/login');
    }
  }, [isAuthenticated, router]);

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'var(--background)' }}
    >
      <div className="animate-pulse text-center">
        <div
          className="w-12 h-12 rounded-lg mx-auto mb-4 flex items-center justify-center text-xl font-bold text-white"
          style={{ background: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))' }}
        >
          S
        </div>
        <p style={{ color: 'var(--foreground-muted)' }}>Loading...</p>
      </div>
    </div>
  );
}
