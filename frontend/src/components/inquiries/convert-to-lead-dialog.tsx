'use client';

import { useState } from 'react';
import { useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { useToast } from '@/components/ui/use-toast';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { InfiniteAutocomplete } from '@/components/ui/infinite-autocomplete';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface Inquiry {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    subject: string;
    message: string;
}

interface ConvertToLeadDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    inquiry: Inquiry;
    onSuccess: () => void;
}

export function ConvertToLeadDialog({
    open,
    onOpenChange,
    inquiry,
    onSuccess,
}: ConvertToLeadDialogProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [selectedAssigneeId, setSelectedAssigneeId] = useState('');
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

    const convertMutation = useMutation({
        mutationFn: async (assigneeId?: string) => {
            return apiClient.post(`/inquiries/${inquiry.id}/convert-to-lead`, 
                assigneeId ? { assigneeId } : {}
            );
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inquiries'] });
            queryClient.invalidateQueries({ queryKey: ['leads'] });
            toast({ title: 'Inquiry converted to lead successfully' });
            onSuccess();
            onOpenChange(false);
        },
        onError: (error: any) => {
            toast({
                title: 'Failed to convert inquiry',
                description: error.response?.data?.message || 'Something went wrong',
                variant: 'destructive',
            });
        },
    });

    const handleConvert = () => {
        convertMutation.mutate(selectedAssigneeId || undefined);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Convert to Lead</DialogTitle>
                    <DialogDescription>
                        Convert this inquiry to a lead with COLD status. The inquiry will be deleted after conversion.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="rounded-lg border p-4 bg-muted/50 space-y-2">
                        <div className="text-sm">
                            <span className="font-medium">Name:</span> {inquiry.name}
                        </div>
                        <div className="text-sm">
                            <span className="font-medium">Email:</span> {inquiry.email}
                        </div>
                        {inquiry.phone && (
                            <div className="text-sm">
                                <span className="font-medium">Phone:</span> {inquiry.phone}
                            </div>
                        )}
                        <div className="text-sm">
                            <span className="font-medium">Subject:</span> {inquiry.subject}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Assign to Employee (Optional)</Label>
                        <InfiniteAutocomplete
                            value={selectedAssigneeId}
                            onValueChange={setSelectedAssigneeId}
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
                        <p className="text-xs text-muted-foreground">
                            Leave empty to create an unassigned lead
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={convertMutation.isPending}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConvert}
                        disabled={convertMutation.isPending}
                    >
                        {convertMutation.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Convert to Lead
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
