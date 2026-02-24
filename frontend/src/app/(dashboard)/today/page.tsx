'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api-client';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, Phone, CheckCircle2, Link as LinkIcon, Loader2, ClipboardList } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

export default function TodayPage() {
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const isAdminMode = user?.role === 'SUPER_ADMIN' || user?.role === 'MANAGER';

    // Today is for employees. Admins/managers can still open it, but it's not their primary view.
    const effectiveAssigneeId = useMemo(() => {
        if (!user) return undefined;
        if (!isAdminMode) return user.id;
        return undefined;
    }, [user, isAdminMode]);

    const [activeTab, setActiveTab] = useState<'today' | 'backlog'>('today');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    const { data, isLoading } = useQuery({
        queryKey: ['raw-leads', 'today-view', activeTab, statusFilter, effectiveAssigneeId],
        queryFn: async () => {
            // A2 policy:
            // - Today tab: only numbers assigned today
            // - Backlog tab: pending numbers assigned before today
            const basePath = activeTab === 'today' ? '/raw-leads/assigned-today' : '/raw-leads/backlog';

            // statusFilter is applied client-side for now since endpoints return small lists.
            // If needed, we can add a `status` query param later.
            const res = await apiClient.get(basePath);
            return res.data;
        },
        enabled: !!user,
    });

    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, status }: { id: string; status: string }) => {
            return apiClient.patch(`/raw-leads/${id}`, { status });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['raw-leads'] });
            toast({ title: 'Status updated' });
        },
        onError: (err: any) => {
            toast({
                title: 'Failed to update status',
                description: err.response?.data?.message || 'Something went wrong',
                variant: 'destructive',
            });
        },
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'UNTOUCHED':
                return <Badge variant="secondary">Untouched</Badge>;
            case 'CALL_LATER':
                return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Call Later</Badge>;
            case 'INTERESTED':
                return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Interested</Badge>;
            case 'NOT_INTERESTED':
                return <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200">Not Interested</Badge>;
            case 'DND':
                return <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300">DND</Badge>;
            case 'INVALID':
                return <Badge variant="destructive">Invalid</Badge>;
            default:
                return <Badge>{status}</Badge>;
        }
    };

    return (
        <div className="space-y-6 page-enter">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <ClipboardList className="h-6 w-6 text-primary" />
                        Today
                    </h1>
                    <p className="text-muted-foreground">
                        Your assigned calling list for today.
                    </p>
                </div>

                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => queryClient.invalidateQueries({ queryKey: ['raw-leads'] })}
                    >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>

                    <Button onClick={() => router.push('/daily-reports')}>
                        End of Day Report
                    </Button>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
                <TabsList>
                    <TabsTrigger value="today">Today</TabsTrigger>
                    <TabsTrigger value="backlog">Backlog</TabsTrigger>
                </TabsList>
            </Tabs>

            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4 items-center">
                        <div className="w-full sm:w-56">
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Statuses" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="UNTOUCHED">Untouched</SelectItem>
                                    <SelectItem value="CALL_LATER">Call Later</SelectItem>
                                    <SelectItem value="INTERESTED">Interested</SelectItem>
                                    <SelectItem value="NOT_INTERESTED">Not Interested</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {isAdminMode && (
                            <div className="text-sm text-muted-foreground">
                                This page is optimized for employees. Use Telecalling page for assignment.
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        {activeTab === 'today' ? 'Today Calling List' : 'Backlog Calling List'}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="w-[150px]">Date Added</TableHead>
                                <TableHead>Phone Number</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Source / Batch</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                    </TableCell>
                                </TableRow>
                            ) : (Array.isArray(data) ? data.length === 0 : data?.items?.length === 0) ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                        No numbers assigned.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                (Array.isArray(data) ? data : data?.items || []).filter((lead: any) => {
                                    if (statusFilter === 'all') return true;
                                    return lead.status === statusFilter;
                                }).map((lead: any) => (
                                    <TableRow key={lead.id} className="hover:bg-muted/30">
                                        <TableCell className="text-sm font-medium">
                                            {format(new Date(lead.createdAt), 'MMM d, yyyy')}
                                        </TableCell>
                                        <TableCell>
                                            <a href={`tel:${lead.phone}`} className="font-semibold text-primary hover:underline">
                                                {lead.phone}
                                            </a>
                                        </TableCell>
                                        <TableCell>{getStatusBadge(lead.status)}</TableCell>
                                        <TableCell>
                                            <div className="text-xs text-muted-foreground">
                                                <div>{lead.source || '-'}</div>
                                                <div className="font-medium">{lead.batchName}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {lead.status === 'INTERESTED' && !lead.convertedLeadId ? (
                                                <Button
                                                    size="sm"
                                                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                                    onClick={() => router.push(`/leads/new?phone=${encodeURIComponent(lead.phone)}&rawId=${lead.id}`)}
                                                >
                                                    <CheckCircle2 className="h-4 w-4 mr-1" />
                                                    Convert to Lead
                                                </Button>
                                            ) : lead.convertedLeadId ? (
                                                <Button size="sm" variant="outline" onClick={() => router.push(`/leads/${lead.convertedLeadId}`)}>
                                                    <LinkIcon className="h-4 w-4 mr-1" />
                                                    View Lead
                                                </Button>
                                            ) : (
                                                <div className="flex gap-2 justify-end">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-8 text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                                        onClick={() => updateStatusMutation.mutate({ id: lead.id, status: 'INTERESTED' })}
                                                        disabled={updateStatusMutation.isPending}
                                                    >
                                                        Interested
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-8 text-xs border-rose-200 text-rose-700 hover:bg-rose-50"
                                                        onClick={() => updateStatusMutation.mutate({ id: lead.id, status: 'NOT_INTERESTED' })}
                                                        disabled={updateStatusMutation.isPending}
                                                    >
                                                        Not Interested
                                                    </Button>
                                                </div>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <div className="flex justify-between items-center text-sm text-muted-foreground">
                <div>
                    Showing {Array.isArray(data) ? data.length : (data?.items?.length || 0)} numbers
                </div>
            </div>
        </div>
    );
}
