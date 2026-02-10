'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { useAuth } from '@/contexts/auth-context';
import { useDebounce } from '@/hooks/use-debounce';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { ComposeEmailDialog } from '@/components/mail/compose-email-dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Search,
    Plus,
    Filter,
    UserPlus,
    Phone,
    Mail,
    MoreHorizontal,
    ChevronRight,
    Flame,
    Thermometer,
    Snowflake,
    Eye,
    Loader2,
    Pencil,
    Trash,
    Lock,
} from 'lucide-react';
import { getInitials, cn } from '@/lib/utils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";


const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    WARM_LEAD: { label: 'Warm Lead', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
    HOT_LEAD: { label: 'Hot Lead', color: 'text-green-700', bg: 'bg-green-50 border-green-200' },
    COLD_LEAD: { label: 'Cold Lead', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
    CLOSED_LEAD: { label: 'Closed Lead', color: 'text-gray-700', bg: 'bg-gray-50 border-gray-200' },
    PROPOSAL_LEAD: { label: 'Proposal Lead', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
};

// Skeleton row component for loading state
function TableRowSkeleton() {
    return (
        <TableRow>
            <TableCell>
                <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                    </div>
                </div>
            </TableCell>
            <TableCell><Skeleton className="h-6 w-20" /></TableCell>
            <TableCell><Skeleton className="h-4 w-16" /></TableCell>
            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
            <TableCell><Skeleton className="h-8 w-16" /></TableCell>
            <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
        </TableRow>
    );
}

import { TransferRequestDialog } from '@/components/leads/transfer-request-dialog';

// ... existing imports

export default function LeadsPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('all'); // 'all' or 'my'
    const [emailDialogOpen, setEmailDialogOpen] = useState(false);
    const [selectedLead, setSelectedLead] = useState<any>(null);

    // Transfer Request State
    const [transferDialogOpen, setTransferDialogOpen] = useState(false);
    const [transferLead, setTransferLead] = useState<any>(null);

    const [deleteId, setDeleteId] = useState<string | null>(null);

    // Debounce search input to avoid excessive API calls
    const debouncedSearch = useDebounce(search, 300);
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const { data: leads, isLoading, isFetching } = useQuery({
        queryKey: ['leads', debouncedSearch, statusFilter, activeTab],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (debouncedSearch) params.append('search', debouncedSearch);
            if (statusFilter) params.append('status', statusFilter);

            // For employees (or anyone using "My Leads" tab), filter by assignee
            if (activeTab === 'my') {
                params.append('assigneeId', user?.id || '');
            } else if (activeTab === 'all' && user?.role === 'EMPLOYEE') {
                // For Employees in 'All Leads', exclude their own leads
                params.append('excludeAssigneeId', user?.id || '');
            }

            const response = await apiClient.get(`/leads?${params.toString()}`);
            return response.data;
        },
        placeholderData: keepPreviousData, // Keep showing old data while fetching new
    });

    const { data: stats } = useQuery({
        queryKey: ['lead-stats'],
        queryFn: async () => {
            const response = await apiClient.get('/leads/stats');
            return response.data;
        },
    });

    const deleteLeadMutation = useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/leads/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['leads'] });
            queryClient.invalidateQueries({ queryKey: ['lead-stats'] });
            toast({
                title: 'Lead deleted',
                description: 'The lead has been successfully deleted.',
            });
            setDeleteId(null);
        },
        onError: (error: any) => {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to delete lead',
                variant: 'destructive',
            });
            setDeleteId(null);
        },
    });

    const handleDelete = async () => {
        if (deleteId) {
            deleteLeadMutation.mutate(deleteId);
        }
    };



    return (
        <div className="space-y-6 page-enter">

            {/* Tabs for Leads */}
            {/* Tabs for Leads - Only for Employees */}
            {user?.role === 'EMPLOYEE' && (
                <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList>
                        <TabsTrigger value="all">All Leads</TabsTrigger>
                        <TabsTrigger value="my">My Leads</TabsTrigger>
                    </TabsList>
                </Tabs>
            )}

            {/* Filters & Search */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search by name, email, company..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10 pr-10"
                            />
                            {isFetching && (
                                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                            )}
                        </div>
                        <div className="w-full sm:w-[200px]">
                            <Select
                                value={statusFilter || 'ALL'}
                                onValueChange={(val) => setStatusFilter(val === 'ALL' ? null : val)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Filter by Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">All Status</SelectItem>
                                    {Object.entries(statusConfig).map(([key, config]) => (
                                        <SelectItem key={key} value={key}>
                                            {config.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Leads Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[300px]">Lead</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Assignee</TableHead>
                                <TableHead>Next Follow-up</TableHead>
                                <TableHead>Date</TableHead>
                                {!(activeTab === 'all' && user?.role === 'EMPLOYEE') && <TableHead>Contact</TableHead>}
                                {!(activeTab === 'all' && user?.role === 'EMPLOYEE') && <TableHead className="text-right">Actions</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {/* Show skeleton rows on initial load only */}
                            {isLoading && (
                                <>
                                    <TableRowSkeleton />
                                    <TableRowSkeleton />
                                    <TableRowSkeleton />
                                    <TableRowSkeleton />
                                    <TableRowSkeleton />
                                </>
                            )}
                            {/* Show actual data */}
                            {!isLoading && leads?.map((lead: any) => {
                                const status = statusConfig[lead.status] || statusConfig.COLD_LEAD;
                                const phoneNumber = lead.phone || lead.mobile;

                                const canViewLead = user?.role !== 'EMPLOYEE' || lead.assigneeId === user?.id;

                                return (
                                    <TableRow
                                        key={lead.id}
                                        className={cn(
                                            "transition-colors",
                                            canViewLead ? "table-row-hover cursor-pointer" : "opacity-90 bg-slate-50/50"
                                        )}
                                        onClick={() => {
                                            if (canViewLead) {
                                                router.push(`/leads/${lead.id}`);
                                            } else {
                                                setTransferLead(lead);
                                                setTransferDialogOpen(true);
                                            }
                                        }}
                                    >
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-10 w-10">
                                                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                                                        {getInitials(lead.firstName, lead.lastName)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className={cn("font-medium flex items-center gap-2", status.color)}>
                                                        {lead.firstName} {lead.lastName}
                                                        {!canViewLead && (
                                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
                                                                <Lock className="h-3 w-3 mr-1" />
                                                                Restricted
                                                            </span>
                                                        )}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {lead.mobile || lead.phone || 'No mobile'}
                                                    </p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={cn(status.bg, status.color, 'border')}>
                                                {status.label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {lead.assignee ? (
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="h-6 w-6">
                                                        <AvatarFallback className="text-[10px] bg-slate-100 text-slate-600">
                                                            {getInitials(lead.assignee.firstName, lead.assignee.lastName)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="truncate max-w-[120px] text-sm font-medium" title={`${lead.assignee.firstName} ${lead.assignee.lastName}`}>
                                                        {lead.assignee.firstName} {lead.assignee.lastName}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground italic text-sm">Unassigned</span>
                                            )}
                                        </TableCell>

                                        <TableCell className="whitespace-nowrap">
                                            {lead.nextFollowUp ? (
                                                <span className={cn(
                                                    'text-xs font-medium px-2 py-1 rounded-full border',
                                                    new Date(lead.nextFollowUp) < new Date() ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                )}>
                                                    {new Date(lead.nextFollowUp).toLocaleDateString()}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">Not set</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground whitespace-nowrap">
                                            {new Date(lead.createdAt).toLocaleDateString()}
                                        </TableCell>
                                        {!(activeTab === 'all' && user?.role === 'EMPLOYEE') && (
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {phoneNumber && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8"
                                                            disabled={!canViewLead}
                                                            onClick={(e) => { e.stopPropagation(); }}
                                                        >
                                                            <Phone className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    {lead.email && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8"
                                                            disabled={!canViewLead}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedLead(lead);
                                                                setEmailDialogOpen(true);
                                                            }}
                                                        >
                                                            <Mail className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        )}
                                        {!(activeTab === 'all' && user?.role === 'EMPLOYEE') && (
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8"
                                                            disabled={!canViewLead}
                                                        >
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (canViewLead) {
                                                                router.push(`/leads/${lead.id}`);
                                                            } else {
                                                                setTransferLead(lead);
                                                                setTransferDialogOpen(true);
                                                            }
                                                        }}>
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            View Details
                                                        </DropdownMenuItem>

                                                        {/* Edit/Delete only for Owners or Managers/Admins */}
                                                        {(user?.role !== 'EMPLOYEE' || lead.assigneeId === user?.id) && (
                                                            <>
                                                                <DropdownMenuItem onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    router.push(`/leads/${lead.id}/edit`);
                                                                }}>
                                                                    <Pencil className="mr-2 h-4 w-4" />
                                                                    Edit
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem className="text-red-600" onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setDeleteId(lead.id);
                                                                }}>
                                                                    <Trash className="mr-2 h-4 w-4" />
                                                                    Delete
                                                                </DropdownMenuItem>
                                                            </>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                );
                            })}
                            {!isLoading && (!leads || leads.length === 0) && (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-32 text-center">
                                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                                            <UserPlus className="h-10 w-10 mb-2 opacity-50" />
                                            <p>No leads found</p>
                                            <p className="text-sm">Add your first lead to get started</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Email Compose Dialog */}
            <ComposeEmailDialog
                isOpen={emailDialogOpen}
                onClose={() => setEmailDialogOpen(false)}
                defaultTo={selectedLead?.email || ''}
                relatedTo={selectedLead ? { type: 'Lead', id: selectedLead.id, name: `${selectedLead.firstName} ${selectedLead.lastName}` } : undefined}
            />

            <AlertDialog open={!!deleteId} onOpenChange={(open: boolean) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the lead.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-700"
                            disabled={deleteLeadMutation.isPending}
                        >
                            {deleteLeadMutation.isPending ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <TransferRequestDialog
                isOpen={transferDialogOpen}
                onClose={() => setTransferDialogOpen(false)}
                leadId={transferLead?.id || null}
                leadName={transferLead ? `${transferLead.firstName} ${transferLead.lastName}` : undefined}
            />
        </div >
    );
}
