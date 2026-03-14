import { useState } from 'react';
import { useMutation, useInfiniteQuery } from '@tanstack/react-query';
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
import { InfiniteAutocomplete } from '@/components/ui/infinite-autocomplete';
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

    const transferMutation = useMutation({
        mutationFn: async () => {
            return apiClient.post('/transfer-requests', {
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
                        <InfiniteAutocomplete
                            value={targetUserId}
                            onValueChange={setTargetUserId}
                            placeholder="Search employee (optional)..."
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
