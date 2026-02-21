'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { UserPlus, Loader2 } from 'lucide-react';

interface BulkAssignModalProps {
    isOpen: boolean;
    onClose: () => void;
    teamMembers: any[];
    selectedLeadIds: string[];
}

export function BulkAssignModal({ isOpen, onClose, teamMembers, selectedLeadIds }: BulkAssignModalProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [assigneeId, setAssigneeId] = useState<string>('');

    const assignMutation = useMutation({
        mutationFn: async (payload: any) => {
            return apiClient.patch('/raw-leads/assign', payload);
        },
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ['raw-leads'] });
            toast({
                title: 'Data Assigned',
                description: `Successfully assigned ${res.data.updatedCount} leads.`,
            });
            handleClose();
        },
        onError: (err: any) => {
            toast({
                title: 'Assignment Failed',
                description: err.response?.data?.message || 'Something went wrong.',
                variant: 'destructive',
            });
        }
    });

    const handleClose = () => {
        setAssigneeId('');
        onClose();
    };


    const onSubmit = async () => {
        if (!assigneeId) {
            toast({ title: 'Error', description: 'Please select a team member.', variant: 'destructive' });
            return;
        }

        const payload = {
            rawLeadIds: selectedLeadIds,
            assigneeId: assigneeId
        };

        assignMutation.mutate(payload);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle>Assign Raw Leads</DialogTitle>
                    <DialogDescription>
                        Assign {selectedLeadIds.length} selected lead(s) to a team member.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label>Team Member</Label>
                        <Select value={assigneeId} onValueChange={setAssigneeId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select team member" />
                            </SelectTrigger>
                            <SelectContent>
                                {teamMembers?.map((m: any) => (
                                    <SelectItem key={m.id} value={m.id}>
                                        {m.firstName} {m.lastName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose}>Cancel</Button>
                    <Button
                        onClick={onSubmit}
                        disabled={assignMutation.isPending || !assigneeId || selectedLeadIds.length === 0}
                    >
                        {assignMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <UserPlus className="mr-2 h-4 w-4" />
                        Assign Selected
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
