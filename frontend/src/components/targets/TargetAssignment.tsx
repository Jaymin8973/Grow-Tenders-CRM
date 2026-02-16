
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
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
import { PlusCircle } from 'lucide-react';

export function TargetAssignment() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [open, setOpen] = useState(false);
    const [userId, setUserId] = useState('');
    const [amount, setAmount] = useState('');
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

    // Fetch Users
    const { data: users } = useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            const response = await apiClient.get('/users');
            return response.data;
        },
    });

    const mutation = useMutation({
        mutationFn: async (data: any) => {
            return apiClient.post('/targets', data);
        },
        onSuccess: () => {
            toast({ title: 'Target assigned successfully' });
            setOpen(false);
            setAmount('');
            setUserId('');
            queryClient.invalidateQueries({ queryKey: ['target-stats'] }); // In case we assigned to self
        },
        onError: (error: any) => {
            toast({
                title: 'Failed to assign target',
                description: error.response?.data?.message || 'Something went wrong',
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

        mutation.mutate({
            userId,
            amount: parseFloat(amount),
            month: `${month}-01T00:00:00.000Z`, // First day of selected month
        });
    };

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
                    <DialogTitle>Assign Monthly Target</DialogTitle>
                    <DialogDescription>
                        Set a sales target for an employee for a specific month.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="user">Employee</Label>
                        <Select value={userId} onValueChange={setUserId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Employee" />
                            </SelectTrigger>
                            <SelectContent>
                                {users?.map((user: any) => (
                                    <SelectItem key={user.id} value={user.id}>
                                        {user.firstName} {user.lastName} ({user.role})
                                    </SelectItem>
                                ))}
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
                        <Label htmlFor="amount">Target Amount (₹)</Label>
                        <Input
                            id="amount"
                            type="number"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            required
                        />
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={mutation.isPending}>
                            Assign Target
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
