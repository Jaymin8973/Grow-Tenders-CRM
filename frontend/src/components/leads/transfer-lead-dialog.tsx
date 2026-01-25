import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { useToast } from '@/components/ui/use-toast';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface TransferLeadDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    leadId: string;
}

export function TransferLeadDialog({
    open,
    onOpenChange,
    leadId,
}: TransferLeadDialogProps) {
    const { toast } = useToast();
    const [reason, setReason] = useState('');
    const [targetUserId, setTargetUserId] = useState('');

    // Ideally, catch fetching error if users endpoint is restricted, but typically employees can list users (or at least other employees)
    const { data: employees } = useQuery({
        queryKey: ['users', 'employees'],
        queryFn: async () => {
            const response = await apiClient.get('/users?role=EMPLOYEE');
            return response.data;
        },
        enabled: open,
    });

    const transferMutation = useMutation({
        mutationFn: async () => {
            return apiClient.post('/lead-transfer-requests', {
                leadId,
                reason,
                targetUserId: targetUserId || undefined,
            });
        },
        onSuccess: () => {
            toast({ title: 'Transfer request submitted', description: 'Subject to approval by manager.' });
            onOpenChange(false);
            setReason('');
            setTargetUserId('');
        },
        onError: () => {
            toast({ title: 'Failed to submit request', variant: 'destructive' });
        },
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Request Lead Transfer</DialogTitle>
                    <DialogDescription>
                        Submit a request to transfer this lead to another employee.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label>Reason for Transfer</Label>
                        <Textarea
                            placeholder="Why are you transferring this lead?"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Suggested Assignee (Optional)</Label>
                        <Select value={targetUserId} onValueChange={setTargetUserId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select (Optional)" />
                            </SelectTrigger>
                            <SelectContent>
                                {employees?.filter((u: any) => u.role === 'EMPLOYEE').map((user: any) => (
                                    <SelectItem key={user.id} value={user.id}>
                                        {user.firstName} {user.lastName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={() => transferMutation.mutate()}
                        disabled={transferMutation.isPending || !reason.trim()}
                    >
                        {transferMutation.isPending ? 'Submitting...' : 'Submit Request'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
