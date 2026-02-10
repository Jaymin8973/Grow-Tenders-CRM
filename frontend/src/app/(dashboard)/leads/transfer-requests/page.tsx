'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { formatDistanceToNow } from 'date-fns';
import { Check, X, ArrowRight, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';

export default function TransferRequestsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
    const [action, setAction] = useState<'APPROVE' | 'REJECT' | null>(null);
    const [adminNotes, setAdminNotes] = useState('');

    // Redirect if not authorized (though middleware/guard should handle this)
    if (user && user.role === 'EMPLOYEE') {
        router.push('/dashboard');
    }

    const { data: requests, isLoading } = useQuery({
        queryKey: ['transfer-requests'],
        queryFn: async () => {
            const response = await apiClient.get('/lead-transfer-requests?status=PENDING');
            return response.data;
        },
    });

    const decisionMutation = useMutation({
        mutationFn: async ({ id, decision, notes }: { id: string; decision: 'APPROVE' | 'REJECT'; notes?: string }) => {
            const response = await apiClient.post(`/lead-transfer-requests/${id}/decision`, {
                decision,
                notes,
            });
            return response.data;
        },
        onSuccess: () => {
            toast({ title: `Request ${action === 'APPROVE' ? 'Approved' : 'Rejected'}` });
            queryClient.invalidateQueries({ queryKey: ['transfer-requests'] });
            setSelectedRequest(null);
            setAction(null);
            setAdminNotes('');
        },
        onError: (error: any) => {
            toast({
                title: 'Action failed',
                description: error.response?.data?.message || 'Something went wrong',
                variant: 'destructive',
            });
        },
    });

    const handleAction = (requestId: string, actionType: 'APPROVE' | 'REJECT') => {
        setSelectedRequest(requestId);
        setAction(actionType);
        setAdminNotes('');
    };

    const confirmAction = () => {
        if (!selectedRequest || !action) return;
        decisionMutation.mutate({
            id: selectedRequest,
            decision: action,
            notes: adminNotes,
        });
    };

    if (isLoading) {
        return <div className="p-8 text-center">Loading requests...</div>;
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Lead Transfer Requests</h2>
                <p className="text-muted-foreground">
                    Manage requests from employees to transfer leads.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {requests?.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-muted-foreground">
                        No pending transfer requests.
                    </div>
                ) : (
                    requests?.map((request: any) => (
                        <Card key={request.id} className="flex flex-col">
                            <CardHeader>
                                <CardTitle className="flex justify-between items-start text-base">
                                    <span>{request.lead.firstName} {request.lead.lastName}</span>
                                    <Badge variant="outline">{request.lead.company || 'No Company'}</Badge>
                                </CardTitle>
                                <CardDescription>
                                    Lead ID: {request.lead.id.slice(-6)}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1 space-y-4">
                                <div className="flex items-center justify-between text-sm border-b pb-2">
                                    <div className="flex items-center gap-2">
                                        <UserIcon className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-muted-foreground">From:</span>
                                    </div>
                                    <span className="font-medium">
                                        {request.requester.firstName} {request.requester.lastName}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm border-b pb-2">
                                    <div className="flex items-center gap-2">
                                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-muted-foreground">To:</span>
                                    </div>
                                    <span className="font-medium">
                                        {request.targetUser
                                            ? `${request.targetUser.firstName} ${request.targetUser.lastName}`
                                            : 'Unassigned / Pool'}
                                    </span>
                                </div>
                                <div className="bg-muted/50 p-3 rounded-md text-sm">
                                    <p className="font-medium mb-1 text-xs text-muted-foreground uppercase">Reason</p>
                                    <p className="italic">"{request.reason || 'No reason provided'}"</p>
                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-between border-t p-4 pt-4 bg-muted/20">
                                <span className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                                </span>
                                <div className="flex gap-2">
                                    <Dialog open={selectedRequest === request.id && !!action} onOpenChange={(open) => !open && setSelectedRequest(null)}>
                                        <DialogTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                                onClick={() => handleAction(request.id, 'REJECT')}
                                            >
                                                <X className="h-4 w-4 mr-1" />
                                                Reject
                                            </Button>
                                        </DialogTrigger>
                                        <DialogTrigger asChild>
                                            <Button
                                                size="sm"
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                                onClick={() => handleAction(request.id, 'APPROVE')}
                                            >
                                                <Check className="h-4 w-4 mr-1" />
                                                Approve
                                            </Button>
                                        </DialogTrigger>

                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>
                                                    {action === 'APPROVE' ? 'Approve Transfer' : 'Reject Transfer'}
                                                </DialogTitle>
                                                <DialogDescription>
                                                    {action === 'APPROVE'
                                                        ? `Are you sure you want to approve this transfer? The lead will be assigned to ${request.targetUser ? `${request.targetUser.firstName} ${request.targetUser.lastName}` : 'Unassigned/Pool'}.`
                                                        : 'Are you sure you want to reject this transfer request?'}
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="space-y-2 py-2">
                                                <label className="text-sm font-medium">Admin Notes (Optional)</label>
                                                <Textarea
                                                    placeholder="Add a note..."
                                                    value={adminNotes}
                                                    onChange={(e) => setAdminNotes(e.target.value)}
                                                />
                                            </div>
                                            <DialogFooter>
                                                <Button variant="outline" onClick={() => setSelectedRequest(null)}>Cancel</Button>
                                                <Button
                                                    variant={action === 'REJECT' ? 'destructive' : 'default'}
                                                    onClick={confirmAction}
                                                    disabled={decisionMutation.isPending}
                                                >
                                                    {decisionMutation.isPending ? 'Processing...' : 'Confirm'}
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </CardFooter>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
