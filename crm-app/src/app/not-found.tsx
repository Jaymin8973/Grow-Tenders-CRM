'use client';

import Link from 'next/link';
import { Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui';

export default function NotFound() {
    return (
        <div
            className="min-h-screen flex items-center justify-center p-8"
            style={{ background: 'var(--background)' }}
        >
            <div className="text-center max-w-md">
                <div
                    className="text-8xl font-bold mb-4"
                    style={{
                        background: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                    }}
                >
                    404
                </div>
                <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
                    Page Not Found
                </h1>
                <p className="mb-8" style={{ color: 'var(--foreground-muted)' }}>
                    Oops! The page you&apos;re looking for doesn&apos;t exist or has been moved.
                </p>
                <div className="flex items-center justify-center gap-4">
                    <Link href="/">
                        <Button>
                            <Home size={18} />
                            Go Home
                        </Button>
                    </Link>
                    <Button variant="secondary" onClick={() => window.history.back()}>
                        <ArrowLeft size={18} />
                        Go Back
                    </Button>
                </div>
            </div>
        </div>
    );
}
