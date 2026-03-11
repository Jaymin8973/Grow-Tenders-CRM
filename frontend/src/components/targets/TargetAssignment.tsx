
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
    const [amount, setAmount] = useState('');
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [error, setError] = useState<string | null>(null);

    // Determine if this is Super Admin assigning to Managers
    const isSuperAdminMode = user?.role === 'SUPER_ADMIN' && !parentTargetId;

    // Fetch Users based on role
    const { data: users, isLoading: usersLoading } = useQuery({
        queryKey: ['users', filterRole],
        queryFn: async () => {
            const response = await apiClient.get('/users');
            let usersList = response.data;
            
            // Filter by role if specified
            if (filterRole) {
                usersList = usersList.filter((u: any) => u.role === filterRole);
            }
            
            // If manager assigning to team, get only team members
            if (user?.role === 'MANAGER' && filterRole === 'EMPLOYEE') {
                const teamResponse = await apiClient.get('/targets/team-members');
                usersList = teamResponse.data;
            }
            
            return usersList;
        },
        enabled: open,
    });

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
                        <Select value={userId} onValueChange={setUserId} disabled={usersLoading}>
                            <SelectTrigger>
                                <SelectValue placeholder={usersLoading ? "Loading..." : "Select user"} />
                            </SelectTrigger>
                            <SelectContent>
                                {users?.map((u: any) => (
                                    <SelectItem key={u.id} value={u.id}>
                                        {u.firstName} {u.lastName} 
                                        {u.role && ` (${u.role.replace('_', ' ')})`}
                                    </SelectItem>
                                ))}
                                {users?.length === 0 && (
                                    <div className="px-2 py-4 text-center text-muted-foreground text-sm">
                                        No users available
                                    </div>
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="month">Month</Label>
                        <Input
                            id="month"
                            type="month"
                            value={month}
                            onChange={(e) => setMonth(e.target.value)}
                            required
                        />
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
