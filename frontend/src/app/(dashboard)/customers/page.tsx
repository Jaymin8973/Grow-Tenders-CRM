'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { useAuth } from '@/contexts/auth-context';
import { useDebounce } from '@/hooks/use-debounce';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { ComposeEmailDialog } from '@/components/mail/compose-email-dialog';
import { CreateCustomerDialog } from '@/components/customers/create-customer-dialog';
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
    Users,
    Phone,
    Mail,
    MoreHorizontal,
    Building2,
    MapPin,
    TrendingUp,
    Star,
    Eye,
    Loader2,
} from 'lucide-react';
import { getInitials, formatCurrency, cn } from '@/lib/utils';

const lifecycleConfig: Record<string, { label: string; color: string; bg: string }> = {
    LEAD: { label: 'Lead', color: 'text-slate-700', bg: 'bg-slate-50 border-slate-200' },
    PROSPECT: { label: 'Prospect', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
    OPPORTUNITY: { label: 'Opportunity', color: 'text-violet-700', bg: 'bg-violet-50 border-violet-200' },
    CUSTOMER: { label: 'Customer', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
    CHURNED: { label: 'Churned', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
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
                        <Skeleton className="h-3 w-40" />
                    </div>
                </div>
            </TableCell>
            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
            <TableCell><Skeleton className="h-6 w-20" /></TableCell>
            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
            <TableCell><Skeleton className="h-8 w-16" /></TableCell>
            <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
        </TableRow>
    );
}

export default function CustomersPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [search, setSearch] = useState('');
    const [lifecycleFilter, setLifecycleFilter] = useState<string | null>(null);
    const [emailDialogOpen, setEmailDialogOpen] = useState(false);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

    // Debounce search input to avoid excessive API calls
    const debouncedSearch = useDebounce(search, 300);

    const { data: customers, isLoading, isFetching } = useQuery({
        queryKey: ['customers', debouncedSearch, lifecycleFilter],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (debouncedSearch) params.append('search', debouncedSearch);
            if (lifecycleFilter) params.append('lifecycle', lifecycleFilter);
            const response = await apiClient.get(`/customers?${params.toString()}`);
            return response.data;
        },
        placeholderData: keepPreviousData, // Keep showing old data while fetching new
    });

    return (
        <div className="space-y-6 page-enter">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Customers</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage your customer relationships
                    </p>
                </div>
                <Button className="gap-2" onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4" />
                    Add Customer
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="card-hover">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-4">
                            <div className="stat-icon bg-blue-50">
                                <Users className="h-6 w-6 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{customers?.length || 0}</p>
                                <p className="text-sm text-muted-foreground">Total Customers</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="card-hover">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-4">
                            <div className="stat-icon bg-emerald-50">
                                <TrendingUp className="h-6 w-6 text-emerald-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">
                                    {customers?.filter((c: any) => c.lifecycle === 'CUSTOMER').length || 0}
                                </p>
                                <p className="text-sm text-muted-foreground">Active</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="card-hover">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-4">
                            <div className="stat-icon bg-amber-50">
                                <Star className="h-6 w-6 text-amber-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">
                                    {formatCurrency(customers?.reduce((sum: number, c: any) => sum + (c.totalRevenue || 0), 0) || 0)}
                                </p>
                                <p className="text-sm text-muted-foreground">Total Revenue</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="card-hover">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-4">
                            <div className="stat-icon bg-violet-50">
                                <Building2 className="h-6 w-6 text-violet-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">
                                    {new Set(customers?.map((c: any) => c.company).filter(Boolean)).size || 0}
                                </p>
                                <p className="text-sm text-muted-foreground">Companies</p>
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
                            {Object.entries(lifecycleConfig).map(([key, config]) => (
                                <Button
                                    key={key}
                                    variant={lifecycleFilter === key ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setLifecycleFilter(lifecycleFilter === key ? null : key)}
                                    className="text-xs"
                                >
                                    {config.label}
                                </Button>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Customers Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[300px]">Customer</TableHead>
                                <TableHead>Company</TableHead>
                                <TableHead>Lifecycle</TableHead>
                                <TableHead>Total Revenue</TableHead>
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
                            {!isLoading && customers?.map((customer: any) => {
                                const lifecycle = lifecycleConfig[customer.lifecycle] || lifecycleConfig.LEAD;

                                return (
                                    <TableRow
                                        key={customer.id}
                                        className="table-row-hover cursor-pointer"
                                        onClick={() => router.push(`/customers/${customer.id}`)}
                                    >
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-10 w-10">
                                                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                                                        {getInitials(customer.firstName, customer.lastName)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium">
                                                        {customer.firstName} {customer.lastName}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {customer.email}
                                                    </p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                                <span>{customer.company || '-'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={cn(lifecycle.bg, lifecycle.color, 'border')}>
                                                {lifecycle.label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {formatCurrency(customer.totalRevenue || 0)}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {customer.phone && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <Phone className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                {customer.email && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedCustomer(customer);
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
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {!isLoading && (!customers || customers.length === 0) && (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32 text-center">
                                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                                            <Users className="h-10 w-10 mb-2 opacity-50" />
                                            <p>No customers found</p>
                                            <p className="text-sm">Start by converting leads to customers</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <ComposeEmailDialog
                isOpen={emailDialogOpen}
                onClose={() => setEmailDialogOpen(false)}
                defaultTo={selectedCustomer?.email || ''}
                relatedTo={selectedCustomer ? { type: 'Customer', id: selectedCustomer.id, name: `${selectedCustomer.firstName} ${selectedCustomer.lastName}` } : undefined}
            />

            <CreateCustomerDialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
            />
        </div>
    );
}
