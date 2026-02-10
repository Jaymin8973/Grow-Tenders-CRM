'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import apiClient from '@/lib/api-client';

interface TransferRequestDialogProps {
    isOpen: boolean;
    onClose: () => void;
    leadId: string | null;
    leadName?: string;
}

export function TransferRequestDialog({
    isOpen,
    onClose,
    leadId,
    leadName,
}: TransferRequestDialogProps) {
    const [reason, setReason] = useState('');
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const requestTransferMutation = useMutation({
        mutationFn: async (data: { leadId: string; reason: string }) => {
            const response = await apiClient.post('/lead-transfer-requests/claim', data);
            return response.data;
        },
        onSuccess: () => {
            toast({
                title: 'Request Sent',
                description: 'Your transfer request has been sent to the managers.',
            });
            onClose();
            setReason('');
        },
        onError: (error: any) => {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to send request',
                variant: 'destructive',
            });
        },
    });

    const handleSubmit = () => {
        if (!leadId) return;
        if (!reason.trim()) {
            toast({
                title: 'Reason required',
                description: 'Please provide a reason for requesting this lead.',
                variant: 'destructive',
            });
            return;
        }
        requestTransferMutation.mutate({ leadId, reason });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Request Lead Transfer</DialogTitle>
                    <DialogDescription>
                        Request ownership of <strong>{leadName || 'this lead'}</strong>.
                        This request will be sent to admins/managers for approval.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="reason">Reason for Request</Label>
                        <Textarea
                            id="reason"
                            placeholder="Why do you want to claim this lead?"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="min-h-[100px]"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={requestTransferMutation.isPending}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={requestTransferMutation.isPending}>
                        {requestTransferMutation.isPending ? 'Sending...' : 'Send Request'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
