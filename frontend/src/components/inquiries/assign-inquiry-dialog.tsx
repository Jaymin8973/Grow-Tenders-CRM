import { useEffect, useState } from 'react';
import { useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
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
import { InfiniteAutocomplete } from '@/components/ui/infinite-autocomplete';
import { Label } from '@/components/ui/label';

interface AssignInquiryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    inquiryId: string;
    currentAssigneeId?: string | null;
}

export function AssignInquiryDialog({
    open,
    onOpenChange,
    inquiryId,
    currentAssigneeId,
}: AssignInquiryDialogProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [selectedUserId, setSelectedUserId] = useState(currentAssigneeId || '');
    const [employeeSearch, setEmployeeSearch] = useState('');

    useEffect(() => {
        setSelectedUserId(currentAssigneeId || '');
    }, [currentAssigneeId, open]);

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
            return apiClient.patch(`/inquiries/${inquiryId}/assign`, { assigneeId: userId });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inquiries'] });
            toast({ title: 'Inquiry assigned successfully' });
            onOpenChange(false);
        },
        onError: () => {
            toast({ title: 'Failed to assign inquiry', variant: 'destructive' });
        },
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Assign Inquiry</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label>Select Employee</Label>
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
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={() => assignMutation.mutate(selectedUserId)}
                        disabled={
                            assignMutation.isPending ||
                            !selectedUserId ||
                            selectedUserId === (currentAssigneeId || '')
                        }
                    >
                        {assignMutation.isPending ? 'Assigning...' : 'Assign'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
