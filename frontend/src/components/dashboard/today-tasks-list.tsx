'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api-client';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Phone, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { cn, getInitials } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

export function TodayTasksList() {
    const { user } = useAuth();
    const router = useRouter();

    const { data: leadsData, isLoading } = useQuery({
        queryKey: ['leads', 'today-tasks', user?.id],
        queryFn: async () => {
            const response = await apiClient.get(`/leads?assigneeId=${user?.id}&todayTasks=true`);
            return response.data;
        },
        enabled: !!user?.id,
    });

    const leads = leadsData?.items ?? [];

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Today's Calling Tasks</CardTitle>
                    <CardDescription>Loading your schedule...</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                </CardContent>
            </Card>
        );
    }

    if (leads.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-primary" />
                        Today's Calling Tasks
                    </CardTitle>
                    <CardDescription>You have no pending calls scheduled for today.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
                    <CheckCircle2 className="h-12 w-12 text-emerald-500 mb-2 opacity-80" />
                    <p className="font-medium text-slate-900">All caught up!</p>
                    <p className="text-sm">Great job clearing your task list.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Phone className="h-5 w-5 text-primary" />
                            Today's Calling Tasks
                        </CardTitle>
                        <CardDescription>
                            You have <span className="font-bold text-slate-900">{leads.length}</span> leads to contact today.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                {leads.map((lead: any) => {
                    const isOverdue = new Date(lead.nextFollowUp) < new Date(new Date().setHours(0, 0, 0, 0));

                    return (
                        <div
                            key={lead.id}
                            onClick={() => router.push(`/leads/${lead.id}`)}
                            className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-primary/50 hover:bg-slate-50 transition-colors cursor-pointer group"
                        >
                            <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                                        {getInitials(lead.firstName, lead.lastName)}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h4 className="font-semibold text-sm group-hover:text-primary transition-colors">
                                        {lead.firstName} {lead.lastName}
                                    </h4>
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                        {lead.mobile || lead.phone || 'No phone number'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                {isOverdue && (
                                    <Badge variant="destructive" className="flex items-center gap-1 text-[10px] uppercase">
                                        <AlertCircle className="h-3 w-3" /> Overdue
                                    </Badge>
                                )}
                            </div>
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
}
