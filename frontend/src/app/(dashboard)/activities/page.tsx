'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    Filter,
    ChevronLeft,
    ChevronRight,
    RefreshCw,
    ShieldAlert,
} from 'lucide-react';
import { cn, getInitials } from '@/lib/utils';
import { useRouter } from 'next/navigation';

type AuditLog = {
    id: string;
    userId: string;
    action: string;
    module: string;
    entityId?: string | null;
    oldValues?: any;
    newValues?: any;
    ipAddress?: string | null;
    userAgent?: string | null;
    createdAt: string;
    user?: {
        id: string;
        firstName?: string | null;
        lastName?: string | null;
        email?: string | null;
    };
};

type PaginatedAuditLogsResponse = {
    logs: AuditLog[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
};

function buildQuery(params: Record<string, string | undefined>) {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value && value.trim().length > 0) {
            search.set(key, value.trim());
        }
    });
    return search.toString();
}

function actionBadgeVariant(action?: string) {
    const a = (action || '').toUpperCase();
    if (a === 'DELETE') return 'destructive';
    if (a === 'CREATE') return 'default';
    return 'secondary';
}

export default function ActivitiesPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [page, setPage] = useState(1);
    const limit = 50;
    const [userId, setUserId] = useState('');
    const [module, setModule] = useState('');
    const [action, setAction] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const isSuperAdmin = user?.role === 'SUPER_ADMIN';

    useEffect(() => {
        if (user && !isSuperAdmin) {
            router.replace('/dashboard');
        }
    }, [isSuperAdmin, router, user]);

    useEffect(() => {
        setPage(1);
    }, [userId, module, action, startDate, endDate]);

    const queryString = useMemo(() => {
        return buildQuery({
            page: String(page),
            limit: String(limit),
            userId: userId || undefined,
            module: module || undefined,
            action: action || undefined,
            startDate: startDate || undefined,
            endDate: endDate || undefined,
        });
    }, [action, endDate, limit, module, page, startDate, userId]);

    const { data, isLoading, isError, error, refetch, isFetching } = useQuery<PaginatedAuditLogsResponse>({
        enabled: !!user && isSuperAdmin,
        queryKey: ['audit-logs', queryString],
        queryFn: async () => {
            const res = await apiClient.get(`/audit-logs?${queryString}`);
            return res.data;
        },
    });

    if (!user || !isSuperAdmin) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        );
    }

    if (isError) {
        const message = (error as any)?.response?.data?.message || (error as any)?.message || 'Failed to load audit logs';
        return (
            <div className="space-y-6 page-enter">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Activities</h1>
                        <p className="text-muted-foreground mt-1">Super Admin audit trail (manager + employee activity)</p>
                    </div>
                    <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
                        <RefreshCw className={cn('mr-2 h-4 w-4', isFetching && 'animate-spin')} />
                        Retry
                    </Button>
                </div>

                <Card>
                    <CardContent className="py-12">
                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                            <ShieldAlert className="h-12 w-12 mb-4 opacity-30" />
                            <p className="font-medium">Unable to load activities</p>
                            <p className="text-sm mt-1">{message}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const logs = data?.logs || [];
    const pagination = data?.pagination;

    return (
        <div className="space-y-6 page-enter">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Activities</h1>
                    <p className="text-muted-foreground mt-1">
                        Super Admin audit trail (manager + employee activity)
                    </p>
                </div>
                <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
                    <RefreshCw className={cn('mr-2 h-4 w-4', isFetching && 'animate-spin')} />
                    Refresh
                </Button>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
                        <Filter className="h-4 w-4" />
                        Filters
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                        <div>
                            <div className="text-xs text-muted-foreground mb-1">User ID</div>
                            <Input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="Filter by userId" />
                        </div>
                        <div>
                            <div className="text-xs text-muted-foreground mb-1">Module</div>
                            <Input value={module} onChange={(e) => setModule(e.target.value)} placeholder="e.g. leads" />
                        </div>
                        <div>
                            <div className="text-xs text-muted-foreground mb-1">Action</div>
                            <Input value={action} onChange={(e) => setAction(e.target.value)} placeholder="CREATE / UPDATE / DELETE" />
                        </div>
                        <div>
                            <div className="text-xs text-muted-foreground mb-1">Start Date</div>
                            <Input value={startDate} onChange={(e) => setStartDate(e.target.value)} placeholder="YYYY-MM-DD" />
                        </div>
                        <div>
                            <div className="text-xs text-muted-foreground mb-1">End Date</div>
                            <Input value={endDate} onChange={(e) => setEndDate(e.target.value)} placeholder="YYYY-MM-DD" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Logs */}
            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/40">
                                    <th className="text-left font-medium p-3">User</th>
                                    <th className="text-left font-medium p-3">Action</th>
                                    <th className="text-left font-medium p-3">Module</th>
                                    <th className="text-left font-medium p-3">Entity</th>
                                    <th className="text-left font-medium p-3">Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    [...Array(8)].map((_, i) => (
                                        <tr key={i} className="border-b">
                                            <td className="p-3 text-muted-foreground">Loading...</td>
                                            <td className="p-3" />
                                            <td className="p-3" />
                                            <td className="p-3" />
                                            <td className="p-3" />
                                        </tr>
                                    ))
                                ) : logs.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-muted-foreground">
                                            No activities found
                                        </td>
                                    </tr>
                                ) : (
                                    logs.map((log) => {
                                        const fullName = [log.user?.firstName, log.user?.lastName].filter(Boolean).join(' ');
                                        const displayName = fullName || log.user?.email || log.userId;

                                        return (
                                            <tr key={log.id} className="border-b hover:bg-muted/30">
                                                <td className="p-3">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarFallback className="text-xs">
                                                                {fullName ? getInitials(log.user?.firstName || '', log.user?.lastName || '') : 'U'}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="min-w-0">
                                                            <div className="font-medium truncate">{displayName}</div>
                                                            {log.user?.email && (
                                                                <div className="text-xs text-muted-foreground truncate">{log.user.email}</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-3">
                                                    <Badge variant={actionBadgeVariant(log.action)}>
                                                        {(log.action || '').toUpperCase()}
                                                    </Badge>
                                                </td>
                                                <td className="p-3 font-medium">{log.module}</td>
                                                <td className="p-3 text-muted-foreground">{log.entityId || '-'}</td>
                                                <td className="p-3 text-muted-foreground">
                                                    {new Date(log.createdAt).toLocaleString('en-IN')}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {pagination && pagination.totalPages > 1 && (
                        <div className="flex items-center justify-end gap-2 p-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                            >
                                <ChevronLeft className="h-4 w-4" />
                                Previous
                            </Button>
                            <div className="text-sm font-medium">
                                Page {page} of {pagination.totalPages}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                                disabled={page === pagination.totalPages}
                            >
                                Next
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
