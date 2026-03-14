import { useState } from 'react';
import { useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
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
import { InfiniteAutocomplete } from '@/components/ui/infinite-autocomplete';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface BulkAssignInquiriesDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedInquiries: string[];
    onSuccess: () => void;
}

export function BulkAssignInquiriesDialog({
    open,
    onOpenChange,
    selectedInquiries,
    onSuccess,
}: BulkAssignInquiriesDialogProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [selectedUserId, setSelectedUserId] = useState('');
    const [employeeSearch, setEmployeeSearch] = useState('');

    const {
        data: employees,
        isLoading,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useInfiniteQuery({
        queryKey: ['users', 'employees', { search: employeeSearch }],
        initialPageParam: 1,
        queryFn: async ({ pageParam }) => {
            const params = new URLSearchParams();
            params.set('role', 'EMPLOYEE');
            params.set('page', String(pageParam ?? 1));
            params.set('limit', '50');
            if (employeeSearch) params.set('search', employeeSearch);
            const response = await apiClient.get(`/users/options?${params.toString()}`);
            return response.data;
        },
        getNextPageParam: (lastPage: any) => {
            const page = Number(lastPage?.meta?.page ?? 1);
            const totalPages = Number(lastPage?.meta?.totalPages ?? 1);
            if (page < totalPages) return page + 1;
            return undefined;
        },
        enabled: open,
    });

    const employeeOptions =
        employees?.pages
            ?.flatMap((p: any) => (Array.isArray(p?.data) ? p.data : []))
            .map((u: any) => ({ value: u.id, label: `${u.firstName} ${u.lastName}` })) || [];

    const assignMutation = useMutation({
        mutationFn: async (userId: string) => {
            return apiClient.post('/inquiries/bulk-assign', {
                inquiryIds: selectedInquiries,
                assigneeId: userId,
            });
        },
        onSuccess: (response) => {
            queryClient.invalidateQueries({ queryKey: ['inquiries'] });
            toast({
                title: 'Inquiries assigned',
                description: response.data.message,
            });
            onSuccess();
            onOpenChange(false);
            setSelectedUserId('');
        },
        onError: (error: any) => {
            toast({
                title: 'Failed to assign inquiries',
                description: getErrorMessage(error),
                variant: 'destructive',
            });
        },
    });

    const handleAssign = () => {
        if (selectedUserId && selectedInquiries.length > 0) {
            assignMutation.mutate(selectedUserId);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Assign {selectedInquiries.length} Inquiry(s)</DialogTitle>
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
                            <InfiniteAutocomplete
                                value={selectedUserId}
                                onValueChange={setSelectedUserId}
                                placeholder="Search employee..."
                                emptyMessage="No employees found"
                                options={employeeOptions}
                                loading={isLoading}
                                showAllOption={false}
                                hasMore={!!hasNextPage}
                                loadingMore={isFetchingNextPage}
                                onLoadMore={() => fetchNextPage()}
                                searchValue={employeeSearch}
                                onSearchChange={setEmployeeSearch}
                            />
                        )}
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleAssign} disabled={assignMutation.isPending || !selectedUserId}>
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
