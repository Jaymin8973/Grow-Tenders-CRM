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
import { EmailComposeDialog } from '@/components/email/email-compose-dialog';
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
} from 'lucide-react';
import { getInitials, cn } from '@/lib/utils';

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    NEW: { label: 'New', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
    CONTACTED: { label: 'Contacted', color: 'text-cyan-700', bg: 'bg-cyan-50 border-cyan-200' },
    QUALIFIED: { label: 'Qualified', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
    PROPOSAL: { label: 'Proposal', color: 'text-violet-700', bg: 'bg-violet-50 border-violet-200' },
    NEGOTIATION: { label: 'Negotiation', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
    WON: { label: 'Won', color: 'text-green-700', bg: 'bg-green-50 border-green-200' },
    LOST: { label: 'Lost', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
};

const typeConfig: Record<string, { icon: any; color: string; bg: string }> = {
    HOT: { icon: Flame, color: 'text-red-500', bg: 'bg-red-50' },
    WARM: { icon: Thermometer, color: 'text-amber-500', bg: 'bg-amber-50' },
    COLD: { icon: Snowflake, color: 'text-blue-500', bg: 'bg-blue-50' },
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
            <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
            <TableCell><Skeleton className="h-6 w-20" /></TableCell>
            <TableCell><Skeleton className="h-4 w-16" /></TableCell>
            <TableCell><Skeleton className="h-8 w-16" /></TableCell>
            <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
        </TableRow>
    );
}

export default function LeadsPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [emailDialogOpen, setEmailDialogOpen] = useState(false);
    const [selectedLead, setSelectedLead] = useState<any>(null);

    // Debounce search input to avoid excessive API calls
    const debouncedSearch = useDebounce(search, 300);

    const { data: leads, isLoading, isFetching } = useQuery({
        queryKey: ['leads', debouncedSearch, statusFilter],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (debouncedSearch) params.append('search', debouncedSearch);
            if (statusFilter) params.append('status', statusFilter);
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

    return (
        <div className="space-y-6 page-enter">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Leads</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage and track your potential customers
                    </p>
                </div>
                <Button className="gap-2" onClick={() => router.push('/leads/new')}>
                    <Plus className="h-4 w-4" />
                    Add Lead
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="card-hover">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-4">
                            <div className="stat-icon bg-blue-50">
                                <UserPlus className="h-6 w-6 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats?.total || leads?.length || 0}</p>
                                <p className="text-sm text-muted-foreground">Total Leads</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="card-hover">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-4">
                            <div className="stat-icon bg-red-50">
                                <Flame className="h-6 w-6 text-red-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats?.hot || 0}</p>
                                <p className="text-sm text-muted-foreground">Hot Leads</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="card-hover">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-4">
                            <div className="stat-icon bg-amber-50">
                                <Thermometer className="h-6 w-6 text-amber-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats?.warm || 0}</p>
                                <p className="text-sm text-muted-foreground">Warm Leads</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="card-hover">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-4">
                            <div className="stat-icon bg-green-50">
                                <ChevronRight className="h-6 w-6 text-green-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats?.converted || 0}</p>
                                <p className="text-sm text-muted-foreground">Converted</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

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
                        <div className="flex gap-2 flex-wrap">
                            {Object.entries(statusConfig).slice(0, 5).map(([key, config]) => (
                                <Button
                                    key={key}
                                    variant={statusFilter === key ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setStatusFilter(statusFilter === key ? null : key)}
                                    className="text-xs"
                                >
                                    {config.label}
                                </Button>
                            ))}
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
                                <TableHead>Type</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Source</TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
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
                                const status = statusConfig[lead.status] || statusConfig.NEW;
                                const type = typeConfig[lead.type] || typeConfig.COLD;
                                const TypeIcon = type.icon;

                                return (
                                    <TableRow
                                        key={lead.id}
                                        className="table-row-hover cursor-pointer"
                                        onClick={() => router.push(`/leads/${lead.id}`)}
                                    >
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-10 w-10">
                                                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                                                        {getInitials(lead.firstName, lead.lastName)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium">
                                                        {lead.firstName} {lead.lastName}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {lead.company || 'No company'}
                                                    </p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className={cn("flex items-center gap-2 px-2.5 py-1 rounded-full w-fit", type.bg)}>
                                                <TypeIcon className={cn("h-4 w-4", type.color)} />
                                                <span className={cn("text-xs font-medium", type.color)}>
                                                    {lead.type}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={cn(status.bg, status.color, 'border')}>
                                                {status.label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {lead.source || '-'}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {lead.phone && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
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
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    router.push(`/leads/${lead.id}`);
                                                }}
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {!isLoading && (!leads || leads.length === 0) && (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32 text-center">
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
            <EmailComposeDialog
                open={emailDialogOpen}
                onOpenChange={setEmailDialogOpen}
                to={selectedLead?.email || ''}
                toName={selectedLead ? `${selectedLead.firstName} ${selectedLead.lastName}` : ''}
                leadId={selectedLead?.id}
            />
        </div>
    );
}
