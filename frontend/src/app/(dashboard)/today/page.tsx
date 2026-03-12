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
import { RefreshCw, Phone, Loader2, ClipboardList, ChevronRight } from 'lucide-react';
import { getInitials, formatCurrency, formatNumber, cn } from '@/lib/utils';
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

    const [statusFilter, setStatusFilter] = useState<string>('all');

    const { data, isLoading } = useQuery({
        queryKey: ['leads', 'today-tasks-view', statusFilter, effectiveAssigneeId],
        queryFn: async () => {
            if (!effectiveAssigneeId) return { items: [] };
            const params = new URLSearchParams();
            params.append('assigneeId', effectiveAssigneeId);
            params.append('todayTasks', 'true');
            const res = await apiClient.get(`/leads?${params.toString()}`);
            return res.data;
        },
        enabled: !!user,
    });

    const leadCount = (data?.items?.length || 0);

    const getLeadStatusBadge = (status: string) => {
        switch (status) {
            case 'HOT_LEAD':
                return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Hot</Badge>;
            case 'WARM_LEAD':
                return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Warm</Badge>;
            case 'WEBSITE_LEAD':
                return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Website</Badge>;
            case 'COLD_LEAD':
                return <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200">Cold</Badge>;
            case 'PROPOSAL_LEAD':
                return <Badge variant="outline" className="bg-violet-50 text-violet-700 border-violet-200">Proposal</Badge>;
            case 'CLOSED_LEAD':
                return <Badge variant="secondary">Closed</Badge>;
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
                        Your follow-ups due today.
                    </p>
                </div>

                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => {
                            queryClient.invalidateQueries({ queryKey: ['leads'] });
                        }}
                    >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>

                    <Button onClick={() => router.push('/daily-reports')}>
                        End of Day Report
                    </Button>
                </div>
            </div>

            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4 items-center">
                        <Tabs value="leads">
                            <TabsList>
                                <TabsTrigger value="leads">Leads ({formatNumber(leadCount)})</TabsTrigger>
                            </TabsList>
                        </Tabs>

                        <div className="w-full sm:w-56">
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Statuses" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="COLD_LEAD">Cold Lead</SelectItem>
                                    <SelectItem value="WARM_LEAD">Warm Lead</SelectItem>
                                    <SelectItem value="HOT_LEAD">Hot Lead</SelectItem>
                                    <SelectItem value="WEBSITE_LEAD">Website Lead</SelectItem>
                                    <SelectItem value="PROPOSAL_LEAD">Proposal Lead</SelectItem>
                                    <SelectItem value="CLOSED_LEAD">Closed Lead</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {isAdminMode && (
                            <div className="text-sm text-muted-foreground">
                                This page is optimized for employees.
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Lead Follow-ups (Today)
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="w-[160px]">Due</TableHead>
                                <TableHead>Lead</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="w-[220px]">Phone</TableHead>
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
                            ) : ((data?.items?.length || 0) === 0) ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                        No lead follow-ups due today.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                (data?.items || []).filter((lead: any) => {
                                    if (statusFilter === 'all') return true;
                                    return lead.status === statusFilter;
                                }).map((lead: any) => (
                                    <TableRow
                                        key={lead.id}
                                        className="hover:bg-muted/30 cursor-pointer"
                                        onClick={() => router.push(`/leads/${lead.id}`)}
                                    >
                                        <TableCell className="text-sm font-medium">
                                            {lead.nextFollowUp ? format(new Date(lead.nextFollowUp), 'MMM d, yyyy') : '-'}
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-0.5">
                                                <div className="font-semibold">
                                                    {lead.firstName} {lead.lastName}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {lead.company || '—'}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>{getLeadStatusBadge(lead.status)}</TableCell>
                                        <TableCell onClick={(e) => e.stopPropagation()}>
                                            <a href={`tel:${lead.mobile || lead.phone}`} className="font-semibold text-primary hover:underline">
                                                {lead.mobile || lead.phone || '-'}
                                            </a>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-8 text-xs"
                                                onClick={() => router.push(`/leads/${lead.id}`)}
                                            >
                                                View
                                                <ChevronRight className="h-4 w-4 ml-1" />
                                            </Button>
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
                    Showing {formatNumber(leadCount)} tasks
                </div>
            </div>
        </div>
    );
}
