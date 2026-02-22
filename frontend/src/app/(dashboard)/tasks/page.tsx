'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Phone,
    Upload,
    CheckCircle2,
    Search,
    RefreshCw,
    Loader2,
    Link as LinkIcon,
    UserPlus,
} from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { BulkUploadModal } from '@/app/(dashboard)/telecalling/components/bulk-upload-modal';
import { BulkAssignModal } from '@/app/(dashboard)/telecalling/components/bulk-assign-modal';
import { BulkAssignDialog } from '@/components/leads/bulk-assign-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function TasksPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const queryClient = useQueryClient();

    const isAdminMode = user?.role === 'SUPER_ADMIN' || user?.role === 'MANAGER';

    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const [page, setPage] = useState(1);
    const limit = 50;
    const [statusFilter, setStatusFilter] = useState<string>('all');

    const today = new Date();
    const defaultFrom = new Date(today.getFullYear(), today.getMonth(), 1);
    const defaultTo = today;
    const [fromDate, setFromDate] = useState<string>(defaultFrom.toISOString().slice(0, 10));
    const [toDate, setToDate] = useState<string>(defaultTo.toISOString().slice(0, 10));

    const [moduleTab, setModuleTab] = useState<'telecalling' | 'leads'>('telecalling');

    const [reportOpen, setReportOpen] = useState(false);

    const [leadsPage, setLeadsPage] = useState(1);
    const leadsPageSize = 25;
    const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
    const [isLeadsBulkAssignOpen, setIsLeadsBulkAssignOpen] = useState(false);

    const { data: teamMembers } = useQuery({
        queryKey: ['team-members'],
        queryFn: async () => {
            const response = await apiClient.get('/users');
            return response.data;
        },
        enabled: isAdminMode,
    });

    const { data, isLoading } = useQuery({
        queryKey: ['raw-leads', 'tasks', page, statusFilter, isAdminMode],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
            });
            if (statusFilter !== 'all') params.append('status', statusFilter);

            // Managers/super admins should see only the unassigned pool in Tasks.
            if (isAdminMode && moduleTab === 'telecalling') {
                params.append('assigneeId', 'unassigned');
            }

            const res = await apiClient.get(`/raw-leads?${params.toString()}`);
            return res.data;
        },
        enabled: moduleTab === 'telecalling',
    });

    const { data: leadsData, isLoading: isLeadsLoading } = useQuery({
        queryKey: ['leads', 'tasks', 'unassigned', leadsPage, leadsPageSize, moduleTab],
        queryFn: async () => {
            const params = new URLSearchParams();
            params.append('page', String(leadsPage));
            params.append('pageSize', String(leadsPageSize));
            params.append('assigneeId', 'unassigned');
            const res = await apiClient.get(`/leads?${params.toString()}`);
            return res.data;
        },
        enabled: isAdminMode && moduleTab === 'leads',
    });

    const { data: statsData, isLoading: isStatsLoading } = useQuery({
        queryKey: ['raw-leads', 'stats', fromDate, toDate, isAdminMode],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (fromDate) params.append('from', new Date(fromDate).toISOString());
            if (toDate) {
                const end = new Date(toDate);
                end.setHours(23, 59, 59, 999);
                params.append('to', end.toISOString());
            }
            const res = await apiClient.get(`/raw-leads/stats?${params.toString()}`);
            return res.data;
        },
        enabled: isAdminMode,
    });

    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
            return apiClient.patch(`/raw-leads/${id}`, { status, notes });
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
            case 'UNTOUCHED': return <Badge variant="secondary">Untouched</Badge>;
            case 'CALL_LATER': return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Call Later</Badge>;
            case 'INTERESTED': return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Interested</Badge>;
            case 'NOT_INTERESTED': return <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200">Not Interested</Badge>;
            case 'DND': return <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300">DND</Badge>;
            case 'INVALID': return <Badge variant="destructive">Invalid</Badge>;
            default: return <Badge>{status}</Badge>;
        }
    };

    const toggleSelectAll = () => {
        if (data?.items?.length === selectedIds.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(data?.items?.map((item: any) => item.id) || []);
        }
    };

    const toggleSelectOne = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleSelectAllLeads = () => {
        const items = leadsData?.items || [];
        if (items.length === 0) return;
        const allSelected = items.every((l: any) => selectedLeadIds.has(l.id));
        setSelectedLeadIds(prev => {
            const next = new Set(prev);
            if (allSelected) {
                items.forEach((l: any) => next.delete(l.id));
            } else {
                items.forEach((l: any) => next.add(l.id));
            }
            return next;
        });
    };

    const toggleSelectOneLead = (id: string) => {
        setSelectedLeadIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    return (
        <div className="space-y-6 page-enter">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <Phone className="h-6 w-6 text-primary" />
                        Telecalling Tasks
                    </h1>
                    <p className="text-muted-foreground">
                        {isAdminMode
                            ? 'Assign daily calling numbers to your team.'
                            : 'Your daily calling list assigned to you.'}
                    </p>
                </div>

                {isAdminMode && moduleTab === 'telecalling' && (
                    <div className="flex gap-2">
                        <Button onClick={() => setIsUploadModalOpen(true)} variant="outline">
                            <Upload className="h-4 w-4 mr-2" />
                            Import Data
                        </Button>
                        <Button
                            onClick={() => setIsAssignModalOpen(true)}
                            disabled={selectedIds.length === 0}
                        >
                            <UserPlus className="h-4 w-4 mr-2" />
                            Assign ({selectedIds.length})
                        </Button>
                        <Button variant="outline" onClick={() => setReportOpen(true)}>
                            View Report
                        </Button>
                    </div>
                )}

                {isAdminMode && moduleTab === 'leads' && (
                    <div className="flex gap-2">
                        <Button
                            onClick={() => setIsLeadsBulkAssignOpen(true)}
                            disabled={selectedLeadIds.size === 0}
                        >
                            <UserPlus className="h-4 w-4 mr-2" />
                            Assign ({selectedLeadIds.size})
                        </Button>
                    </div>
                )}
            </div>

            {isAdminMode ? (
                <div className="space-y-4">
                    <Tabs
                        value={moduleTab}
                        onValueChange={(v) => {
                            const next = v as 'telecalling' | 'leads';
                            setModuleTab(next);
                            setSelectedIds([]);
                            setSelectedLeadIds(new Set());
                        }}
                    >
                        <TabsList>
                            <TabsTrigger value="telecalling">Telecalling Numbers</TabsTrigger>
                            <TabsTrigger value="leads">Leads</TabsTrigger>
                        </TabsList>
                    </Tabs>

                    {moduleTab === 'telecalling' ? (
                        <>
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

                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => queryClient.invalidateQueries({ queryKey: ['raw-leads'] })}
                                        >
                                            <RefreshCw className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-0">
                                    <Table>
                                        <TableHeader className="bg-muted/50">
                                            <TableRow>
                                                <TableHead className="w-[50px]">
                                                    <Checkbox
                                                        checked={data?.items?.length > 0 && selectedIds.length === data?.items?.length}
                                                        onCheckedChange={toggleSelectAll}
                                                    />
                                                </TableHead>
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
                                                    <TableCell colSpan={6} className="h-24 text-center">
                                                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                                    </TableCell>
                                                </TableRow>
                                            ) : data?.items?.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                                        No calling data found.
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                data?.items?.map((lead: any) => (
                                                    <TableRow key={lead.id} className="hover:bg-muted/30">
                                                        <TableCell>
                                                            <Checkbox
                                                                checked={selectedIds.includes(lead.id)}
                                                                onCheckedChange={() => toggleSelectOne(lead.id)}
                                                            />
                                                        </TableCell>
                                                        <TableCell className="text-sm font-medium">
                                                            {format(new Date(lead.createdAt), 'MMM d, yyyy')}
                                                        </TableCell>
                                                        <TableCell>
                                                            <a href={`tel:${lead.phone}`} className="font-semibold text-primary hover:underline">
                                                                {lead.phone}
                                                            </a>
                                                        </TableCell>
                                                        <TableCell>
                                                            {getStatusBadge(lead.status)}
                                                        </TableCell>
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
                                                                    >
                                                                        Interested
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        className="h-8 text-xs border-rose-200 text-rose-700 hover:bg-rose-50"
                                                                        onClick={() => updateStatusMutation.mutate({ id: lead.id, status: 'NOT_INTERESTED' })}
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
                                <div>Showing {data?.items?.length || 0} numbers</div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={page === 1}
                                        onClick={() => setPage(p => p - 1)}
                                    >
                                        Previous
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={!data?.hasMore}
                                        onClick={() => setPage(p => p + 1)}
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Unassigned Leads Pool</CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <Table>
                                        <TableHeader className="bg-muted/50">
                                            <TableRow>
                                                <TableHead className="w-[50px]">
                                                    <Checkbox
                                                        checked={
                                                            (leadsData?.items?.length || 0) > 0 &&
                                                            (leadsData?.items || []).every((l: any) => selectedLeadIds.has(l.id))
                                                        }
                                                        onCheckedChange={toggleSelectAllLeads}
                                                    />
                                                </TableHead>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Company</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">Open</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {isLeadsLoading ? (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="h-24 text-center">
                                                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                                    </TableCell>
                                                </TableRow>
                                            ) : (leadsData?.items?.length || 0) === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                                        No unassigned leads found.
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                (leadsData?.items || []).map((lead: any) => (
                                                    <TableRow key={lead.id} className="hover:bg-muted/30">
                                                        <TableCell>
                                                            <Checkbox
                                                                checked={selectedLeadIds.has(lead.id)}
                                                                onCheckedChange={() => toggleSelectOneLead(lead.id)}
                                                            />
                                                        </TableCell>
                                                        <TableCell className="font-medium">
                                                            {lead.firstName} {lead.lastName}
                                                        </TableCell>
                                                        <TableCell>{lead.company || '-'}</TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline">{lead.status}</Badge>
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <Button size="sm" variant="outline" onClick={() => router.push(`/leads/${lead.id}`)}>
                                                                Open
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
                                <div>Showing {leadsData?.items?.length || 0} leads</div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={leadsPage === 1}
                                        onClick={() => setLeadsPage(p => p - 1)}
                                    >
                                        Previous
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={!!leadsData?.page && !!leadsData?.pageSize && (leadsData.page * leadsData.pageSize >= (leadsData.total ?? 0))}
                                        onClick={() => setLeadsPage(p => p + 1)}
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <>
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
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => queryClient.invalidateQueries({ queryKey: ['raw-leads'] })}
                                >
                                    <RefreshCw className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
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
                                    ) : data?.items?.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                                No calling data found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        data?.items?.map((lead: any) => (
                                            <TableRow key={lead.id} className="hover:bg-muted/30">
                                                <TableCell className="text-sm font-medium">
                                                    {format(new Date(lead.createdAt), 'MMM d, yyyy')}
                                                </TableCell>
                                                <TableCell>
                                                    <a href={`tel:${lead.phone}`} className="font-semibold text-primary hover:underline">
                                                        {lead.phone}
                                                    </a>
                                                </TableCell>
                                                <TableCell>
                                                    {getStatusBadge(lead.status)}
                                                </TableCell>
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
                                                            >
                                                                Interested
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="h-8 text-xs border-rose-200 text-rose-700 hover:bg-rose-50"
                                                                onClick={() => updateStatusMutation.mutate({ id: lead.id, status: 'NOT_INTERESTED' })}
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
                        <div>Showing {data?.items?.length || 0} numbers</div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page === 1}
                                onClick={() => setPage(p => p - 1)}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={!data?.hasMore}
                                onClick={() => setPage(p => p + 1)}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </>
            )}

            {isAdminMode && (
                <>
                    <BulkUploadModal
                        isOpen={isUploadModalOpen}
                        onClose={() => {
                            setIsUploadModalOpen(false);
                            queryClient.invalidateQueries({ queryKey: ['raw-leads'] });
                        }}
                        teamMembers={teamMembers || []}
                    />
                    <BulkAssignModal
                        isOpen={isAssignModalOpen}
                        onClose={() => {
                            setIsAssignModalOpen(false);
                            setSelectedIds([]);
                            queryClient.invalidateQueries({ queryKey: ['raw-leads'] });
                        }}
                        teamMembers={teamMembers || []}
                        selectedLeadIds={selectedIds}
                    />

                    <BulkAssignDialog
                        open={isLeadsBulkAssignOpen}
                        onOpenChange={setIsLeadsBulkAssignOpen}
                        selectedLeads={Array.from(selectedLeadIds)}
                        onSuccess={() => {
                            setSelectedLeadIds(new Set());
                            queryClient.invalidateQueries({ queryKey: ['leads'] });
                        }}
                    />

                    <Dialog open={reportOpen} onOpenChange={setReportOpen}>
                        <DialogContent className="sm:max-w-5xl">
                            <DialogHeader>
                                <DialogTitle>Telecalling Report</DialogTitle>
                            </DialogHeader>

                            <div className="space-y-4">
                                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
                                    <div className="w-full sm:w-auto">
                                        <div className="text-xs text-muted-foreground mb-1">From</div>
                                        <input
                                            type="date"
                                            value={fromDate}
                                            onChange={(e) => setFromDate(e.target.value)}
                                            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                                        />
                                    </div>
                                    <div className="w-full sm:w-auto">
                                        <div className="text-xs text-muted-foreground mb-1">To</div>
                                        <input
                                            type="date"
                                            value={toDate}
                                            onChange={(e) => setToDate(e.target.value)}
                                            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                                        />
                                    </div>
                                    <Button
                                        variant="outline"
                                        onClick={() => queryClient.invalidateQueries({ queryKey: ['raw-leads', 'stats'] })}
                                    >
                                        Refresh
                                    </Button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                                    <Card>
                                        <CardHeader className="py-4">
                                            <CardTitle className="text-sm text-muted-foreground">Assigned</CardTitle>
                                        </CardHeader>
                                        <CardContent className="pt-0">
                                            <div className="text-2xl font-bold">{isStatsLoading ? '...' : (statsData?.totals?.assigned ?? 0)}</div>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader className="py-4">
                                            <CardTitle className="text-sm text-muted-foreground">Pending</CardTitle>
                                        </CardHeader>
                                        <CardContent className="pt-0">
                                            <div className="text-2xl font-bold">{isStatsLoading ? '...' : (statsData?.totals?.pending ?? 0)}</div>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader className="py-4">
                                            <CardTitle className="text-sm text-muted-foreground">Completed</CardTitle>
                                        </CardHeader>
                                        <CardContent className="pt-0">
                                            <div className="text-2xl font-bold">{isStatsLoading ? '...' : (statsData?.totals?.completed ?? 0)}</div>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader className="py-4">
                                            <CardTitle className="text-sm text-muted-foreground">Converted</CardTitle>
                                        </CardHeader>
                                        <CardContent className="pt-0">
                                            <div className="text-2xl font-bold">{isStatsLoading ? '...' : (statsData?.totals?.converted ?? 0)}</div>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader className="py-4">
                                            <CardTitle className="text-sm text-muted-foreground">Unassigned</CardTitle>
                                        </CardHeader>
                                        <CardContent className="pt-0">
                                            <div className="text-2xl font-bold">{isStatsLoading ? '...' : (statsData?.totals?.unassigned ?? 0)}</div>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader className="py-4">
                                            <CardTitle className="text-sm text-muted-foreground">Total</CardTitle>
                                        </CardHeader>
                                        <CardContent className="pt-0">
                                            <div className="text-2xl font-bold">{isStatsLoading ? '...' : (statsData?.totals?.total ?? 0)}</div>
                                        </CardContent>
                                    </Card>
                                </div>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Assigned Breakdown</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <Table>
                                            <TableHeader className="bg-muted/50">
                                                <TableRow>
                                                    <TableHead>Employee</TableHead>
                                                    <TableHead className="text-right">Assigned</TableHead>
                                                    <TableHead className="text-right">Pending</TableHead>
                                                    <TableHead className="text-right">Completed</TableHead>
                                                    <TableHead className="text-right">Converted</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {isStatsLoading ? (
                                                    <TableRow>
                                                        <TableCell colSpan={5} className="h-16 text-center text-muted-foreground">
                                                            Loading...
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (statsData?.byAssignee?.length || 0) === 0 ? (
                                                    <TableRow>
                                                        <TableCell colSpan={5} className="h-16 text-center text-muted-foreground">
                                                            No assigned data for selected range.
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (
                                                    statsData.byAssignee.map((row: any) => (
                                                        <TableRow key={row.assigneeId}>
                                                            <TableCell className="font-medium">{row.name}</TableCell>
                                                            <TableCell className="text-right">{row.assigned}</TableCell>
                                                            <TableCell className="text-right">{row.pending}</TableCell>
                                                            <TableCell className="text-right">{row.completed}</TableCell>
                                                            <TableCell className="text-right">{row.converted}</TableCell>
                                                        </TableRow>
                                                    ))
                                                )}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>
                            </div>
                        </DialogContent>
                    </Dialog>
                </>
            )}
        </div>
    );
}
