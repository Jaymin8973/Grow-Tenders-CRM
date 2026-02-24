'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TransferRequestsPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/leads/transfer-requests');
    }, [router]);

    return null;
}
