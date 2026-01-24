'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    Plus,
    CalendarDays,
    Clock,
    Phone,
    Users,
    Mail,
    FileText,
    CheckCircle2,
    AlertCircle,
    Calendar,
} from 'lucide-react';
import { cn, getInitials } from '@/lib/utils';

const typeConfig: Record<string, { label: string; icon: any; color: string; bg: string }> = {
    CALL: { label: 'Call', icon: Phone, color: 'text-blue-600', bg: 'bg-blue-50' },
    MEETING: { label: 'Meeting', icon: Users, color: 'text-violet-600', bg: 'bg-violet-50' },
    EMAIL: { label: 'Email', icon: Mail, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    TASK: { label: 'Task', icon: FileText, color: 'text-amber-600', bg: 'bg-amber-50' },
    FOLLOW_UP: { label: 'Follow Up', icon: Clock, color: 'text-cyan-600', bg: 'bg-cyan-50' },
};

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    SCHEDULED: { label: 'Scheduled', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
    COMPLETED: { label: 'Completed', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
    CANCELLED: { label: 'Cancelled', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
    OVERDUE: { label: 'Overdue', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
};

export default function ActivitiesPage() {
    const { user } = useAuth();
    const [filter, setFilter] = useState<'all' | 'today' | 'overdue'>('all');

    const { data: activities, isLoading } = useQuery({
        queryKey: ['activities', filter],
        queryFn: async () => {
            let endpoint = '/activities';
            if (filter === 'today') endpoint = '/activities/today';
            if (filter === 'overdue') endpoint = '/activities/overdue';
            const response = await apiClient.get(endpoint);
            return response.data;
        },
    });

    const { data: stats } = useQuery({
        queryKey: ['activity-stats'],
        queryFn: async () => {
            const response = await apiClient.get('/activities/stats');
            return response.data;
        },
    });

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="space-y-6 page-enter">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Activities</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage your tasks, calls, and meetings
                    </p>
                </div>
                <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Activity
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="card-hover">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-4">
                            <div className="stat-icon bg-blue-50">
                                <CalendarDays className="h-6 w-6 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats?.total || activities?.length || 0}</p>
                                <p className="text-sm text-muted-foreground">Total Activities</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="card-hover">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-4">
                            <div className="stat-icon bg-cyan-50">
                                <Clock className="h-6 w-6 text-cyan-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats?.today || 0}</p>
                                <p className="text-sm text-muted-foreground">Today</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="card-hover">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-4">
                            <div className="stat-icon bg-emerald-50">
                                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats?.completed || 0}</p>
                                <p className="text-sm text-muted-foreground">Completed</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="card-hover">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-4">
                            <div className="stat-icon bg-amber-50">
                                <AlertCircle className="h-6 w-6 text-amber-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats?.overdue || 0}</p>
                                <p className="text-sm text-muted-foreground">Overdue</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filter Tabs */}
            <Card>
                <CardContent className="p-2">
                    <div className="flex gap-1">
                        <Button
                            variant={filter === 'all' ? 'secondary' : 'ghost'}
                            onClick={() => setFilter('all')}
                            className="flex-1 sm:flex-none"
                        >
                            All Activities
                        </Button>
                        <Button
                            variant={filter === 'today' ? 'secondary' : 'ghost'}
                            onClick={() => setFilter('today')}
                            className="flex-1 sm:flex-none gap-2"
                        >
                            <Calendar className="h-4 w-4" />
                            Today
                        </Button>
                        <Button
                            variant={filter === 'overdue' ? 'secondary' : 'ghost'}
                            onClick={() => setFilter('overdue')}
                            className="flex-1 sm:flex-none gap-2 text-amber-600"
                        >
                            <AlertCircle className="h-4 w-4" />
                            Overdue
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Activities List */}
            <div className="space-y-3">
                {activities?.map((activity: any) => {
                    const type = typeConfig[activity.type] || typeConfig.TASK;
                    const status = statusConfig[activity.status] || statusConfig.SCHEDULED;
                    const TypeIcon = type.icon;
                    const isCompleted = activity.status === 'COMPLETED';
                    const isOverdue = activity.status === 'OVERDUE' ||
                        (activity.status === 'SCHEDULED' && new Date(activity.scheduledAt) < new Date());

                    return (
                        <Card
                            key={activity.id}
                            className={cn(
                                "card-hover transition-all",
                                isCompleted && "opacity-60",
                                isOverdue && !isCompleted && "border-amber-300"
                            )}
                        >
                            <CardContent className="p-4">
                                <div className="flex items-start gap-4">
                                    {/* Icon */}
                                    <div className={cn("stat-icon shrink-0", type.bg)}>
                                        <TypeIcon className={cn("h-5 w-5", type.color)} />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <h3 className={cn(
                                                    "font-medium",
                                                    isCompleted && "line-through text-muted-foreground"
                                                )}>
                                                    {activity.title}
                                                </h3>
                                                {activity.description && (
                                                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                                        {activity.description}
                                                    </p>
                                                )}
                                            </div>
                                            <Badge variant="outline" className={cn(status.bg, status.color, 'border shrink-0')}>
                                                {status.label}
                                            </Badge>
                                        </div>

                                        {/* Meta */}
                                        <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <Clock className="h-4 w-4" />
                                                {new Date(activity.scheduledAt).toLocaleDateString('en-US', {
                                                    weekday: 'short',
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: 'numeric',
                                                    minute: '2-digit'
                                                })}
                                            </div>
                                            {activity.assignee && (
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="h-5 w-5">
                                                        <AvatarFallback className="text-xs">
                                                            {getInitials(activity.assignee.firstName, activity.assignee.lastName)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span>{activity.assignee.firstName}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action */}
                                    {!isCompleted && (
                                        <Button size="sm" variant="outline" className="shrink-0">
                                            Complete
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}

                {(!activities || activities.length === 0) && (
                    <Card>
                        <CardContent className="py-12">
                            <div className="flex flex-col items-center justify-center text-muted-foreground">
                                <CalendarDays className="h-12 w-12 mb-4 opacity-30" />
                                <p className="font-medium">No activities found</p>
                                <p className="text-sm mt-1">
                                    {filter === 'today'
                                        ? 'No activities scheduled for today'
                                        : filter === 'overdue'
                                            ? 'Great! No overdue activities'
                                            : 'Create your first activity to get started'
                                    }
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
