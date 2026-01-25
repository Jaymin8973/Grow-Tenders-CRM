'use client';

import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Trophy,
    Medal,
    Crown,
    TrendingUp,
    Target,
    Users,
    Briefcase,
    DollarSign,
    Star
} from 'lucide-react';
import { formatCurrency, getInitials, cn } from '@/lib/utils';

export default function LeaderboardPage() {
    const { user } = useAuth();

    const { data: globalLeaderboard } = useQuery({
        queryKey: ['leaderboard', 'global'],
        queryFn: async () => {
            const response = await apiClient.get('/leaderboard/global');
            return response.data;
        },
    });

    const { data: managersLeaderboard } = useQuery({
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
                "relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1",
                isFirst ? "border-amber-200 ring-2 ring-amber-100 dark:ring-amber-900/40 shadow-md bg-gradient-to-b from-white to-amber-50/30" : "hover:border-primary/20"
            )}>
                {/* Rank Badge */}
                <div className={cn(
                    "absolute top-0 right-0 px-4 py-2 rounded-bl-xl font-bold text-white text-sm",
                    isFirst ? "bg-amber-500" : isSecond ? "bg-slate-400" : "bg-orange-400"
                )}>
                    #{rank}
                </div>

                <CardContent className="p-6 flex flex-col items-center text-center">
                    <div className="relative mb-4">
                        <Avatar className={cn(
                            "w-20 h-20 border-4",
                            isFirst ? "border-amber-100" : "border-slate-100"
                        )}>
                            <AvatarImage src={entry.avatar} />
                            <AvatarFallback className="bg-primary/5 text-primary text-xl font-bold">
                                {getInitials(entry.firstName, entry.lastName)}
                            </AvatarFallback>
                        </Avatar>
                        {isFirst && (
                            <div className="absolute -top-3 -right-3 bg-amber-100 p-1.5 rounded-full ring-2 ring-white">
                                <Crown className="w-4 h-4 text-amber-600 fill-amber-600" />
                            </div>
                        )}
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">
                        {entry.firstName} {entry.lastName}
                    </h3>

                    <p className="text-xs text-muted-foreground mb-4 uppercase tracking-wider font-medium">
                        {type === 'team' ? entry.branch?.name || 'Main Branch' : entry.role.toLowerCase()}
                    </p>

                    <div className="w-full grid grid-cols-2 gap-2 mt-2">
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg">
                            <p className="text-[10px] text-muted-foreground uppercase font-bold">Revenue</p>
                            <p className="text-sm font-bold text-emerald-600 font-mono">
                                {formatCurrency(entry.metrics?.revenueClosed || 0)}
                            </p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg">
                            {type === 'employee' ? (
                                <>
                                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Deals</p>
                                    <p className="text-sm font-bold text-blue-600">
                                        {entry.metrics?.dealsWon || 0}
                                    </p>
                                </>
                            ) : (
                                <>
                                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Team</p>
                                    <p className="text-sm font-bold text-blue-600">
                                        {entry.metrics?.teamSize || 0}
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    };

    return (
        <div className="space-y-8 page-enter max-w-6xl mx-auto pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Leaderboard</h1>
                    <p className="text-muted-foreground">Top performers of the month.</p>
                </div>

                {myStats && (
                    <div className="flex items-center gap-4 bg-white dark:bg-slate-950 border px-4 py-2 rounded-full shadow-sm">
                        <span className="text-sm font-medium text-muted-foreground">My Rank:</span>
                        <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="font-bold">#{myStats.globalRank || '-'}</Badge>
                            <span className="text-sm font-bold text-emerald-600">
                                {formatCurrency(myStats.metrics?.revenueClosed || 0)}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            <Tabs defaultValue="employees" className="w-full">
                <TabsList className="mb-6">
                    <TabsTrigger value="employees">Top Employees</TabsTrigger>
                    <TabsTrigger value="teams">Top Teams</TabsTrigger>
                </TabsList>

                <TabsContent value="employees">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {globalLeaderboard?.slice(0, 3).map((entry: any, index: number) => (
                            <LeaderboardCard key={entry.userId} entry={entry} rank={index + 1} type="employee" />
                        ))}
                        {(!globalLeaderboard || globalLeaderboard.length === 0) && (
                            <div className="col-span-3 py-12 text-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
                                No rankings available yet.
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="teams">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {managersLeaderboard?.slice(0, 3).map((entry: any, index: number) => (
                            <LeaderboardCard key={entry.userId} entry={entry} rank={index + 1} type="team" />
                        ))}
                        {(!managersLeaderboard || managersLeaderboard.length === 0) && (
                            <div className="col-span-3 py-12 text-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
                                No team rankings available yet.
                            </div>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
