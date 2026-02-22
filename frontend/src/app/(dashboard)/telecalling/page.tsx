
'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/auth-context';
import apiClient from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Phone, Upload, CheckCircle2, XCircle, Search, RefreshCw, Loader2, Link as LinkIcon, UserPlus } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { BulkUploadModal } from './components/bulk-upload-modal';
import { BulkAssignModal } from './components/bulk-assign-modal';
import { Checkbox } from '@/components/ui/checkbox';

export default function TelecallingPage() {
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const [page, setPage] = useState(1);
    const limit = 50;
    const [statusFilter, setStatusFilter] = useState<string>('all');

    // Check if user is manager/admin
    const isAdminMode = user?.role === 'SUPER_ADMIN' || user?.role === 'MANAGER';
    const [assigneeFilter, setAssigneeFilter] = useState<string>('all');

    if (user && !isAdminMode) {
        router.replace('/tasks');
        return null;
    }

    // Fetch team members for assignment
    const { data: teamMembers } = useQuery({
        queryKey: ['team-members'],
        queryFn: async () => {
            const response = await apiClient.get('/users');
            return response.data;
        },
        enabled: isAdminMode,
    });

    // Fetch Raw Leads
    const { data, isLoading } = useQuery({
        queryKey: ['raw-leads', page, statusFilter, assigneeFilter],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
            });
            if (statusFilter !== 'all') params.append('status', statusFilter);
            if (isAdminMode && assigneeFilter !== 'all') params.append('assigneeId', assigneeFilter);

            const res = await apiClient.get(`/raw-leads?${params.toString()}`);
            return res.data;
        }
    });

    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, status, notes }: { id: string, status: string, notes?: string }) => {
            return apiClient.patch(`/raw-leads/${id}`, { status, notes });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['raw-leads'] });
            toast({ title: 'Status updated' });
        }
    });

    const deleteRawLeadMutation = useMutation({
        mutationFn: async (id: string) => {
            return apiClient.delete(`/raw-leads/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['raw-leads'] });
            toast({ title: 'Number deleted successfully' });
        },
        onError: (err: any) => {
            toast({
                title: 'Failed to delete number',
                description: err.response?.data?.message || 'Something went wrong',
                variant: 'destructive',
            });
        },
    });

    const bulkDeleteMutation = useMutation({
        mutationFn: async (ids: string[]) => {
            return apiClient.delete(`/raw-leads`, { data: { ids } });
        },
        onSuccess: (res: any) => {
            setSelectedIds([]);
            queryClient.invalidateQueries({ queryKey: ['raw-leads'] });
            toast({ title: `Deleted ${res?.data?.deletedCount ?? 0} numbers` });
        },
        onError: (err: any) => {
            toast({
                title: 'Failed to bulk delete',
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

    return (
        <div className="space-y-6 page-enter">
            {/* Header */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <Phone className="h-6 w-6 text-primary" />
                        Telecalling Dashboard
                    </h1>
                    <p className="text-muted-foreground">Manage and call your raw prospect lists.</p>
                </div>

                {isAdminMode && (
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
                        <Button
                            variant="outline"
                            className="border-red-200 text-red-700 hover:bg-red-50"
                            disabled={selectedIds.length === 0 || bulkDeleteMutation.isPending}
                            onClick={() => {
                                if (confirm(`Delete ${selectedIds.length} selected numbers permanently?`)) {
                                    bulkDeleteMutation.mutate(selectedIds);
                                }
                            }}
                        >
                            Delete ({selectedIds.length})
                        </Button>
                    </div>
                )}
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="w-full sm:w-48">
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
                            <div className="w-full sm:w-48">
                                <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Any Assignee" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Any Assignee</SelectItem>
                                        {teamMembers?.map((m: any) => (
                                            <SelectItem key={m.id} value={m.id}>
                                                {m.firstName} {m.lastName}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <Button variant="ghost" size="icon" onClick={() => queryClient.invalidateQueries({ queryKey: ['raw-leads'] })}>
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                {isAdminMode && (
                                    <TableHead className="w-[50px]">
                                        <Checkbox
                                            checked={data?.items?.length > 0 && selectedIds.length === data?.items?.length}
                                            onCheckedChange={toggleSelectAll}
                                        />
                                    </TableHead>
                                )}
                                <TableHead className="w-[150px]">Date Added</TableHead>
                                <TableHead>Phone Number</TableHead>
                                <TableHead>Assignee</TableHead>
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
                                        {isAdminMode && (
                                            <TableCell>
                                                <Checkbox
                                                    checked={selectedIds.includes(lead.id)}
                                                    onCheckedChange={() => toggleSelectOne(lead.id)}
                                                />
                                            </TableCell>
                                        )}
                                        <TableCell className="text-sm font-medium">
                                            {format(new Date(lead.createdAt), 'MMM d, yyyy')}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <a href={`tel:${lead.phone}`} className="font-semibold text-primary hover:underline">
                                                    {lead.phone}
                                                </a>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {lead.assignee ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                                                        {lead.assignee.firstName[0]}
                                                    </div>
                                                    <span className="text-sm">{lead.assignee.firstName} {lead.assignee.lastName}</span>
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground text-sm italic">Unassigned</span>
                                            )}
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
                                            {/* Quick Actions */}
                                            {lead.status === 'INTERESTED' && !lead.convertedLeadId ? (
                                                <Button
                                                    size="sm"
                                                    className="bg-emerald-600 hover:bg-emerald-700 h-8 text-xs"
                                                    onClick={() => router.push(`/leads/new?phone=${encodeURIComponent(lead.phone)}&rawId=${lead.id}`)}
                                                >
                                                    Convert to Lead
                                                </Button>
                                            ) : lead.convertedLeadId ? (
                                                <div className="flex gap-2 justify-end">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-8 text-xs"
                                                        onClick={() => router.push(`/leads/${lead.convertedLeadId}`)}
                                                    >
                                                        View Lead
                                                    </Button>
                                                    {isAdminMode && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-8 text-xs border-red-200 text-red-700 hover:bg-red-50"
                                                            disabled={deleteRawLeadMutation.isPending}
                                                            onClick={() => {
                                                                if (confirm('Delete this number permanently?')) {
                                                                    deleteRawLeadMutation.mutate(lead.id);
                                                                }
                                                            }}
                                                        >
                                                            Delete
                                                        </Button>
                                                    )}
                                                </div>
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
                                                    {isAdminMode && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-8 text-xs border-red-200 text-red-700 hover:bg-red-50"
                                                            disabled={deleteRawLeadMutation.isPending}
                                                            onClick={() => {
                                                                if (confirm('Delete this number permanently?')) {
                                                                    deleteRawLeadMutation.mutate(lead.id);
                                                                }
                                                            }}
                                                        >
                                                            Delete
                                                        </Button>
                                                    )}
                                                    {/* Future: Edit full notes modal pop-up */}
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

            {/* Pagination controls would go here */}
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

            {/* Modals */}
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
        </div>
    );
}
