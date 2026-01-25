'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreateTaskDialog } from '@/components/tasks/create-task-dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    CheckCircle2,
    Clock,
    Search,
    Filter,
    Calendar as CalendarIcon,
    AlertCircle
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function TasksPage() {
    const { user } = useAuth();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [typeFilter, setTypeFilter] = useState('ALL');

    const { data: activities, isLoading } = useQuery({
        queryKey: ['activities', statusFilter, typeFilter],
        queryFn: async () => {
            // In a real app we'd pass filters to the API
            // For now fetching all and filtering client side if API doesn't support
            const response = await apiClient.get('/activities');
            return response.data;
        },
    });

    const filteredActivities = activities?.filter((activity: any) => {
        const matchesSearch = activity.title.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' ||
            (statusFilter === 'PENDING' && activity.status !== 'COMPLETED') ||
            (statusFilter === 'COMPLETED' && activity.status === 'COMPLETED');
        const matchesType = typeFilter === 'ALL' || activity.type === typeFilter;

        return matchesSearch && matchesStatus && matchesType;
    });

    const pendingCount = activities?.filter((a: any) => a.status !== 'COMPLETED').length || 0;

    return (
        <div className="space-y-6 page-enter">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage your team's tasks and activities. You have {pendingCount} pending tasks.
                    </p>
                </div>
                <CreateTaskDialog />
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search tasks..."
                                className="pl-9"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[180px]">
                                <div className="flex items-center gap-2">
                                    <Filter className="h-4 w-4" />
                                    <span>{statusFilter === 'ALL' ? 'All Status' : statusFilter}</span>
                                </div>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All Status</SelectItem>
                                <SelectItem value="PENDING">Pending</SelectItem>
                                <SelectItem value="COMPLETED">Completed</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="All Types" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All Types</SelectItem>
                                <SelectItem value="TASK">General</SelectItem>
                                <SelectItem value="INVOICE">Invoice</SelectItem>
                                <SelectItem value="PAYMENT">Payment</SelectItem>
                                <SelectItem value="LEAD">Lead</SelectItem>
                                <SelectItem value="CALL">Call</SelectItem>
                                <SelectItem value="MEETING">Meeting</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Tasks List */}
            <div className="space-y-4">
                {isLoading ? (
                    <div className="flex text-center justify-center p-8">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    </div>
                ) : filteredActivities?.length === 0 ? (
                    <div className="text-center py-12 border rounded-lg bg-muted/10">
                        <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground opacity-20 mb-4" />
                        <h3 className="text-lg font-medium">No tasks found</h3>
                        <p className="text-muted-foreground">Try adjusting your filters or create a new task.</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {filteredActivities?.map((activity: any) => (
                            <Card key={activity.id} className="hover:shadow-md transition-shadow">
                                <CardContent className="p-4">
                                    <div className="flex items-start gap-4">
                                        <div className={cn(
                                            "mt-1 p-2 rounded-full",
                                            activity.status === 'COMPLETED' ? "bg-emerald-100 text-emerald-600" :
                                                activity.type === 'INVOICE' ? "bg-purple-100 text-purple-600" :
                                                    activity.type === 'PAYMENT' ? "bg-blue-100 text-blue-600" :
                                                        "bg-amber-100 text-amber-600"
                                        )}>
                                            {activity.status === 'COMPLETED' ? <CheckCircle2 className="h-5 w-5" /> :
                                                activity.type === 'INVOICE' ? <AlertCircle className="h-5 w-5" /> :
                                                    <Clock className="h-5 w-5" />
                                            }
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <h3 className="font-semibold truncate">{activity.title}</h3>
                                                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                                                        <Badge variant="outline" className="text-xs">
                                                            {activity.type}
                                                        </Badge>
                                                        {activity.assignee && (
                                                            <span className="flex items-center gap-1">
                                                                <span>• Assigned to:</span>
                                                                <span className="font-medium text-foreground">
                                                                    {activity.assignee.firstName} {activity.assignee.lastName}
                                                                </span>
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <div className={cn(
                                                        "text-sm font-medium",
                                                        new Date(activity.scheduledAt) < new Date() && activity.status !== 'COMPLETED' ? "text-destructive" : "text-muted-foreground"
                                                    )}>
                                                        {format(new Date(activity.scheduledAt), 'MMM d, h:mm a')}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground mt-1">
                                                        {formatDistanceToNow(new Date(activity.scheduledAt), { addSuffix: true })}
                                                    </div>
                                                </div>
                                            </div>

                                            {activity.description && (
                                                <p className="mt-2 text-sm text-muted-foreground line-clamp-1">
                                                    {activity.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
