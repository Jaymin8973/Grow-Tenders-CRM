
import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { getErrorMessage } from '@/lib/error-utils';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, AlertCircle, Calendar as CalendarIcon } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfiniteAutocomplete } from '@/components/ui/infinite-autocomplete';

interface TargetAssignmentProps {
    /** If provided, restricts assignment to this parent target (for managers assigning to team) */
    parentTargetId?: string;
    /** Maximum amount that can be assigned (from parent's remaining) */
    maxAmount?: number;
    /** Filter users by role */
    filterRole?: 'MANAGER' | 'EMPLOYEE';
    /** Custom title */
    title?: string;
    /** Custom description */
    description?: string;
    /** Called after successful assignment */
    onSuccess?: () => void;
}

export function TargetAssignment({
    parentTargetId,
    maxAmount,
    filterRole,
    title = 'Assign Monthly Target',
    description = 'Set a sales target for a user for a specific month.',
    onSuccess,
}: TargetAssignmentProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [open, setOpen] = useState(false);
    const [userId, setUserId] = useState('');
    const [userSearch, setUserSearch] = useState('');
    const [amount, setAmount] = useState('');
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [error, setError] = useState<string | null>(null);
    const monthInputRef = useRef<HTMLInputElement>(null);

    // Determine if this is Super Admin assigning to Managers
    const isSuperAdminMode = user?.role === 'SUPER_ADMIN' && !parentTargetId;

    const isManagerTeamMode = user?.role === 'MANAGER' && filterRole === 'EMPLOYEE';

    const {
        data: pagedUsers,
        isLoading: usersLoading,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useInfiniteQuery({
        queryKey: ['user-options', { role: filterRole, search: userSearch }],
        initialPageParam: 1,
        queryFn: async ({ pageParam }) => {
            const params = new URLSearchParams();
            params.set('page', String(pageParam ?? 1));
            params.set('limit', '50');
            if (filterRole) params.set('role', filterRole);
            if (userSearch) params.set('search', userSearch);
            const response = await apiClient.get(`/users/options?${params.toString()}`);
            return response.data;
        },
        getNextPageParam: (lastPage: any) => {
            const page = Number(lastPage?.meta?.page ?? 1);
            const totalPages = Number(lastPage?.meta?.totalPages ?? 1);
            if (page < totalPages) return page + 1;
            return undefined;
        },
        enabled: open && !isManagerTeamMode,
    });

    const { data: teamUsers, isLoading: teamUsersLoading } = useQuery({
        queryKey: ['team-members', month],
        queryFn: async () => {
            const teamResponse = await apiClient.get('/targets/team-members');
            return teamResponse.data;
        },
        enabled: open && isManagerTeamMode,
    });

    const dropdownUsers = isManagerTeamMode
        ? (teamUsers || [])
        : (pagedUsers?.pages?.flatMap((p: any) => (Array.isArray(p?.data) ? p.data : [])) || []);

    const userOptions = dropdownUsers.map((u: any) => ({
        value: u.id,
        label: `${u.firstName} ${u.lastName}${u.role ? ` (${String(u.role).replace('_', ' ')})` : ''}`,
    }));

    // Get manager's allocation info if assigning to team
    const { data: allocationInfo } = useQuery({
        queryKey: ['manager-allocation', month],
        queryFn: async () => {
            const response = await apiClient.get(`/targets/manager-allocation?month=${month}-01`);
            return response.data;
        },
        enabled: open && user?.role === 'MANAGER' && !parentTargetId,
    });

    // Reset form when dialog opens
    useEffect(() => {
        if (open) {
            setUserId('');
            setAmount('');
            setError(null);
        }
    }, [open]);

    const mutation = useMutation({
        mutationFn: async (data: any) => {
            return apiClient.post('/targets', data);
        },
        onSuccess: () => {
            toast({ title: 'Target assigned successfully' });
            setOpen(false);
            setAmount('');
            setUserId('');
            setError(null);
            queryClient.invalidateQueries({ queryKey: ['all-targets'] });
            queryClient.invalidateQueries({ queryKey: ['target-stats'] });
            queryClient.invalidateQueries({ queryKey: ['manager-allocation'] });
            onSuccess?.();
        },
        onError: (error: any) => {
            const message = getErrorMessage(error);
            setError(message);
            toast({
                title: 'Failed to assign target',
                description: message,
                variant: 'destructive',
            });
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!userId || !amount || !month) {
            toast({ title: 'Please fill all fields', variant: 'destructive' });
            return;
        }

        const amountNum = parseFloat(amount);
        
        // Validate amount against max
        if (maxAmount && amountNum > maxAmount) {
            setError(`Amount exceeds available target. Max: ${formatCurrency(maxAmount)}`);
            return;
        }

        // For managers, check against their remaining allocation
        if (allocationInfo?.hasTarget && amountNum > allocationInfo.managerTarget.remaining) {
            setError(`Amount exceeds your remaining target. Available: ${formatCurrency(allocationInfo.managerTarget.remaining)}`);
            return;
        }

        mutation.mutate({
            userId,
            amount: amountNum,
            month: `${month}-01T00:00:00.000Z`,
            parentTargetId: parentTargetId || (allocationInfo?.hasTarget ? allocationInfo.allocatedTargets?.[0]?.parentTargetId : undefined),
        });
    };

    // Determine the effective max amount
    const effectiveMaxAmount = maxAmount || allocationInfo?.managerTarget?.remaining;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <PlusCircle className="h-4 w-4" />
                    Assign Target
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                
                {allocationInfo?.hasTarget && (
                    <div className="bg-muted p-3 rounded-lg text-sm space-y-1">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Your Target:</span>
                            <span className="font-medium">{formatCurrency(allocationInfo.managerTarget.total)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Allocated:</span>
                            <span className="font-medium">{formatCurrency(allocationInfo.managerTarget.allocated)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Remaining:</span>
                            <span className="font-medium text-green-600">{formatCurrency(allocationInfo.managerTarget.remaining)}</span>
                        </div>
                    </div>
                )}

                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="user">
                            {filterRole === 'MANAGER' ? 'Manager' : filterRole === 'EMPLOYEE' ? 'Team Member' : 'User'}
                        </Label>
                        <InfiniteAutocomplete
                            value={userId}
                            onValueChange={setUserId}
                            placeholder={usersLoading || teamUsersLoading ? 'Loading...' : 'Search user'}
                            emptyMessage="No users found"
                            options={userOptions}
                            loading={usersLoading || teamUsersLoading}
                            showAllOption={false}
                            hasMore={!!hasNextPage}
                            loadingMore={isFetchingNextPage}
                            onLoadMore={() => fetchNextPage()}
                            searchValue={userSearch}
                            onSearchChange={setUserSearch}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="month">Month</Label>
                        <div className="flex items-center gap-2">
                            <Input
                                ref={monthInputRef}
                                id="month"
                                type="month"
                                value={month}
                                onChange={(e) => setMonth(e.target.value)}
                                required
                                className="flex-1"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => {
                                    const el = monthInputRef.current as any;
                                    if (!el) return;
                                    if (typeof el.showPicker === 'function') {
                                        el.showPicker();
                                        return;
                                    }
                                    monthInputRef.current?.focus();
                                    monthInputRef.current?.click();
                                }}
                            >
                                <CalendarIcon className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="amount">
                            Target Amount (₹)
                            {effectiveMaxAmount && (
                                <span className="text-muted-foreground text-xs ml-2">
                                    Max: {formatCurrency(effectiveMaxAmount)}
                                </span>
                            )}
                        </Label>
                        <Input
                            id="amount"
                            type="number"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => {
                                setAmount(e.target.value);
                                setError(null);
                            }}
                            max={effectiveMaxAmount}
                            required
                        />
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={mutation.isPending || usersLoading}>
                            {mutation.isPending ? 'Assigning...' : 'Assign Target'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
