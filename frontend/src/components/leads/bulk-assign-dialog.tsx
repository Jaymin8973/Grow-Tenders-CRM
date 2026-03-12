import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { getErrorMessage } from '@/lib/error-utils';
import { useToast } from '@/hooks/use-toast';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { SearchableSelect } from '@/components/ui/searchable-select';
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
                title: 'Failed to assign leads',
                description: getErrorMessage(error),
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
                        {isLoading ? (
                            <div className="flex items-center gap-2 p-2 border rounded-md">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span className="text-sm text-muted-foreground">Loading...</span>
                            </div>
                        ) : (
                            <SearchableSelect
                                value={selectedUserId}
                                onValueChange={setSelectedUserId}
                                placeholder="Select an employee"
                                emptyMessage="No employees found."
                                options={employees?.filter((u: any) => u.role === 'EMPLOYEE').map((user: any) => ({
                                    value: user.id,
                                    label: `${user.firstName} ${user.lastName}`,
                                    searchTerms: `${user.firstName} ${user.lastName}`,
                                })) || []}
                            />
                        )}
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
