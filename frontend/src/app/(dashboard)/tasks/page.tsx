'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
    AlertCircle,
    Sunrise,
    ListTodo
} from 'lucide-react';
import { format, isToday, isTomorrow, isPast } from 'date-fns';
import { cn } from '@/lib/utils';

export default function TasksPage() {
    const { user } = useAuth();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [typeFilter, setTypeFilter] = useState('ALL');

    const { data: activities, isLoading } = useQuery({
        queryKey: ['activities', statusFilter, typeFilter],
        queryFn: async () => {
            const response = await apiClient.get('/activities');
            return response.data;
        },
    });

    const { data: todayActivities, isLoading: todayLoading } = useQuery({
        queryKey: ['activities', 'today'],
        queryFn: async () => {
            const response = await apiClient.get('/activities/today');
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

    const filteredTodayActivities = todayActivities?.filter((activity: any) => {
        const matchesSearch = activity.title.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' ||
            (statusFilter === 'PENDING' && activity.status !== 'COMPLETED') ||
            (statusFilter === 'COMPLETED' && activity.status === 'COMPLETED');
        const matchesType = typeFilter === 'ALL' || activity.type === typeFilter;

        return matchesSearch && matchesStatus && matchesType;
    });

    const pendingCount = activities?.filter((a: any) => a.status !== 'COMPLETED').length || 0;
    const todayPendingCount = todayActivities?.filter((a: any) => a.status !== 'COMPLETED').length || 0;

    const renderTaskCard = (activity: any) => {
        const scheduledDate = new Date(activity.scheduledAt);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const scheduledDateOnly = new Date(scheduledDate);
        scheduledDateOnly.setHours(0, 0, 0, 0);

        const isOverdue = scheduledDateOnly < today && activity.status !== 'COMPLETED';
        const isDueToday = isToday(scheduledDate);
        const isDueTomorrow = isTomorrow(scheduledDate);

        return (
            <Card key={activity.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                        <div className={cn(
                            "mt-0.5 p-2.5 rounded-lg",
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
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1">
                                    <h3 className="font-semibold text-base mb-2">{activity.title}</h3>
                                    {activity.description && (
                                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                                            {activity.description}
                                        </p>
                                    )}
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Badge variant="outline" className="text-xs">
                                            {activity.type}
                                        </Badge>
                                        {activity.assignee && (
                                            <Badge variant="secondary" className="text-xs">
                                                {activity.assignee.firstName} {activity.assignee.lastName}
                                            </Badge>
                                        )}
                                        {activity.status === 'COMPLETED' && (
                                            <Badge variant="default" className="text-xs bg-emerald-600">
                                                Completed
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    <div className={cn(
                                        "text-sm font-semibold mb-1",
                                        isOverdue ? "text-destructive" :
                                            isDueToday ? "text-amber-600" :
                                                "text-muted-foreground"
                                    )}>
                                        {format(scheduledDate, 'MMM d, yyyy')}
                                    </div>
                                    {isOverdue && (
                                        <Badge variant="destructive" className="text-[10px] mt-1">
                                            Overdue
                                        </Badge>
                                    )}
                                    {isDueToday && !isOverdue && (
                                        <Badge variant="default" className="text-[10px] mt-1 bg-amber-600">
                                            Today
                                        </Badge>
                                    )}
                                    {isDueTomorrow && (
                                        <Badge variant="secondary" className="text-[10px] mt-1">
                                            Tomorrow
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    };

    return (
        <div className="space-y-6 page-enter">
            <div className="flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
                        <p className="text-muted-foreground mt-1">
                            Manage your team's tasks and activities. You have {pendingCount} pending tasks.
                        </p>
                    </div>
                    <CreateTaskDialog />
                </div>
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

            {/* Tabs for Today and All Tasks */}
            <Tabs defaultValue="today" className="space-y-4">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="today" className="flex items-center gap-2">
                        <Sunrise className="h-4 w-4" />
                        Today Tasks
                        {todayPendingCount > 0 && (
                            <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1">
                                {todayPendingCount}
                            </Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="all" className="flex items-center gap-2">
                        <ListTodo className="h-4 w-4" />
                        All Tasks
                        {pendingCount > 0 && (
                            <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1">
                                {pendingCount}
                            </Badge>
                        )}
                    </TabsTrigger>
                </TabsList>

                {/* Today Tasks Tab */}
                <TabsContent value="today" className="space-y-4">
                    {todayLoading ? (
                        <div className="flex text-center justify-center p-8">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                        </div>
                    ) : filteredTodayActivities?.length === 0 ? (
                        <div className="text-center py-12 border rounded-lg bg-muted/10">
                            <Sunrise className="h-12 w-12 mx-auto text-muted-foreground opacity-20 mb-4" />
                            <h3 className="text-lg font-medium">No tasks for today</h3>
                            <p className="text-muted-foreground">You're all caught up! No tasks scheduled for today.</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {filteredTodayActivities?.map((activity: any) => renderTaskCard(activity))}
                        </div>
                    )}
                </TabsContent>

                {/* All Tasks Tab */}
                <TabsContent value="all" className="space-y-4">
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
                            {filteredActivities?.map((activity: any) => renderTaskCard(activity))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
