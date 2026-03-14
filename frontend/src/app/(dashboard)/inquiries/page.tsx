'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { apiClient } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { BulkAssignInquiriesDialog } from '@/components/inquiries/bulk-assign-inquiries-dialog';
import { Checkbox } from '@/components/ui/checkbox';

interface Inquiry {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    type?: string | null;
    subject: string;
    message: string;
    assignee?: {
        id: string;
        firstName: string;
        lastName: string;
        role: string;
    } | null;
    createdAt: string;
}

interface PaginatedResponse {
    items: Inquiry[];
    page: number;
    pageSize: number;
    total: number;
}

export default function InquiriesPage() {
    const { user } = useAuth();
    const [page, setPage] = useState(1);
    const [pageSize] = useState(25);
    const [search, setSearch] = useState('');
    const router = useRouter();
    const [bulkAssignOpen, setBulkAssignOpen] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const isSuperAdmin = user?.role === 'SUPER_ADMIN';
    const isEmployee = user?.role === 'EMPLOYEE';
    const canView = isSuperAdmin || isEmployee;

    const { data, isLoading, refetch } = useQuery<PaginatedResponse>({
        queryKey: ['inquiries', page, pageSize, search],
        queryFn: async () => {
            const params = new URLSearchParams();
            params.set('page', String(page));
            params.set('pageSize', String(pageSize));
            if (search.trim()) params.set('search', search.trim());
            const res = await apiClient.get(`/inquiries?${params.toString()}`);
            return res.data;
        },
        enabled: !!canView,
    });

    if (!canView) {
        return (
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Inquiries</h1>
                <p className="text-muted-foreground">This screen is not available for your role.</p>
            </div>
        );
    }

    const items = data?.items || [];
    const total = data?.total || 0;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const allVisibleIds = useMemo(() => items.map((x) => x.id), [items]);
    const allSelectedOnPage = useMemo(() => {
        if (allVisibleIds.length === 0) return false;
        return allVisibleIds.every((id) => selectedIds.includes(id));
    }, [allVisibleIds, selectedIds]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Inquiries</h1>
                    <p className="text-muted-foreground mt-1">Website contact form submissions</p>
                </div>
                <div className="flex items-center gap-2">
                    {isSuperAdmin && selectedIds.length > 0 && (
                        <Button variant="default" onClick={() => setBulkAssignOpen(true)} disabled={isLoading}>
                            Bulk Assign ({selectedIds.length})
                        </Button>
                    )}
                    <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
                        Refresh
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg font-medium">All Inquiries</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-3 items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                className="pl-10"
                                placeholder="Search name, email, subject, message..."
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setPage(1);
                                }}
                            />
                        </div>
                    </div>

                    <Table>
                        <TableHeader>
                            <TableRow>
                                {isSuperAdmin && (
                                    <TableHead className="w-[40px]">
                                        <Checkbox
                                            checked={allSelectedOnPage}
                                            onCheckedChange={(v) => {
                                                const checked = v === true;
                                                if (checked) {
                                                    const next = new Set(selectedIds);
                                                    allVisibleIds.forEach((id) => next.add(id));
                                                    setSelectedIds(Array.from(next));
                                                } else {
                                                    setSelectedIds((prev) => prev.filter((id) => !allVisibleIds.includes(id)));
                                                }
                                            }}
                                            aria-label="Select all inquiries on page"
                                        />
                                    </TableHead>
                                )}
                                <TableHead>Date</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Phone</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Assignee</TableHead>
                                <TableHead>Subject</TableHead>
                                <TableHead className="max-w-[450px]">Message</TableHead>
                                {(isSuperAdmin || isEmployee) && <TableHead className="text-right">Action</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                [...Array(6)].map((_, i) => (
                                    <TableRow key={i}>
                                        {isSuperAdmin && (
                                            <TableCell>
                                                <Skeleton className="h-4 w-4" />
                                            </TableCell>
                                        )}
                                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-44" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-[400px]" /></TableCell>
                                        {isSuperAdmin && (
                                            <TableCell><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                                        )}
                                    </TableRow>
                                ))
                            ) : items.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={isSuperAdmin ? 10 : 8}
                                        className="text-center py-10 text-muted-foreground"
                                    >
                                        No inquiries found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                items.map((inq) => (
                                    <TableRow key={inq.id}>
                                        {isSuperAdmin && (
                                            <TableCell>
                                                <Checkbox
                                                    checked={selectedIds.includes(inq.id)}
                                                    onCheckedChange={(v) => {
                                                        const checked = v === true;
                                                        setSelectedIds((prev) =>
                                                            checked
                                                                ? Array.from(new Set([...prev, inq.id]))
                                                                : prev.filter((x) => x !== inq.id)
                                                        );
                                                    }}
                                                    aria-label={`Select inquiry ${inq.id}`}
                                                />
                                            </TableCell>
                                        )}
                                        <TableCell className="text-muted-foreground whitespace-nowrap">
                                            {new Date(inq.createdAt).toLocaleString('en-IN')}
                                        </TableCell>
                                        <TableCell className="font-medium">{inq.name}</TableCell>
                                        <TableCell className="text-muted-foreground">{inq.email}</TableCell>
                                        <TableCell className="text-muted-foreground">{inq.phone || '-'}</TableCell>
                                        <TableCell className="text-muted-foreground">{inq.type || '-'}</TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {inq.assignee ? `${inq.assignee.firstName} ${inq.assignee.lastName}` : '-'}
                                        </TableCell>
                                        <TableCell>{inq.subject}</TableCell>
                                        <TableCell className="max-w-[450px] truncate" title={inq.message}>
                                            {inq.message}
                                        </TableCell>
                                        {(isSuperAdmin || (isEmployee && inq.assignee?.id === user?.id)) && (
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="default"
                                                    size="sm"
                                                    onClick={() => {
                                                        router.push(`/leads/new?inquiryId=${inq.id}`);
                                                    }}
                                                >
                                                    Convert to Lead
                                                </Button>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>

                    {isSuperAdmin && (
                        <BulkAssignInquiriesDialog
                            open={bulkAssignOpen}
                            onOpenChange={setBulkAssignOpen}
                            selectedInquiries={selectedIds}
                            onSuccess={() => setSelectedIds([])}
                        />
                    )}

                    {totalPages > 1 && (
                        <div className="flex items-center justify-end gap-2 py-2">
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
                                Page {page} of {totalPages}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
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
