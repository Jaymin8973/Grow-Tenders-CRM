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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

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
        role: string;
    };
    paymentReceivedFromCustomers: Array<{
        id: string;
        firstName: string;
        lastName: string;
        company?: string;
    }>;
}

interface ReportsTableProps {
    reports: DailyReport[];
}

export function ReportsTable({ reports }: ReportsTableProps) {
    if (reports.length === 0) {
        return <div className="text-center py-10 text-muted-foreground">No reports found.</div>;
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Employee</TableHead>
                        {/* Summary column removed */}
                        <TableHead>Calls</TableHead>
                        <TableHead>Talk Time</TableHead>
                        <TableHead>Leads</TableHead>
                        <TableHead>Payments From</TableHead>
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
                                            {report.employee.email}
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
                                {report.paymentReceivedFromCustomers && report.paymentReceivedFromCustomers.length > 0 ? (
                                    <div className="flex flex-wrap gap-1">
                                        {report.paymentReceivedFromCustomers.map((customer) => (
                                            <Badge key={customer.id} variant="secondary" className="text-xs font-normal">
                                                {customer.firstName} {customer.lastName}
                                            </Badge>
                                        ))}
                                    </div>
                                ) : (
                                    <span className="text-xs text-muted-foreground">-</span>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
