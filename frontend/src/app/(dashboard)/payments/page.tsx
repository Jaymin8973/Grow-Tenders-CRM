'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { getErrorMessage } from '@/lib/error-utils';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PaymentApprovalList } from '@/components/targets/PaymentApprovalList';
import {
    Search,
    Plus,
    Wallet,
    IndianRupee,
    Building2,
    Users,
    Calendar,
    MoreHorizontal,
    Receipt,
    CreditCard,
    Banknote,
    Eye,
    Edit,
    Trash2,
    UserCircle,
    Loader2,
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatCurrency, cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';

const paymentMethodConfig: Record<string, { label: string; icon: any; color: string }> = {
    CASH: { label: 'Cash', icon: Banknote, color: 'text-green-600' },
    BANK_TRANSFER: { label: 'Bank Transfer', icon: Building2, color: 'text-blue-600' },
    CHEQUE: { label: 'Cheque', icon: Receipt, color: 'text-purple-600' },
    UPI: { label: 'UPI', icon: Wallet, color: 'text-orange-600' },
    CARD: { label: 'Card', icon: CreditCard, color: 'text-pink-600' },
    OTHER: { label: 'Other', icon: Wallet, color: 'text-gray-600' },
};

const gstTypeConfig: Record<string, { label: string; bg: string; color: string }> = {
    WITH_GST: { label: 'With GST', bg: 'bg-emerald-50 border-emerald-200', color: 'text-emerald-700' },
    WITHOUT_GST: { label: 'Without GST', bg: 'bg-slate-50 border-slate-200', color: 'text-slate-700' },
};

export default function PaymentsPage() {
    const router = useRouter();
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [methodFilter, setMethodFilter] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);

    const { data: paymentsData, isLoading, isFetching } = useQuery({
        queryKey: ['payments', search, methodFilter, page, pageSize],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (methodFilter) params.append('paymentMethod', methodFilter);
            params.append('page', String(page));
            params.append('pageSize', String(pageSize));
            const response = await apiClient.get(`/payments?${params.toString()}`);
            return response.data;
        },
        placeholderData: keepPreviousData,
    });

    const payments = paymentsData?.items ?? [];

    const { data: stats } = useQuery({
        queryKey: ['payments-stats'],
        queryFn: async () => {
            const response = await apiClient.get('/payments/stats');
            return response.data;
        },
    });

    // Delete payment mutation
    const deletePaymentMutation = useMutation({
        mutationFn: async (paymentId: string) => {
            return apiClient.delete(`/payments/${paymentId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payments'] });
            queryClient.invalidateQueries({ queryKey: ['payments-stats'] });
            toast({ title: 'Payment deleted successfully' });
        },
        onError: (error: any) => {
            toast({
                title: 'Failed to delete payment',
                description: getErrorMessage(error),
                variant: 'destructive',
            });
        },
    });

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        );
    }

    const getDisplayName = (payment: any) => {
        if (payment.customer) {
            return `${payment.customer.firstName} ${payment.customer.lastName}`;
        }
        return 'N/A';
    };

    const getDisplayCompany = (payment: any) => {
        if (payment.customer) {
            return payment.customer.company || '-';
        }
        return payment.companyName || '-';
    };

    const getDisplayPhone = (payment: any) => {
        if (payment.customer) {
            return payment.customer.phone || '-';
        }
        return payment.phone || '-';
    };

    const getAssignedEmployee = (payment: any) => {
        if (payment.customer?.assignee) {
            return `${payment.customer.assignee.firstName} ${payment.customer.assignee.lastName}`;
        }
        return '-';
    };

    return (
        <div className="space-y-6 page-enter">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Payments</h1>
                    <p className="text-muted-foreground mt-1">
                        Record and manage client payments
                    </p>
                </div>
                {user?.role === 'SUPER_ADMIN' && (
                    <Button className="gap-2" onClick={() => router.push('/payments/new')}>
                        <Plus className="h-4 w-4" />
                        Record Payment
                    </Button>
                )}
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="card-hover">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-4">
                            <div className="stat-icon bg-violet-50">
                                <Calendar className="h-6 w-6 text-violet-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{formatCurrency(stats?.todayAmount || 0)}</p>
                                <p className="text-sm text-muted-foreground">Today's Collection</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="card-hover">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-4">
                            <div className="stat-icon bg-amber-50">
                                <Wallet className="h-6 w-6 text-amber-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{formatCurrency(stats?.monthlyAmount || 0)}</p>
                                <p className="text-sm text-muted-foreground">Monthly Collection</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="card-hover">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-4">
                            <div className="stat-icon bg-emerald-50">
                                <IndianRupee className="h-6 w-6 text-emerald-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{formatCurrency(stats?.yearlyAmount || 0)}</p>
                                <p className="text-sm text-muted-foreground">Yearly Collection</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="card-hover">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-4">
                            <div className="stat-icon bg-blue-50">
                                <IndianRupee className="h-6 w-6 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{formatCurrency(stats?.totalAmount || 0)}</p>
                                <p className="text-sm text-muted-foreground">Total Collection</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Payments Tabs */}
            <Tabs defaultValue="payments" className="w-full">
                <div className="flex items-center justify-between mb-4">
                    <TabsList>
                        <TabsTrigger value="payments">All Payments</TabsTrigger>
                        {(user?.role === 'SUPER_ADMIN' || user?.role === 'MANAGER') && (
                            <TabsTrigger value="requests">Approval Requests</TabsTrigger>
                        )}
                    </TabsList>
                </div>

                <TabsContent value="payments" className="space-y-6">
                    {/* Filters & Search */}
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="search"
                                        placeholder="Search by payment ID, customer, company..."
                                        value={search}
                                        onChange={(e) => {
                                            setSearch(e.target.value);
                                            setPage(1);
                                        }}
                                        className="pl-10 pr-10"
                                    />
                                    {isFetching && (
                                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                                    )}
                                </div>
                                <Select
                                    value={methodFilter || 'all'}
                                    onValueChange={(value) => {
                                        setMethodFilter(value === 'all' ? null : value);
                                        setPage(1);
                                    }}
                                >
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Payment Method" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Methods</SelectItem>
                                        {Object.entries(paymentMethodConfig).map(([key, config]) => (
                                            <SelectItem key={key} value={key}>{config.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Payments Table */}
                    <Card>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Payment ID</TableHead>
                                        <TableHead>Customer / Company</TableHead>
                                        <TableHead>Phone</TableHead>
                                        <TableHead>Assigned To</TableHead>
                                        <TableHead>Method</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {payments?.map((payment: any) => {
                                        const method = paymentMethodConfig[payment.paymentMethod] || paymentMethodConfig.OTHER;
                                        const MethodIcon = method.icon;

                                        return (
                                            <TableRow key={payment.id} className="table-row-hover">
                                                <TableCell>
                                                    <p className="font-medium font-mono text-primary">
                                                        {payment.paymentNumber}
                                                    </p>
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <p className="font-medium">{getDisplayName(payment)}</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {getDisplayCompany(payment)}
                                                        </p>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {getDisplayPhone(payment)}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <UserCircle className="h-4 w-4 text-muted-foreground" />
                                                        <span className="text-sm">{getAssignedEmployee(payment)}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <MethodIcon className={cn('h-4 w-4', method.color)} />
                                                        <span>{method.label}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    {formatCurrency(payment.amount)}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {new Date(payment.paymentDate).toLocaleDateString('en-IN', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric'
                                                    })}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem
                                                                onClick={() => router.push(`/payments/${payment.id}`)}
                                                            >
                                                                <Eye className="mr-2 h-4 w-4" />
                                                                View Details
                                                            </DropdownMenuItem>
                                                            {user?.role === 'SUPER_ADMIN' && (
                                                                <>
                                                                    <DropdownMenuItem
                                                                        onClick={() => router.push(`/payments/${payment.id}/edit`)}
                                                                    >
                                                                        <Edit className="mr-2 h-4 w-4" />
                                                                        Edit Payment
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem
                                                                        className="text-destructive"
                                                                        onClick={() => {
                                                                            if (confirm('Are you sure you want to delete this payment?')) {
                                                                                deletePaymentMutation.mutate(payment.id);
                                                                            }
                                                                        }}
                                                                    >
                                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                                        Delete Payment
                                                                    </DropdownMenuItem>
                                                                </>
                                                            )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                    {(!payments || payments.length === 0) && (
                                        <TableRow>
                                            <TableCell colSpan={9} className="h-32 text-center">
                                                <div className="flex flex-col items-center justify-center text-muted-foreground">
                                                    <Wallet className="h-10 w-10 mb-2 opacity-50" />
                                                    <p>No payments found</p>
                                                    <p className="text-sm">Record your first payment to get started</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {/* Pagination */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="text-sm text-muted-foreground">
                            {typeof paymentsData?.total === 'number'
                                ? `Showing ${payments.length} of ${paymentsData.total}`
                                : `Showing ${payments.length}`}
                        </div>
                        <div className="flex items-center gap-2">
                            <Select
                                value={String(pageSize)}
                                onValueChange={(val: string) => {
                                    setPageSize(Number(val));
                                    setPage(1);
                                }}
                            >
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Page size" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="25">25 / page</SelectItem>
                                    <SelectItem value="50">50 / page</SelectItem>
                                    <SelectItem value="100">100 / page</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button
                                variant="outline"
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page <= 1}
                            >
                                Prev
                            </Button>
                            <div className="text-sm font-medium w-[90px] text-center">Page {page}</div>
                            <Button
                                variant="outline"
                                onClick={() => setPage((p) => p + 1)}
                                disabled={typeof paymentsData?.total === 'number' ? page * pageSize >= paymentsData.total : payments.length < pageSize}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="requests">
                    <PaymentApprovalList />
                </TabsContent>
            </Tabs>
        </div>
    );
}
