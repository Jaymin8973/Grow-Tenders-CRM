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
    Search,
    Plus,
    FileText,
    DollarSign,
    CheckCircle2,
    Clock,
    AlertCircle,
    MoreHorizontal,
    Download,
    Send,
    Eye,
} from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: any }> = {
    DRAFT: { label: 'Draft', color: 'text-slate-700', bg: 'bg-slate-50 border-slate-200', icon: FileText },
    SENT: { label: 'Sent', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', icon: Send },
    PAID: { label: 'Paid', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: CheckCircle2 },
    OVERDUE: { label: 'Overdue', color: 'text-red-700', bg: 'bg-red-50 border-red-200', icon: AlertCircle },
    CANCELLED: { label: 'Cancelled', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', icon: Clock },
};

export default function InvoicesPage() {
    const router = useRouter();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string | null>(null);

    const { data: invoices, isLoading } = useQuery({
        queryKey: ['invoices', search, statusFilter],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (statusFilter) params.append('status', statusFilter);
            const response = await apiClient.get(`/invoices?${params.toString()}`);
            return response.data;
        },
    });

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        );
    }

    const totalAmount = invoices?.reduce((sum: number, inv: any) => sum + (inv.total || 0), 0) || 0;
    const paidAmount = invoices?.filter((i: any) => i.status === 'PAID')
        .reduce((sum: number, inv: any) => sum + (inv.total || 0), 0) || 0;
    const pendingAmount = totalAmount - paidAmount;

    return (
        <div className="space-y-6 page-enter">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Invoices</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage billing and payments
                    </p>
                </div>
                <Button className="gap-2" onClick={() => router.push('/invoices/new')}>
                    <Plus className="h-4 w-4" />
                    Create Invoice
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="card-hover">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-4">
                            <div className="stat-icon bg-blue-50">
                                <FileText className="h-6 w-6 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{invoices?.length || 0}</p>
                                <p className="text-sm text-muted-foreground">Total Invoices</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="card-hover">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-4">
                            <div className="stat-icon bg-violet-50">
                                <DollarSign className="h-6 w-6 text-violet-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{formatCurrency(totalAmount)}</p>
                                <p className="text-sm text-muted-foreground">Total Amount</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="card-hover">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-4">
                            <div className="stat-icon bg-emerald-50">
                                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{formatCurrency(paidAmount)}</p>
                                <p className="text-sm text-muted-foreground">Paid</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="card-hover">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-4">
                            <div className="stat-icon bg-amber-50">
                                <Clock className="h-6 w-6 text-amber-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{formatCurrency(pendingAmount)}</p>
                                <p className="text-sm text-muted-foreground">Pending</p>
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
                                placeholder="Search invoices..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            {Object.entries(statusConfig).map(([key, config]) => (
                                <Button
                                    key={key}
                                    variant={statusFilter === key ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setStatusFilter(statusFilter === key ? null : key)}
                                    className="text-xs gap-1"
                                >
                                    {config.label}
                                </Button>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Invoices Table */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Invoice</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Due Date</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {invoices?.map((invoice: any) => {
                                const status = statusConfig[invoice.status] || statusConfig.DRAFT;
                                const StatusIcon = status.icon;

                                return (
                                    <TableRow
                                        key={invoice.id}
                                        className="table-row-hover cursor-pointer"
                                        onClick={() => router.push(`/invoices/${invoice.id}`)}
                                    >
                                        <TableCell>
                                            <p className="font-medium font-mono">
                                                {invoice.invoiceNumber}
                                            </p>
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium">
                                                    {invoice.customer?.firstName} {invoice.customer?.lastName}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {invoice.customer?.company || invoice.customer?.email}
                                                </p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={cn(status.bg, status.color, 'border gap-1')}>
                                                <StatusIcon className="h-3 w-3" />
                                                {status.label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {new Date(invoice.createdAt).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric'
                                            })}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric'
                                            }) : '-'}
                                        </TableCell>
                                        <TableCell className="text-right font-bold">
                                            {formatCurrency(invoice.total || 0)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {(!invoices || invoices.length === 0) && (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-32 text-center">
                                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                                            <FileText className="h-10 w-10 mb-2 opacity-50" />
                                            <p>No invoices found</p>
                                            <p className="text-sm">Create your first invoice to get started</p>
                                        </div>
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
