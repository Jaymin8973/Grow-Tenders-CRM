'use client';

import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
    Trophy,
    Medal,
    Crown,
    TrendingUp,
    Target,
    CheckCircle2,
    DollarSign,
    Users,
} from 'lucide-react';
import { formatCurrency, getInitials, cn } from '@/lib/utils';

const rankIcons = [Crown, Medal, Medal];
const rankColors = ['text-amber-500', 'text-slate-400', 'text-amber-700'];
const rankBg = ['bg-amber-50', 'bg-slate-50', 'bg-amber-50/50'];

export default function LeaderboardPage() {
    const { user } = useAuth();

    const { data: leaderboard, isLoading } = useQuery({
        queryKey: ['leaderboard'],
        queryFn: async () => {
            const response = await apiClient.get('/leaderboard/global');
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

    const { data: teamLeaderboard } = useQuery({
        queryKey: ['team-leaderboard'],
        queryFn: async () => {
            const response = await apiClient.get('/leaderboard/team');
            return response.data;
        },
        enabled: user?.role === 'MANAGER',
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
            <div>
                <h1 className="text-3xl font-bold">Leaderboard</h1>
                <p className="text-muted-foreground mt-1">
                    See how you stack up against your team
                </p>
            </div>

            {/* My Stats */}
            {myStats && (
                <Card className="bg-gradient-to-r from-primary to-violet-600 text-white overflow-hidden">
                    <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-16 w-16 border-4 border-white/20">
                                    <AvatarImage src={myStats.avatar} />
                                    <AvatarFallback className="bg-white/20 text-white text-xl">
                                        {getInitials(myStats.firstName, myStats.lastName)}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="text-2xl font-bold">{myStats.firstName} {myStats.lastName}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Trophy className="h-4 w-4" />
                                        <span>Rank #{myStats.globalRank || '-'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                <div className="text-center">
                                    <p className="text-3xl font-bold">{formatCurrency(myStats.metrics?.revenueClosed || 0)}</p>
                                    <p className="text-primary-foreground/80 text-sm">Revenue</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-3xl font-bold">{myStats.metrics?.dealsWon || 0}</p>
                                    <p className="text-primary-foreground/80 text-sm">Deals Won</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-3xl font-bold">{myStats.metrics?.activitiesCompleted || 0}</p>
                                    <p className="text-primary-foreground/80 text-sm">Activities</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-3xl font-bold">{myStats.metrics?.leadConversionRate || 0}%</p>
                                    <p className="text-primary-foreground/80 text-sm">Conversion</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Global Leaderboard */}
                <Card className="card-hover">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-amber-50">
                                <Trophy className="h-5 w-5 text-amber-500" />
                            </div>
                            Global Rankings
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {leaderboard?.slice(0, 10).map((entry: any, index: number) => {
                                const isCurrentUser = entry.userId === user?.id;
                                const RankIcon = rankIcons[index] || null;

                                return (
                                    <div
                                        key={entry.userId}
                                        className={cn(
                                            "flex items-center gap-4 p-3 rounded-xl transition-colors",
                                            isCurrentUser ? "bg-primary/10 ring-2 ring-primary" : "hover:bg-muted",
                                            index < 3 && rankBg[index]
                                        )}
                                    >
                                        <div className="w-8 text-center font-bold">
                                            {RankIcon ? (
                                                <RankIcon className={cn("h-6 w-6 mx-auto", rankColors[index])} />
                                            ) : (
                                                <span className="text-muted-foreground">{entry.rank}</span>
                                            )}
                                        </div>
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={entry.avatar} />
                                            <AvatarFallback className="bg-primary/10 text-primary">
                                                {getInitials(entry.firstName, entry.lastName)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <p className={cn("font-medium truncate", isCurrentUser && "text-primary")}>
                                                {entry.firstName} {entry.lastName}
                                                {isCurrentUser && <span className="text-xs ml-2">(You)</span>}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {entry.metrics?.dealsWon || 0} deals won
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold">{formatCurrency(entry.metrics?.revenueClosed || 0)}</p>
                                        </div>
                                    </div>
                                );
                            })}
                            {(!leaderboard || leaderboard.length === 0) && (
                                <div className="py-8 text-center text-muted-foreground">
                                    <Users className="h-10 w-10 mx-auto mb-2 opacity-30" />
                                    <p>No rankings available yet</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Performance Metrics */}
                <div className="space-y-6">
                    {/* Quick Stats */}
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Card className="card-hover">
                            <CardContent className="p-5">
                                <div className="flex items-center gap-4">
                                    <div className="stat-icon bg-emerald-50">
                                        <DollarSign className="h-6 w-6 text-emerald-500" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">
                                            {formatCurrency(myStats?.metrics?.revenueClosed || 0)}
                                        </p>
                                        <p className="text-sm text-muted-foreground">Your Revenue</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="card-hover">
                            <CardContent className="p-5">
                                <div className="flex items-center gap-4">
                                    <div className="stat-icon bg-blue-50">
                                        <Target className="h-6 w-6 text-blue-500" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">
                                            {myStats?.metrics?.leadConversionRate || 0}%
                                        </p>
                                        <p className="text-sm text-muted-foreground">Conversion Rate</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="card-hover">
                            <CardContent className="p-5">
                                <div className="flex items-center gap-4">
                                    <div className="stat-icon bg-violet-50">
                                        <TrendingUp className="h-6 w-6 text-violet-500" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">{myStats?.metrics?.dealsWon || 0}</p>
                                        <p className="text-sm text-muted-foreground">Deals Won</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="card-hover">
                            <CardContent className="p-5">
                                <div className="flex items-center gap-4">
                                    <div className="stat-icon bg-cyan-50">
                                        <CheckCircle2 className="h-6 w-6 text-cyan-500" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">
                                            {myStats?.metrics?.followUpCompletionRate || 0}%
                                        </p>
                                        <p className="text-sm text-muted-foreground">Task Completion</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Team Leaderboard for Managers */}
                    {user?.role === 'MANAGER' && teamLeaderboard && teamLeaderboard.length > 0 && (
                        <Card className="card-hover">
                            <CardHeader className="pb-2">
                                <CardTitle className="flex items-center gap-2">
                                    <div className="p-2 rounded-lg bg-violet-50">
                                        <Users className="h-5 w-5 text-violet-500" />
                                    </div>
                                    Your Team
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {teamLeaderboard.map((member: any) => (
                                        <div key={member.userId} className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted">
                                            <div className="w-8 text-center font-bold text-muted-foreground">
                                                #{member.rank}
                                            </div>
                                            <Avatar className="h-10 w-10">
                                                <AvatarFallback className="bg-violet-100 text-violet-700">
                                                    {getInitials(member.firstName, member.lastName)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1">
                                                <p className="font-medium">{member.firstName} {member.lastName}</p>
                                            </div>
                                            <p className="font-bold">{formatCurrency(member.metrics?.revenueClosed || 0)}</p>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
