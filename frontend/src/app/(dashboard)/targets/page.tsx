
'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { TargetAssignment } from '@/components/targets/TargetAssignment';
import { formatCurrency, cn, getInitials } from '@/lib/utils';
import { 
    Search, 
    Filter, 
    Loader2, 
    Target as TargetIcon, 
    Users, 
    TrendingUp,
    ChevronDown,
    ChevronRight,
    Edit,
    Trash2,
    MoreHorizontal,
    UserCircle,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function TargetsPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const [editTarget, setEditTarget] = useState<any>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<any>(null);

    const isSuperAdmin = user?.role === 'SUPER_ADMIN';
    const isManager = user?.role === 'MANAGER';

    // Fetch all targets for the selected month
    const { data: targets, isLoading } = useQuery({
        queryKey: ['all-targets', month],
        queryFn: async () => {
            const response = await apiClient.get(`/targets?month=${month}-01`);
            return response.data;
        },
    });

    // Fetch manager's allocation info
    const { data: managerAllocation } = useQuery({
        queryKey: ['manager-allocation', month],
        queryFn: async () => {
            const response = await apiClient.get(`/targets/manager-allocation?month=${month}-01`);
            return response.data;
        },
        enabled: isManager,
    });

    // Update target mutation
    const updateMutation = useMutation({
        mutationFn: async ({ targetId, amount }: { targetId: string; amount: number }) => {
            return apiClient.patch(`/targets/${targetId}`, { amount });
        },
        onSuccess: () => {
            toast({ title: 'Target updated successfully' });
            setEditTarget(null);
            queryClient.invalidateQueries({ queryKey: ['all-targets'] });
            queryClient.invalidateQueries({ queryKey: ['manager-allocation'] });
        },
        onError: (error: any) => {
            toast({
                title: 'Failed to update target',
                description: error.response?.data?.message || 'Something went wrong',
                variant: 'destructive',
            });
        },
    });

    // Delete target mutation
    const deleteMutation = useMutation({
        mutationFn: async (targetId: string) => {
            return apiClient.delete(`/targets/${targetId}`);
        },
        onSuccess: () => {
            toast({ title: 'Target deleted successfully' });
            setDeleteConfirm(null);
            queryClient.invalidateQueries({ queryKey: ['all-targets'] });
            queryClient.invalidateQueries({ queryKey: ['manager-allocation'] });
        },
        onError: (error: any) => {
            toast({
                title: 'Failed to delete target',
                description: error.response?.data?.message || 'Something went wrong',
                variant: 'destructive',
            });
        },
    });

    // Filter targets based on search
    const filteredTargets = targets?.filter((t: any) => {
        const name = `${t.user?.firstName} ${t.user?.lastName}`.toLowerCase();
        return name.includes(searchTerm.toLowerCase());
    }) || [];

    // Separate targets by role
    const managerTargets = filteredTargets.filter((t: any) => t.user?.role === 'MANAGER');
    const employeeTargets = filteredTargets.filter((t: any) => t.user?.role === 'EMPLOYEE');

    // Toggle row expansion
    const toggleRow = (targetId: string) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(targetId)) {
            newExpanded.delete(targetId);
        } else {
            newExpanded.add(targetId);
        }
        setExpandedRows(newExpanded);
    };

    // Get child targets for a parent
    const getChildTargets = (parentId: string) => {
        return employeeTargets.filter((t: any) => t.parentTargetId === parentId);
    };

    const getProgressColor = (percentage: number) => {
        if (percentage >= 100) return 'bg-green-500';
        if (percentage >= 75) return 'bg-emerald-500';
        if (percentage >= 50) return 'bg-blue-500';
        if (percentage >= 25) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'SUPER_ADMIN':
                return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Super Admin</Badge>;
            case 'MANAGER':
                return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Manager</Badge>;
            case 'EMPLOYEE':
                return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Employee</Badge>;
            default:
                return <Badge variant="outline">{role}</Badge>;
        }
    };

    // Target row component
    const TargetRow = ({ target, isChild = false }: { target: any; isChild?: boolean }) => {
        const childTargets = !isChild && target.user?.role === 'MANAGER' ? getChildTargets(target.id) : [];
        const hasChildren = childTargets.length > 0;
        const isExpanded = expandedRows.has(target.id);
        const percentage = target.amount > 0 ? ((target.achieved || 0) / target.amount) * 100 : 0;

        return (
            <>
                <TableRow 
                    key={target.id}
                    className={cn(
                        "hover:bg-muted/30",
                        isChild && "bg-muted/20"
                    )}
                >
                    <TableCell>
                        <div className="flex items-center gap-2">
                            {hasChildren && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={() => toggleRow(target.id)}
                                >
                                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                </Button>
                            )}
                            {!hasChildren && isChild && <div className="w-6" />}
                            <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                    {getInitials(target.user?.firstName, target.user?.lastName)}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-medium">{target.user?.firstName} {target.user?.lastName}</p>
                                <p className="text-xs text-muted-foreground">{target.user?.email}</p>
                            </div>
                        </div>
                    </TableCell>
                    <TableCell>{getRoleBadge(target.user?.role)}</TableCell>
                    <TableCell>
                        <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                                <span>{formatCurrency(target.amount)}</span>
                                {target.allocatedAmount > 0 && (
                                    <span className="text-muted-foreground text-xs">
                                        Allocated: {formatCurrency(target.allocatedAmount)}
                                    </span>
                                )}
                            </div>
                            {target.remainingAmount !== undefined && target.remainingAmount < target.amount && (
                                <div className="text-xs text-muted-foreground">
                                    Remaining: {formatCurrency(target.remainingAmount)}
                                </div>
                            )}
                        </div>
                    </TableCell>
                    <TableCell>{formatCurrency(target.achieved || 0)}</TableCell>
                    <TableCell>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden min-w-[60px]">
                                <div
                                    className={cn("h-full transition-all", getProgressColor(percentage))}
                                    style={{ width: `${Math.min(100, percentage)}%` }}
                                />
                            </div>
                            <span className="text-xs text-muted-foreground w-10 text-right">
                                {percentage.toFixed(0)}%
                            </span>
                        </div>
                    </TableCell>
                    <TableCell>
                        {new Date(target.month).toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </TableCell>
                    <TableCell className="text-right">
                        {(isSuperAdmin || (isManager && target.user?.managerId === user?.id)) && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => setEditTarget(target)}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit Target
                                    </DropdownMenuItem>
                                    {isSuperAdmin && (
                                        <>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem 
                                                className="text-destructive"
                                                onClick={() => setDeleteConfirm(target)}
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Delete Target
                                            </DropdownMenuItem>
                                        </>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </TableCell>
                </TableRow>
                {isExpanded && hasChildren && childTargets.map((child: any) => (
                    <TargetRow key={child.id} target={child} isChild />
                ))}
            </>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Targets Management</h1>
                    <p className="text-muted-foreground">
                        {isSuperAdmin 
                            ? 'Assign targets to managers who will distribute to their teams.'
                            : isManager 
                                ? 'Distribute your target among team members.'
                                : 'View your assigned targets and progress.'}
                    </p>
                </div>
                <div className="flex gap-2">
                    {isSuperAdmin && (
                        <TargetAssignment 
                            filterRole="MANAGER"
                            title="Assign Target to Manager"
                            description="Set monthly sales target for a manager."
                        />
                    )}
                    {isManager && managerAllocation?.hasTarget && (
                        <TargetAssignment 
                            filterRole="EMPLOYEE"
                            title="Assign Target to Team Member"
                            description="Distribute your target among team members."
                            parentTargetId={managerAllocation?.allocatedTargets?.[0]?.parentTargetId}
                            maxAmount={managerAllocation?.managerTarget?.remaining}
                        />
                    )}
                </div>
            </div>

            {/* Manager Allocation Summary (for managers) */}
            {isManager && managerAllocation?.hasTarget && (
                <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TargetIcon className="h-5 w-5 text-primary" />
                            Your Target Allocation
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Total Target</p>
                                <p className="text-2xl font-bold">{formatCurrency(managerAllocation.managerTarget.total)}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Allocated to Team</p>
                                <p className="text-2xl font-bold text-blue-600">{formatCurrency(managerAllocation.managerTarget.allocated)}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Remaining to Allocate</p>
                                <p className="text-2xl font-bold text-green-600">{formatCurrency(managerAllocation.managerTarget.remaining)}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Your Achievement</p>
                                <p className="text-2xl font-bold text-emerald-600">{formatCurrency(managerAllocation.managerTarget.achieved)}</p>
                            </div>
                        </div>
                        <div className="mt-4">
                            <div className="flex justify-between text-sm mb-2">
                                <span>Allocation Progress</span>
                                <span>{((managerAllocation.managerTarget.allocated / managerAllocation.managerTarget.total) * 100).toFixed(0)}%</span>
                            </div>
                            <Progress 
                                value={(managerAllocation.managerTarget.allocated / managerAllocation.managerTarget.total) * 100}
                                className="h-2"
                            />
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <TargetIcon className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Total Targets</p>
                                <p className="text-2xl font-bold">{targets?.length || 0}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-100 rounded-lg">
                                <TrendingUp className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Managers with Targets</p>
                                <p className="text-2xl font-bold">{managerTargets.length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <Users className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Employees with Targets</p>
                                <p className="text-2xl font-bold">{employeeTargets.length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        <CardTitle>Assigned Targets</CardTitle>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    placeholder="Search by name..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 w-[200px]"
                                />
                            </div>
                            <Input
                                type="month"
                                value={month}
                                onChange={(e) => setMonth(e.target.value)}
                                className="w-[150px]"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Target Amount</TableHead>
                                    <TableHead>Achieved</TableHead>
                                    <TableHead>Progress</TableHead>
                                    <TableHead>Month</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center">
                                            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                        </TableCell>
                                    </TableRow>
                                ) : managerTargets.length > 0 ? (
                                    managerTargets.map((target: any) => (
                                        <TargetRow key={target.id} target={target} />
                                    ))
                                ) : employeeTargets.length > 0 ? (
                                    employeeTargets.map((target: any) => (
                                        <TargetRow key={target.id} target={target} />
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                            No targets found for this month.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Edit Target Dialog */}
            <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Target</DialogTitle>
                        <DialogDescription>
                            Update the target amount for {editTarget?.user?.firstName} {editTarget?.user?.lastName}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-amount">Target Amount (₹)</Label>
                            <Input
                                id="edit-amount"
                                type="number"
                                value={editTarget?.amount || ''}
                                onChange={(e) => setEditTarget({ ...editTarget, amount: parseFloat(e.target.value) })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditTarget(null)}>Cancel</Button>
                        <Button 
                            onClick={() => updateMutation.mutate({ targetId: editTarget.id, amount: editTarget.amount })}
                            disabled={updateMutation.isPending}
                        >
                            {updateMutation.isPending ? 'Updating...' : 'Update Target'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Target</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete the target for {deleteConfirm?.user?.firstName} {deleteConfirm?.user?.lastName}?
                            This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
                        <Button 
                            variant="destructive"
                            onClick={() => deleteMutation.mutate(deleteConfirm.id)}
                            disabled={deleteMutation.isPending}
                        >
                            {deleteMutation.isPending ? 'Deleting...' : 'Delete Target'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
