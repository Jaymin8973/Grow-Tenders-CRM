'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
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
    MoreHorizontal,
    Download,
    Loader2,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function InvoicesPage() {
    const router = useRouter();
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);

    const { data: invoicesData, isLoading, isFetching } = useQuery({
        queryKey: ['invoices', search, page, pageSize],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            params.append('page', String(page));
            params.append('pageSize', String(pageSize));
            const response = await apiClient.get(`/invoices?${params.toString()}`);
            return response.data;
        },
        placeholderData: keepPreviousData,
    });

    const invoices = invoicesData?.items ?? [];

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        );
    }

    const totalAmount = invoices?.reduce((sum: number, inv: any) => sum + (inv.total || 0), 0) || 0;

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
                <div className="flex gap-2">
                    <Button className="gap-2" onClick={() => router.push('/invoices/new')}>
                        <Plus className="h-4 w-4" />
                        Create Invoice
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
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
                                <TableHead>Invoice Date</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {invoices?.map((invoice: any) => (
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
                                    <TableCell className="text-muted-foreground">
                                        {new Date(invoice.createdAt).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric'
                                        })}
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
                            ))}
                            {(!invoices || invoices.length === 0) && (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-32 text-center">
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

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-sm text-muted-foreground">
                    {typeof invoicesData?.total === 'number'
                        ? `Showing ${invoices.length} of ${invoicesData.total}`
                        : `Showing ${invoices.length}`}
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
                        disabled={typeof invoicesData?.total === 'number' ? page * pageSize >= invoicesData.total : invoices.length < pageSize}
                    >
                        Next
                    </Button>
                </div>
            </div>
        </div>
    );
}
