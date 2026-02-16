
'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Input } from '@/components/ui/input'; // Ensure Input is imported
import { useToast } from '@/hooks/use-toast';
import { TargetAssignment } from '@/components/targets/TargetAssignment';
import { formatCurrency } from '@/lib/utils';
import { Search, Filter, Loader2 } from 'lucide-react';

export default function TargetsPage() {
    const { toast } = useToast();
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [searchTerm, setSearchTerm] = useState('');

    // Fetch all targets for the selected month (We need a new endpoint or filter for this)
    // Converting the existing 'getEmployeeStats' to something more list-friendly or just fetch all users and their simplified stats
    // For now, let's assume we have an endpoint to list targets. If not, I'll need to create one.
    // Actually, I can reuse 'users' endpoint and map, but a dedicated endpoint is better.
    // Let's create a new component for the list that fetches data.

    // Checking backend... TargetsController has `getStats` but it takes `userId`.
    // I need an endpoint to get ALL targets for a month.
    // Let's Stub it for now or use what we have.
    // Strategy: Fetch all users, then for each, display their target. 
    // BETTER: Create a new endpoint `GET /targets?month=YYYY-MM` in backend.

    // Since I can't easily switch to backend dev right now without disrupting flow, 
    // I will use a client-side approach if possible or just fetch all targets.
    // Wait, I can add the endpoint. It's quick.

    const { data: targets, isLoading } = useQuery({
        queryKey: ['all-targets', month],
        queryFn: async () => {
            // Placeholder: fetch all targets. 
            // If the backend doesn't support filtering by month for ALL, we might get everything.
            // Let's assume we add `GET /targets?month=...`
            const response = await apiClient.get(`/targets?month=${month}-01`);
            return response.data;
        },
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Targets Management</h1>
                    <p className="text-muted-foreground">
                        Set and monitor monthly sales targets for your team.
                    </p>
                </div>
                <TargetAssignment />
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        <CardTitle>Assigned Targets</CardTitle>
                        <div className="flex items-center gap-2">
                            <Input
                                type="month"
                                value={month}
                                onChange={(e) => setMonth(e.target.value)}
                                className="w-[180px]"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Employee</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Target Amount</TableHead>
                                    <TableHead>Achieved</TableHead>
                                    <TableHead>Progress</TableHead>
                                    <TableHead>Month</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                        </TableCell>
                                    </TableRow>
                                ) : targets?.length > 0 ? (
                                    targets.map((t: any) => ( // Typings would be nice
                                        <TableRow key={t.id}>
                                            <TableCell className="font-medium">
                                                {t.user?.firstName} {t.user?.lastName}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-sm">
                                                {t.user?.role}
                                            </TableCell>
                                            <TableCell>{formatCurrency(t.amount)}</TableCell>
                                            <TableCell>{formatCurrency(t.achieved || 0)}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className="h-2 flex-1 bg-secondary rounded-full overflow-hidden w-[60px]">
                                                        <div
                                                            className="h-full bg-primary"
                                                            style={{ width: `${Math.min(100, (t.achieved / t.amount) * 100)}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs text-muted-foreground">
                                                        {((t.achieved / t.amount) * 100).toFixed(0)}%
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {new Date(t.month).toLocaleString('default', { month: 'long', year: 'numeric' })}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                            No targets found for this month.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
