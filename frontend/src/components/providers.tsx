'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { AuthProvider } from '@/contexts/auth-context';

export function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(
        () =>
            (() => {
                const qc = new QueryClient({
                    defaultOptions: {
                        queries: {
                            staleTime: 0,
                            refetchOnWindowFocus: true,
                            refetchOnReconnect: true,
                            refetchOnMount: 'always',
                        },
                        mutations: {
                            onSuccess: async () => {
                                await qc.invalidateQueries();
                            },
                        },
                    },
                });

                return qc;
            })()
    );

    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>{children}</AuthProvider>
        </QueryClientProvider>
    );
}
