'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Bell,
    Check,
    CheckCheck,
    UserPlus,
    DollarSign,
    CalendarCheck,
    FileText,
    AlertTriangle,

    X,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';

const iconMap: Record<string, any> = {
    LEAD_ASSIGNED: UserPlus,

    ACTIVITY_REMINDER: CalendarCheck,
    INVOICE_CREATED: FileText,
    INVOICE_PAID: DollarSign,
    FOLLOW_UP_OVERDUE: AlertTriangle,
};

const bgMap: Record<string, string> = {
    LEAD_ASSIGNED: 'bg-blue-100 text-blue-600',

    ACTIVITY_REMINDER: 'bg-amber-100 text-amber-600',
    INVOICE_CREATED: 'bg-violet-100 text-violet-600',
    INVOICE_PAID: 'bg-green-100 text-green-600',
    FOLLOW_UP_OVERDUE: 'bg-red-100 text-red-600',
};

export function NotificationCenter() {
    const [open, setOpen] = useState(false);
    const queryClient = useQueryClient();
    const { isAuthenticated } = useAuth();
    const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('accessToken');
    const isEnabled = isAuthenticated && hasToken;

    // Fetch notifications
    const { data: notifications } = useQuery({
        queryKey: ['notifications'],
        queryFn: async () => {
            const response = await apiClient.get('/notifications');
            return response.data;
        },
        enabled: isEnabled,
        refetchInterval: isEnabled ? 30000 : false, // Refetch every 30 seconds
    });

    // Fetch unread count
    const { data: unreadData } = useQuery({
        queryKey: ['notifications-count'],
        queryFn: async () => {
            const response = await apiClient.get('/notifications/unread-count');
            return response.data;
        },
        enabled: isEnabled,
        refetchInterval: isEnabled ? 30000 : false,
    });

    const unreadCount = typeof unreadData === 'number' ? unreadData : unreadData?.count || 0;

    // Mark as read mutation
    const markAsReadMutation = useMutation({
        mutationFn: async (id: string) => {
            return apiClient.patch(`/notifications/${id}/read`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['notifications-count'] });
        },
    });

    // Mark all as read mutation
    const markAllAsReadMutation = useMutation({
        mutationFn: async () => {
            return apiClient.patch('/notifications/read-all');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['notifications-count'] });
        },
    });

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge
                            className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-red-500 hover:bg-red-500 text-white text-[10px]"
                        >
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between p-4 border-b">
                    <h4 className="font-semibold">Notifications</h4>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs gap-1"
                            onClick={() => markAllAsReadMutation.mutate()}
                        >
                            <CheckCheck className="h-3 w-3" />
                            Mark all read
                        </Button>
                    )}
                </div>
                <ScrollArea className="h-80">
                    {notifications?.length > 0 ? (
                        <div className="divide-y">
                            {notifications.map((notification: any) => {
                                const Icon = iconMap[notification.type] || Bell;
                                const iconBg = bgMap[notification.type] || 'bg-gray-100 text-gray-600';

                                return (
                                    <div
                                        key={notification.id}
                                        className={cn(
                                            "p-4 hover:bg-muted transition-colors cursor-pointer",
                                            !notification.read && "bg-blue-50/50"
                                        )}
                                        onClick={() => {
                                            if (!notification.read) {
                                                markAsReadMutation.mutate(notification.id);
                                            }
                                        }}
                                    >
                                        <div className="flex gap-3">
                                            <div className={cn("p-2 rounded-full h-fit", iconBg)}>
                                                <Icon className="h-4 w-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={cn(
                                                    "text-sm",
                                                    !notification.read && "font-medium"
                                                )}>
                                                    {notification.title}
                                                </p>
                                                <p className="text-xs text-muted-foreground line-clamp-2">
                                                    {notification.message}
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                                </p>
                                            </div>
                                            {!notification.read && (
                                                <div className="h-2 w-2 rounded-full bg-blue-500 mt-2" />
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center p-8">
                            <Bell className="h-10 w-10 text-muted-foreground/30 mb-2" />
                            <p className="text-sm text-muted-foreground">No notifications yet</p>
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}
