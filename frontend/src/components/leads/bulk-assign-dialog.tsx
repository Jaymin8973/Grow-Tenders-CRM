import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
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

interface BulkAssignDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedLeads: string[];
    onSuccess: () => void;
}

export function BulkAssignDialog({
    open,
    onOpenChange,
    selectedLeads,
    onSuccess,
}: BulkAssignDialogProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [selectedUserId, setSelectedUserId] = useState('');

    // Fetch employees
    const { data: employees, isLoading } = useQuery({
        queryKey: ['users', 'employees'],
        queryFn: async () => {
            const response = await apiClient.get('/users?role=EMPLOYEE');
            return response.data;
        },
        enabled: open,
    });

    const assignMutation = useMutation({
        mutationFn: async (userId: string) => {
            return apiClient.post('/leads/bulk-assign', {
                leadIds: selectedLeads,
                assigneeId: userId,
            });
        },
        onSuccess: (response) => {
            queryClient.invalidateQueries({ queryKey: ['leads'] });
            queryClient.invalidateQueries({ queryKey: ['lead-stats'] });
            toast({
                title: 'Leads assigned',
                description: response.data.message,
            });
            onSuccess();
            onOpenChange(false);
            setSelectedUserId('');
        },
        onError: (error: any) => {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to assign leads',
                variant: 'destructive',
            });
        },
    });

    const handleAssign = () => {
        if (selectedUserId && selectedLeads.length > 0) {
            assignMutation.mutate(selectedUserId);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Assign {selectedLeads.length} Lead(s)</DialogTitle>
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
                        onClick={handleAssign}
                        disabled={assignMutation.isPending || !selectedUserId}
                    >
                        {assignMutation.isPending ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Assigning...
                            </>
                        ) : (
                            'Assign'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
