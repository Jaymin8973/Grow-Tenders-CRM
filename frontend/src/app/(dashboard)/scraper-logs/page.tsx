'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    RefreshCw,
    AlertCircle,
    CheckCircle,
    Clock,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Skeleton } from '@/components/ui/skeleton';

interface ScrapeLog {
    id: string;
    startTime: string;
    endTime: string | null;
    status: 'RUNNING' | 'COMPLETED' | 'FAILED';
    tendersFound: number;
    tendersInserted: number;
    errors: string[];
}

interface PaginatedResponse {
    data: ScrapeLog[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export default function ScraperLogsPage() {
    const [page, setPage] = useState(1);
    const limit = 20;

    const { data, isLoading, refetch } = useQuery<PaginatedResponse>({
        queryKey: ['scraper-logs', page],
        queryFn: async () => {
            const res = await apiClient.get(`/scraped-tenders/logs?page=${page}&limit=${limit}`);
            return res.data;
        },
    });

    const logs = data?.data || [];
    const meta = data?.meta;

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'COMPLETED':
                return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200">Completed</Badge>;
            case 'FAILED':
                return <Badge variant="destructive">Failed</Badge>;
            case 'RUNNING':
                return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 animate-pulse">Running</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    const formatDuration = (start: string, end: string | null) => {
        if (!end) return 'Running...';
        const duration = new Date(end).getTime() - new Date(start).getTime();
        const seconds = Math.floor(duration / 1000);
        return `${seconds}s`;
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Scraper Logs</h1>
                    <p className="text-muted-foreground mt-1">
                        Monitor tender scraping job history and status
                    </p>
                </div>
                <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
                    <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg font-medium">Job History</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Status</TableHead>
                                <TableHead>Start Time</TableHead>
                                <TableHead>Duration</TableHead>
                                <TableHead className="text-center">Found</TableHead>
                                <TableHead className="text-center">Inserted</TableHead>
                                <TableHead>Errors</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                [...Array(5)].map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                                    </TableRow>
                                ))
                            ) : logs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        No logs found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                logs.map((log) => (
                                    <TableRow key={log.id}>
                                        <TableCell>{getStatusBadge(log.status)}</TableCell>
                                        <TableCell className="font-medium">
                                            {new Date(log.startTime).toLocaleString('en-IN')}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground font-mono text-xs">
                                            {formatDuration(log.startTime, log.endTime)}
                                        </TableCell>
                                        <TableCell className="text-center font-semibold">
                                            {log.tendersFound}
                                        </TableCell>
                                        <TableCell className="text-center text-emerald-600 font-semibold">
                                            {log.tendersInserted}
                                        </TableCell>
                                        <TableCell className="max-w-[300px]">
                                            {log.errors && log.errors.length > 0 ? (
                                                <div className="flex items-center text-destructive text-xs">
                                                    <AlertCircle className="h-3 w-3 mr-1" />
                                                    <span className="truncate">{log.errors[0]}</span>
                                                    {log.errors.length > 1 && (
                                                        <span className="ml-1 text-muted-foreground">
                                                            (+{log.errors.length - 1} more)
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground text-xs">-</span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>

                    {/* Pagination */}
                    {meta && meta.totalPages > 1 && (
                        <div className="flex items-center justify-end space-x-2 py-4">
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
                                Page {page} of {meta.totalPages}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                                disabled={page === meta.totalPages}
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
