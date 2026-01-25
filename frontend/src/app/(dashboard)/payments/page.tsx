'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
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
} from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';

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

const referenceTypeConfig: Record<string, { label: string; bg: string; color: string }> = {
    INTERNAL: { label: 'Internal', bg: 'bg-blue-50 border-blue-200', color: 'text-blue-700' },
    EXTERNAL: { label: 'External', bg: 'bg-amber-50 border-amber-200', color: 'text-amber-700' },
};

export default function PaymentsPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [search, setSearch] = useState('');
    const [methodFilter, setMethodFilter] = useState<string | null>(null);
    const [referenceFilter, setReferenceFilter] = useState<string | null>(null);

    const { data: payments, isLoading } = useQuery({
        queryKey: ['payments', search, methodFilter, referenceFilter],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (methodFilter) params.append('paymentMethod', methodFilter);
            if (referenceFilter) params.append('referenceType', referenceFilter);
            const response = await apiClient.get(`/payments?${params.toString()}`);
            return response.data;
        },
    });

    const { data: stats } = useQuery({
        queryKey: ['payments-stats'],
        queryFn: async () => {
            const response = await apiClient.get('/payments/stats');
            return response.data;
        },
    });

    const { data: collectionsSummary } = useQuery({
        queryKey: ['collections-summary'],
        queryFn: async () => {
            const res = await apiClient.get('/payments/collections/summary');
            return res.data as Array<{ user: any; count: number; totalAmount: number }>;
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
        if (payment.referenceType === 'INTERNAL' && payment.customer) {
            return `${payment.customer.firstName} ${payment.customer.lastName}`;
        }
        return payment.customerName || 'N/A';
    };

    const getDisplayCompany = (payment: any) => {
        if (payment.referenceType === 'INTERNAL' && payment.customer) {
            return payment.customer.company || '-';
        }
        return payment.companyName || '-';
    };

    const getDisplayPhone = (payment: any) => {
        if (payment.referenceType === 'INTERNAL' && payment.customer) {
            return payment.customer.phone || '-';
        }
        return payment.phone || '-';
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
                            <div className="stat-icon bg-blue-50">
                                <Receipt className="h-6 w-6 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats?.totalPayments || 0}</p>
                                <p className="text-sm text-muted-foreground">Total Payments</p>
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
                                <p className="text-2xl font-bold">{formatCurrency(stats?.totalAmount || 0)}</p>
                                <p className="text-sm text-muted-foreground">Total Collected</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="card-hover">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-4">
                            <div className="stat-icon bg-violet-50">
                                <Calendar className="h-6 w-6 text-violet-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats?.todayPayments || 0}</p>
                                <p className="text-sm text-muted-foreground">Today's Payments</p>
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
                                <p className="text-2xl font-bold">{formatCurrency(stats?.todayAmount || 0)}</p>
                                <p className="text-sm text-muted-foreground">Today's Collection</p>
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
                                placeholder="Search by payment ID, customer, company..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select
                            value={methodFilter || 'all'}
                            onValueChange={(value) => setMethodFilter(value === 'all' ? null : value)}
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
                        <Select
                            value={referenceFilter || 'all'}
                            onValueChange={(value) => setReferenceFilter(value === 'all' ? null : value)}
                        >
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="Reference Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                <SelectItem value="INTERNAL">Internal</SelectItem>
                                <SelectItem value="EXTERNAL">External</SelectItem>
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
                                <TableHead>Type</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>GST</TableHead>
                                <TableHead>Total</TableHead>
                                <TableHead>Method</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {payments?.map((payment: any) => {
                                const method = paymentMethodConfig[payment.paymentMethod] || paymentMethodConfig.OTHER;
                                const gstType = gstTypeConfig[payment.gstType] || gstTypeConfig.WITHOUT_GST;
                                const refType = referenceTypeConfig[payment.referenceType] || referenceTypeConfig.INTERNAL;
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
                                            <Badge variant="outline" className={cn(refType.bg, refType.color, 'border')}>
                                                {refType.label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {formatCurrency(payment.amount)}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <Badge variant="outline" className={cn(gstType.bg, gstType.color, 'border text-xs')}>
                                                    {gstType.label}
                                                </Badge>
                                                {payment.gstType === 'WITH_GST' && (
                                                    <span className="text-xs text-muted-foreground mt-1">
                                                        ₹{payment.gstAmount?.toFixed(2)} ({payment.gstPercentage}%)
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-bold text-emerald-600">
                                            {formatCurrency(payment.totalAmount)}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <MethodIcon className={cn("h-4 w-4", method.color)} />
                                                <span className="text-sm">{method.label}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {new Date(payment.paymentDate).toLocaleDateString('en-IN', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric'
                                            })}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {(!payments || payments.length === 0) && (
                                <TableRow>
                                    <TableCell colSpan={10} className="h-32 text-center">
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

            {/* Collections Summary */}
            <Card>
                <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold">Collections Summary</h2>
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Employee</TableHead>
                                <TableHead>Payments</TableHead>
                                <TableHead className="text-right">Total Collected</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {collectionsSummary?.map((row: any) => (
                                <TableRow key={row.user?.id}>
                                    <TableCell>
                                        <div className="font-medium">
                                            {row.user?.firstName} {row.user?.lastName}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary">{row.count}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                        {formatCurrency(row.totalAmount || 0)}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {(!collectionsSummary || collectionsSummary.length === 0) && (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                                        No collections data available
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
