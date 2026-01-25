'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api-client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
import { useToast } from '@/components/ui/use-toast';
import { AlertCircle, Download, Mail, Search, User } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';

export default function DueInvoicesPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { user } = useAuth();

    const [search, setSearch] = useState('');
    const [daysOverdue, setDaysOverdue] = useState<string>('7');
    const [assigneeId, setAssigneeId] = useState<string>('all');

    const isManager = user?.role === 'MANAGER';
    const isSuperAdmin = user?.role === 'SUPER_ADMIN';

    const { data: users } = useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            const response = await apiClient.get('/users');
            return response.data;
        },
        enabled: isManager || isSuperAdmin,
    });

    const employeeOptions = useMemo(() => {
        const employees = (users || []).filter((u: any) => u.role === 'EMPLOYEE');
        if (isManager) {
            return employees.filter((e: any) => e.managerId === user?.id);
        }
        return employees;
    }, [users, isManager, user]);

    const { data, isLoading } = useQuery({
        queryKey: ['invoices', 'due', search, daysOverdue, assigneeId],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (daysOverdue && daysOverdue !== 'all') params.append('daysOverdue', daysOverdue);
            if (assigneeId && assigneeId !== 'all') params.append('assigneeId', assigneeId);
            const res = await apiClient.get(`/invoices/due?${params.toString()}`);
            return res.data as { count: number; totalDue: number; invoices: any[] };
        },
    });

    const downloadMutation = useMutation({
        mutationFn: async (invoiceId: string) => {
            const response = await apiClient.get(`/invoices/${invoiceId}/pdf`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `invoice-${invoiceId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        },
        onSuccess: () => {
            toast({ title: 'PDF downloaded' });
        },
        onError: () => {
            toast({ title: 'Failed to download PDF', variant: 'destructive' });
        },
    });

    const emailMutation = useMutation({
        mutationFn: async (invoice: any) => {
            const to = invoice.customer?.email;
            return apiClient.post(`/invoices/${invoice.id}/email`, { to });
        },
        onSuccess: () => {
            toast({ title: 'Invoice email sent' });
        },
        onError: () => {
            toast({ title: 'Failed to send email', variant: 'destructive' });
        },
    });

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        );
    }

    const invoices = data?.invoices || [];

    return (
        <div className="space-y-6 page-enter">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <AlertCircle className="h-8 w-8 text-amber-600" />
                    <div>
                        <h1 className="text-3xl font-bold">Due Invoices</h1>
                        <p className="text-muted-foreground mt-1">Overdue invoices requiring follow-up</p>
                    </div>
                </div>
                <Button variant="outline" onClick={() => router.push('/invoices')}>
                    Back to Invoices
                </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardContent className="p-5">
                        <div className="flex items-center gap-4">
                            <div className="stat-icon bg-red-50">
                                <AlertCircle className="h-6 w-6 text-red-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{data?.count || 0}</p>
                                <p className="text-sm text-muted-foreground">Total Due</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-5">
                        <div className="flex items-center gap-4">
                            <div className="stat-icon bg-amber-50">
                                <AlertCircle className="h-6 w-6 text-amber-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{formatCurrency(data?.totalDue || 0)}</p>
                                <p className="text-sm text-muted-foreground">Amount Due</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search by invoice number or company"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select value={daysOverdue} onValueChange={setDaysOverdue}>
                            <SelectTrigger className="w-[160px]">
                                <SelectValue placeholder="Days Overdue" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All</SelectItem>
                                <SelectItem value="7">7+ days</SelectItem>
                                <SelectItem value="14">14+ days</SelectItem>
                                <SelectItem value="30">30+ days</SelectItem>
                                <SelectItem value="60">60+ days</SelectItem>
                            </SelectContent>
                        </Select>
                        {(isManager || isSuperAdmin) && (
                            <Select value={assigneeId} onValueChange={setAssigneeId}>
                                <SelectTrigger className="w-[220px]">
                                    <SelectValue placeholder="Assignee" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Owners</SelectItem>
                                    {employeeOptions.map((emp: any) => (
                                        <SelectItem key={emp.id} value={emp.id}>
                                            {emp.firstName} {emp.lastName}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Invoice</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead>Due Date</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {invoices.map((invoice: any) => (
                                <TableRow key={invoice.id} className="table-row-hover">
                                    <TableCell>
                                        <p className="font-medium font-mono text-primary">
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
                                        {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-US', {
                                            month: 'short', day: 'numeric', year: 'numeric'
                                        }) : '-'}
                                    </TableCell>
                                    <TableCell className="text-right font-bold">
                                        {formatCurrency(invoice.total || 0)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => router.push(`/invoices/${invoice.id}`)}
                                            >
                                                <User className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => downloadMutation.mutate(invoice.id)}
                                            >
                                                <Download className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => emailMutation.mutate(invoice)}
                                                disabled={!invoice.customer?.email}
                                            >
                                                <Mail className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {invoices.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-32 text-center">
                                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                                            <AlertCircle className="h-10 w-10 mb-2 opacity-50" />
                                            <p>No due invoices found</p>
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
