import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { useToast } from '@/components/ui/use-toast';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface AssignLeadDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    leadId: string;
    currentAssigneeId?: string;
}

export function AssignLeadDialog({
    open,
    onOpenChange,
    leadId,
    currentAssigneeId,
}: AssignLeadDialogProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [selectedUserId, setSelectedUserId] = useState(currentAssigneeId || '');

    // Fetch employees only
    const { data: employees, isLoading } = useQuery({
        queryKey: ['users', 'employees'],
        queryFn: async () => {
            const response = await apiClient.get('/users?role=EMPLOYEE'); // Assuming backend supports role filtering or we filter clientside if needed
            // If backend doesn't support filtering, we filter here:
            // return response.data.filter((u: any) => u.role === 'EMPLOYEE');
            return response.data;
        },
        enabled: open,
    });

    const assignMutation = useMutation({
        mutationFn: async (userId: string) => {
            return apiClient.patch(`/leads/${leadId}`, { assigneeId: userId });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['lead', leadId] });
            toast({ title: 'Lead assigned successfully' });
            onOpenChange(false);
        },
        onError: () => {
            toast({ title: 'Failed to assign lead', variant: 'destructive' });
        },
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Assign Lead</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label>Select Employee</Label>
                        <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select an employee" />
                            </SelectTrigger>
                            <SelectContent>
                                {isLoading ? (
                                    <div className="flex items-center justify-center p-2">
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        Loading...
                                    </div>
                                ) : (
                                    employees?.filter((u: any) => u.role === 'EMPLOYEE').map((user: any) => (
                                        <SelectItem key={user.id} value={user.id}>
                                            {user.firstName} {user.lastName}
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={() => assignMutation.mutate(selectedUserId)}
                        disabled={assignMutation.isPending || !selectedUserId || selectedUserId === currentAssigneeId}
                    >
                        {assignMutation.isPending ? 'Assigning...' : 'Assign'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
