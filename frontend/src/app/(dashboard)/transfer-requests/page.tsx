'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { formatDistanceToNow } from 'date-fns';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

export default function TransferRequestsPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: requests, isLoading } = useQuery({
        queryKey: ['lead-transfer-requests'],
        queryFn: async () => {
            const response = await apiClient.get('/lead-transfer-requests?status=PENDING');
            return response.data;
        },
    });

    const decideMutation = useMutation({
        mutationFn: async ({ id, decision }: { id: string, decision: 'APPROVE' | 'REJECT' }) => {
            return apiClient.post(`/lead-transfer-requests/${id}/decision`, { decision });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['lead-transfer-requests'] });
            toast({ title: 'Request processed successfully' });
        },
        onError: () => {
            toast({ title: 'Failed to process request', variant: 'destructive' });
        },
    });

    if (user?.role === 'EMPLOYEE') {
        return <div className="p-8 text-center">You do not have permission to view this page.</div>;
    }

    return (
        <div className="space-y-6 page-enter">
            <div>
                <h1 className="text-3xl font-bold">Transfer Requests</h1>
                <p className="text-muted-foreground mt-1">
                    Manage lead transfer requests from employees
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Pending Requests</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Lead</TableHead>
                                <TableHead>Requester</TableHead>
                                <TableHead>Proposed Target</TableHead>
                                <TableHead>Reason</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                    </TableCell>
                                </TableRow>
                            ) : requests?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                        No pending transfer requests
                                    </TableCell>
                                </TableRow>
                            ) : requests?.map((req: any) => (
                                <TableRow key={req.id}>
                                    <TableCell className="font-medium">
                                        {req.lead?.firstName} {req.lead?.lastName}
                                        <div className="text-xs text-muted-foreground">{req.lead?.company}</div>
                                    </TableCell>
                                    <TableCell>
                                        {req.requester?.firstName} {req.requester?.lastName}
                                    </TableCell>
                                    <TableCell>
                                        {req.targetUser ? (
                                            <Badge variant="outline">
                                                {req.targetUser.firstName} {req.targetUser.lastName}
                                            </Badge>
                                        ) : (
                                            <span className="text-muted-foreground text-sm">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="max-w-[200px] truncate" title={req.reason}>
                                        {req.reason || '-'}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {formatDistanceToNow(new Date(req.createdAt), { addSuffix: true })}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
                                                onClick={() => decideMutation.mutate({ id: req.id, decision: 'APPROVE' })}
                                                disabled={decideMutation.isPending}
                                            >
                                                <CheckCircle className="h-4 w-4 mr-1" />
                                                Approve
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                                                onClick={() => decideMutation.mutate({ id: req.id, decision: 'REJECT' })}
                                                disabled={decideMutation.isPending}
                                            >
                                                <XCircle className="h-4 w-4 mr-1" />
                                                Reject
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
