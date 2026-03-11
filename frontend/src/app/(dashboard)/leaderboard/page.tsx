'use client';

import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import {
    Trophy,
    Medal,
    Crown,
    TrendingUp,
    Target,
    Users,
    DollarSign,
    Star,
    Activity,
    Percent,
    Flame,
} from 'lucide-react';
import { formatCurrency, getInitials, cn, formatNumber } from '@/lib/utils';

export default function LeaderboardPage() {
    const { user } = useAuth();

    const { data: globalLeaderboard, isLoading: loadingGlobal } = useQuery({
        queryKey: ['leaderboard', 'global'],
        queryFn: async () => {
            const response = await apiClient.get('/leaderboard/global');
            return response.data;
        },
    });

    const { data: managersLeaderboard, isLoading: loadingManagers } = useQuery({
        queryKey: ['leaderboard', 'managers'],
        queryFn: async () => {
            const response = await apiClient.get('/leaderboard/managers');
            return response.data;
        },
    });

    const { data: myStats } = useQuery({
        queryKey: ['my-stats'],
        queryFn: async () => {
            const response = await apiClient.get('/leaderboard/me');
            return response.data;
        },
    });

    const LeaderboardCard = ({ entry, rank, type }: { entry: any, rank: number, type: 'employee' | 'team' }) => {
        if (!entry) return null;

        const isFirst = rank === 1;
        const isSecond = rank === 2;
        const isThird = rank === 3;

        return (
            <Card className={cn(
                "relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1",
                isFirst ? "border-amber-300 ring-2 ring-amber-200 dark:ring-amber-800/40 shadow-lg bg-gradient-to-b from-white via-amber-50/20 to-white dark:from-slate-900 dark:via-amber-950/10 dark:to-slate-900" :
                isSecond ? "border-slate-300 ring-1 ring-slate-200 dark:ring-slate-700" :
                isThird ? "border-orange-200 ring-1 ring-orange-100 dark:ring-orange-900/30" :
                "hover:border-primary/20"
            )}>
                {/* Rank Badge */}
                <div className={cn(
                    "absolute top-0 right-0 px-4 py-2 rounded-bl-xl font-bold text-white text-sm flex items-center gap-1",
                    isFirst ? "bg-gradient-to-r from-amber-500 to-yellow-500" :
                    isSecond ? "bg-gradient-to-r from-slate-400 to-gray-500" :
                    isThird ? "bg-gradient-to-r from-orange-400 to-amber-500" :
                    "bg-gradient-to-r from-slate-500 to-slate-600"
                )}>
                    {isFirst && <Crown className="w-4 h-4" />}
                    {isSecond && <Medal className="w-4 h-4" />}
                    {isThird && <Trophy className="w-4 h-4" />}
                    #{rank}
                </div>

                <CardContent className="p-6 flex flex-col items-center text-center">
                    <div className="relative mb-4">
                        <Avatar className={cn(
                            "w-20 h-20 border-4 shadow-lg",
                            isFirst ? "border-amber-300 dark:border-amber-600" :
                            isSecond ? "border-slate-300 dark:border-slate-600" :
                            isThird ? "border-orange-300 dark:border-orange-600" :
                            "border-slate-100 dark:border-slate-700"
                        )}>
                            <AvatarImage src={entry.avatar} />
                            <AvatarFallback className={cn(
                                "text-xl font-bold",
                                isFirst ? "bg-gradient-to-br from-amber-500 to-yellow-500 text-white" :
                                "bg-primary/10 text-primary"
                            )}>
                                {getInitials(entry.firstName, entry.lastName)}
                            </AvatarFallback>
                        </Avatar>
                        {isFirst && (
                            <div className="absolute -top-3 -right-3 bg-amber-100 dark:bg-amber-900/50 p-1.5 rounded-full ring-2 ring-white dark:ring-slate-900 shadow-lg">
                                <Crown className="w-5 h-5 text-amber-600 dark:text-amber-400 fill-amber-500" />
                            </div>
                        )}
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">
                        {entry.firstName} {entry.lastName}
                    </h3>

                    <p className="text-xs text-muted-foreground mb-4 uppercase tracking-wider font-medium">
                        {type === 'team' ? entry.branch?.name || 'Main Branch' : entry.role?.toLowerCase()}
                    </p>

                    <div className="w-full grid grid-cols-2 gap-2 mt-2">
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-xl">
                            <div className="flex items-center justify-center gap-1 mb-1">
                                <DollarSign className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                                <p className="text-[10px] text-emerald-700 dark:text-emerald-400 uppercase font-bold">Revenue</p>
                            </div>
                            <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400 font-mono">
                                {formatCurrency(entry.metrics?.revenueClosed || 0)}
                            </p>
                        </div>
                        
                        {type === 'employee' ? (
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl">
                                <div className="flex items-center justify-center gap-1 mb-1">
                                    <Activity className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                    <p className="text-[10px] text-blue-700 dark:text-blue-400 uppercase font-bold">Activities</p>
                                </div>
                                <p className="text-sm font-bold text-blue-700 dark:text-blue-400">
                                    {formatNumber(entry.metrics?.activitiesCompleted || 0)}
                                </p>
                            </div>
                        ) : (
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl">
                                <div className="flex items-center justify-center gap-1 mb-1">
                                    <Users className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                    <p className="text-[10px] text-blue-700 dark:text-blue-400 uppercase font-bold">Team</p>
                                </div>
                                <p className="text-sm font-bold text-blue-700 dark:text-blue-400">
                                    {entry.metrics?.teamSize || 0}
                                </p>
                            </div>
                        )}
                        
                        <div className="bg-violet-50 dark:bg-violet-900/20 p-3 rounded-xl">
                            <div className="flex items-center justify-center gap-1 mb-1">
                                <Target className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                                <p className="text-[10px] text-violet-700 dark:text-violet-400 uppercase font-bold">Converted</p>
                            </div>
                            <p className="text-sm font-bold text-violet-700 dark:text-violet-400">
                                {formatNumber(entry.metrics?.leadsConverted || 0)}
                            </p>
                        </div>
                        
                        <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-xl">
                            <div className="flex items-center justify-center gap-1 mb-1">
                                <Percent className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                                <p className="text-[10px] text-amber-700 dark:text-amber-400 uppercase font-bold">Win Rate</p>
                            </div>
                            <p className="text-sm font-bold text-amber-700 dark:text-amber-400">
                                {entry.metrics?.leadConversionRate || 0}%
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    };

    const LoadingSkeleton = () => (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
                <Card key={i} className="overflow-hidden">
                    <CardContent className="p-6 flex flex-col items-center">
                        <Skeleton className="w-20 h-20 rounded-full mb-4" />
                        <Skeleton className="h-6 w-32 mb-2" />
                        <Skeleton className="h-4 w-24 mb-4" />
                        <div className="w-full grid grid-cols-2 gap-2">
                            <Skeleton className="h-16 rounded-lg" />
                            <Skeleton className="h-16 rounded-lg" />
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
            <div className="max-w-7xl mx-auto space-y-6 page-enter px-4 sm:px-6 lg:px-8 pt-6 pb-10">
                {/* Header */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 p-6 text-white shadow-xl">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-white/20 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    
                    <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-white/20">
                                <Trophy className="h-8 w-8" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">Leaderboard</h1>
                                <p className="text-white/80 text-sm mt-1">Top performers ranked by revenue and achievements</p>
                            </div>
                        </div>

                        {myStats && (
                            <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
                                <CardContent className="p-4 flex items-center gap-4">
                                    <div className="text-center">
                                        <p className="text-xs text-white/70 uppercase font-medium">Your Rank</p>
                                        <p className="text-2xl font-bold">#{myStats.globalRank || '-'}</p>
                                    </div>
                                    <div className="h-10 w-px bg-white/20" />
                                    <div className="text-center">
                                        <p className="text-xs text-white/70 uppercase font-medium">Revenue</p>
                                        <p className="text-lg font-bold">{formatCurrency(myStats.metrics?.revenueClosed || 0)}</p>
                                    </div>
                                    <div className="h-10 w-px bg-white/20" />
                                    <div className="text-center">
                                        <p className="text-xs text-white/70 uppercase font-medium">Activities</p>
                                        <p className="text-lg font-bold">{formatNumber(myStats.metrics?.activitiesCompleted || 0)}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>

                {/* Stats Summary */}
                <TooltipProvider>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="overflow-hidden border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur">
                        <div className="h-1.5 bg-gradient-to-r from-amber-500 to-yellow-500" />
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                                    <Trophy className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Top Revenue</p>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <p className="text-lg font-bold text-slate-900 dark:text-slate-100 cursor-default">
                                                {globalLeaderboard?.[0]?.metrics?.revenueClosed 
                                                    ? formatCurrency(globalLeaderboard[0].metrics.revenueClosed)
                                                    : '-'
                                                }
                                            </p>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>₹{(globalLeaderboard?.[0]?.metrics?.revenueClosed || 0).toLocaleString('en-IN')}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="overflow-hidden border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur">
                        <div className="h-1.5 bg-gradient-to-r from-blue-500 to-cyan-500" />
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                                    <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Employees</p>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <p className="text-lg font-bold text-slate-900 dark:text-slate-100 cursor-default">
                                                {formatNumber(globalLeaderboard?.length || 0)}
                                            </p>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>{(globalLeaderboard?.length || 0).toLocaleString('en-IN')}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="overflow-hidden border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur">
                        <div className="h-1.5 bg-gradient-to-r from-emerald-500 to-green-500" />
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                                    <Target className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Converted</p>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <p className="text-lg font-bold text-slate-900 dark:text-slate-100 cursor-default">
                                                {formatNumber(globalLeaderboard?.reduce((sum: number, e: any) => sum + (e.metrics?.leadsConverted || 0), 0) || 0)}
                                            </p>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>{(globalLeaderboard?.reduce((sum: number, e: any) => sum + (e.metrics?.leadsConverted || 0), 0) || 0).toLocaleString('en-IN')}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="overflow-hidden border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur">
                        <div className="h-1.5 bg-gradient-to-r from-violet-500 to-purple-500" />
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/30">
                                    <Flame className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Activities</p>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <p className="text-lg font-bold text-slate-900 dark:text-slate-100 cursor-default">
                                                {formatNumber(globalLeaderboard?.reduce((sum: number, e: any) => sum + (e.metrics?.activitiesCompleted || 0), 0) || 0)}
                                            </p>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>{(globalLeaderboard?.reduce((sum: number, e: any) => sum + (e.metrics?.activitiesCompleted || 0), 0) || 0).toLocaleString('en-IN')}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                </TooltipProvider>

                {/* Tabs */}
                <Tabs defaultValue="employees" className="w-full">
                    <TabsList className="mb-6 bg-white dark:bg-slate-900 shadow-sm border">
                        <TabsTrigger value="employees" className="gap-2">
                            <Users className="h-4 w-4" />
                            Top Employees
                        </TabsTrigger>
                        <TabsTrigger value="teams" className="gap-2">
                            <Trophy className="h-4 w-4" />
                            Top Teams
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="employees">
                        {loadingGlobal ? (
                            <LoadingSkeleton />
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {globalLeaderboard?.slice(0, 3).map((entry: any, index: number) => (
                                    <LeaderboardCard key={entry.userId} entry={entry} rank={index + 1} type="employee" />
                                ))}
                                {(!globalLeaderboard || globalLeaderboard.length === 0) && (
                                    <div className="col-span-3 py-16 text-center">
                                        <Trophy className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                                        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">No rankings available</h3>
                                        <p className="text-muted-foreground text-sm mt-1">Start completing activities to appear on the leaderboard</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="teams">
                        {loadingManagers ? (
                            <LoadingSkeleton />
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {managersLeaderboard?.slice(0, 3).map((entry: any, index: number) => (
                                    <LeaderboardCard key={entry.userId} entry={entry} rank={index + 1} type="team" />
                                ))}
                                {(!managersLeaderboard || managersLeaderboard.length === 0) && (
                                    <div className="col-span-3 py-16 text-center">
                                        <Users className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                                        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">No team rankings available</h3>
                                        <p className="text-muted-foreground text-sm mt-1">Teams will appear here as they generate revenue</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
