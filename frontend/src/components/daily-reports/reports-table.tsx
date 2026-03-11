'use client';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import apiClient from '@/lib/api-client';

interface DailyReport {
    id: string;
    title: string | null;
    content: string;
    callCount: number;
    avgTalkTime: number;
    leadsGenerated: number;
    date: string;
    createdAt: string;
    employee: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        showEmail?: boolean;
        role: string;
    };
    paymentReceivedFromCustomers: Array<{
        id: string;
        firstName: string;
        lastName: string;
        company?: string;
    }>;
    leadIds?: string[];
    leads?: Array<{
        id: string;
        firstName: string;
        lastName: string;
        company?: string;
        status: string;
    }>;
    paymentDetails?: Array<{
        customerId?: string;
        leadId?: string;
        amount?: number;
        notes?: string;
    }>;
}

interface ReportsTableProps {
    reports: DailyReport[];
    currentUserId?: string;
    userRole?: string;
    onRefresh?: () => void;
    onEdit?: (report: DailyReport) => void;
}

export function ReportsTable({ reports, currentUserId, userRole, onRefresh, onEdit }: ReportsTableProps) {
    const { toast } = useToast();
    const [deleting, setDeleting] = useState<string | null>(null);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this report?')) return;
        setDeleting(id);
        try {
            await apiClient.delete(`/daily-reports/${id}`);
            toast({ title: 'Report deleted successfully' });
            onRefresh?.();
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to delete report',
                variant: 'destructive'
            });
        } finally {
            setDeleting(null);
        }
    };

    if (reports.length === 0) {
        return <div className="text-center py-10 text-muted-foreground">No reports found.</div>;
    }

    const canEditReport = (report: DailyReport) => {
        return userRole === 'EMPLOYEE' && report.employee.id === currentUserId;
    };

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Employee</TableHead>
                        <TableHead>Calls</TableHead>
                        <TableHead>Talk Time</TableHead>
                        <TableHead>Leads</TableHead>
                        <TableHead>Payments From Leads</TableHead>
                        {userRole === 'EMPLOYEE' && <TableHead>Actions</TableHead>}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {reports.map((report) => (
                        <TableRow key={report.id}>
                            <TableCell className="align-top whitespace-nowrap">
                                <div className="flex flex-col">
                                    <span className="font-medium">
                                        {format(new Date(report.date), 'MMM d, yyyy')}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        {format(new Date(report.createdAt), 'h:mm a')}
                                    </span>
                                </div>
                            </TableCell>
                            <TableCell className="align-top">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-8 w-8">
                                        <AvatarFallback>
                                            {report.employee.firstName[0]}
                                            {report.employee.lastName[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                        <span className="font-medium">
                                            {report.employee.firstName} {report.employee.lastName}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {userRole === 'SUPER_ADMIN' ? report.employee.email : (report.employee.showEmail ? report.employee.email : '-')}
                                        </span>
                                    </div>
                                </div>
                            </TableCell>
                            {/* Summary cell removed */}
                            <TableCell className="align-top">
                                <span className="font-medium">{report.callCount}</span>
                            </TableCell>
                            <TableCell className="align-top">
                                <span className="font-medium">{report.avgTalkTime}m</span>
                            </TableCell>
                            <TableCell className="align-top">
                                <span className="font-medium">{report.leadsGenerated}</span>
                            </TableCell>
                            <TableCell className="align-top">
                                {report.paymentDetails && report.paymentDetails.length > 0 ? (
                                    <div className="flex flex-col gap-1">
                                        {report.paymentDetails.map((pd, idx) => {
                                            const lead = report.leads?.find(l => l.id === pd.leadId);
                                            const amountNumber = pd.amount === undefined || pd.amount === null
                                                ? undefined
                                                : typeof pd.amount === 'number'
                                                    ? pd.amount
                                                    : Number(pd.amount);
                                            return (
                                                <div key={idx} className="flex items-center gap-2">
                                                    {(lead || pd.leadId) && (
                                                        <Badge variant="secondary" className="text-xs font-normal">
                                                            {lead ? `${lead.firstName} ${lead.lastName}` : pd.leadId}
                                                        </Badge>
                                                    )}
                                                    {amountNumber !== undefined && !Number.isNaN(amountNumber) && (
                                                        <span className="text-xs font-medium">₹{amountNumber.toLocaleString()}</span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <span className="text-xs text-muted-foreground">-</span>
                                )}
                            </TableCell>
                            {userRole === 'EMPLOYEE' && (
                                <TableCell className="align-top">
                                    {canEditReport(report) && (
                                        <div className="flex gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onEdit?.(report)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(report.id)}
                                                disabled={deleting === report.id}
                                            >
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </div>
                                    )}
                                </TableCell>
                            )}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
