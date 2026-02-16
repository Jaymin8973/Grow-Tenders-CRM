
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';
import { Check, X, ExternalLink, ImageIcon } from 'lucide-react';

export function PaymentApprovalList() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [rejectDialog, setRejectDialog] = useState<{ id: string, open: boolean } | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');

    const { data: requests, isLoading } = useQuery({
        queryKey: ['payment-requests-admin'],
        queryFn: async () => {
            const response = await apiClient.get('/payment-requests');
            return response.data;
        },
    });

    const mutation = useMutation({
        mutationFn: async ({ id, status, reason }: { id: string, status: 'APPROVED' | 'REJECTED', reason?: string }) => {
            return apiClient.patch(`/payment-requests/${id}/status`, { status, rejectionReason: reason });
        },
        onSuccess: () => {
            toast({ title: 'Request updated successfully' });
            queryClient.invalidateQueries({ queryKey: ['payment-requests-admin'] });
            setRejectDialog(null);
            setRejectionReason('');
        },
        onError: (error: any) => {
            toast({
                title: 'Failed to update request',
                description: error.response?.data?.message || 'Something went wrong',
                variant: 'destructive',
            });
        },
    });

    const handleApprove = (id: string) => {
        if (confirm('Are you sure you want to approve this request? It will act as a verified Payment.')) {
            mutation.mutate({ id, status: 'APPROVED' });
        }
    };

    const handleReject = () => {
        if (rejectDialog && rejectionReason) {
            mutation.mutate({ id: rejectDialog.id, status: 'REJECTED', reason: rejectionReason });
        }
    };

    if (isLoading) return <div>Loading requests...</div>;

    return (
        <>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Requester</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Related To</TableHead>
                            <TableHead>Proof</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {requests?.map((req: any) => (
                            <TableRow key={req.id}>
                                <TableCell>
                                    {new Date(req.createdAt).toLocaleDateString()}
                                </TableCell>
                                <TableCell>
                                    <div className="font-medium">{req.requester?.firstName} {req.requester?.lastName}</div>
                                    <div className="text-xs text-muted-foreground">{req.requester?.email}</div>
                                </TableCell>
                                <TableCell className="font-bold">
                                    {formatCurrency(req.amount)}
                                </TableCell>
                                <TableCell>
                                    {req.lead ? (
                                        <div className="text-sm">Lead: {req.lead.firstName} {req.lead.lastName}</div>
                                    ) : req.customer ? (
                                        <div className="text-sm">Cust: {req.customer.firstName} {req.customer.lastName}</div>
                                    ) : (
                                        <span className="text-muted-foreground">-</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {req.screenshotUrl ? (
                                        <a
                                            // Assuming the API URL base for uploads, might need adjustment based on serve-static
                                            href={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${req.screenshotUrl}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex items-center gap-1 text-blue-600 hover:underline"
                                        >
                                            <ImageIcon className="h-4 w-4" /> View
                                        </a>
                                    ) : (
                                        <span className="text-muted-foreground">No File</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Badge variant={req.status === 'APPROVED' ? 'default' : req.status === 'REJECTED' ? 'destructive' : 'secondary'}>
                                        {req.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    {req.status === 'PENDING' && (
                                        <div className="flex justify-end gap-2">
                                            <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-green-600 border-green-200 hover:bg-green-50" onClick={() => handleApprove(req.id)}>
                                                <Check className="h-4 w-4" />
                                            </Button>
                                            <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-red-600 border-red-200 hover:bg-red-50" onClick={() => setRejectDialog({ id: req.id, open: true })}>
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                        {(!requests || requests.length === 0) && (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                    No payment requests found
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={!!rejectDialog} onOpenChange={(open) => !open && setRejectDialog(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Payment Request</DialogTitle>
                        <DialogDescription>
                            Please provide a reason for rejecting this request.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Textarea
                            placeholder="Reason for rejection..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectDialog(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleReject} disabled={!rejectionReason}>Reject</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
