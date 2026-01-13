'use client';

import { useState, useEffect } from 'react';
import { Trophy, TrendingUp, Target, Users, DollarSign, Loader2, RefreshCcw } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Avatar, Badge } from '@/components/ui';
import { Button } from '@/components/ui';
import { cn, formatCurrency } from '@/lib/utils';
import { useAuth } from '@/components/providers';
import { api } from '@/lib/api';

interface LeaderboardEntry {
    rank: number;
    id: string;
    name: string;
    team: string;
    revenue: number;
    deals: number;
}

export default function LeaderboardPage() {
    const { user } = useAuth();
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchLeaderboard = async () => {
        try {
            setLoading(true);
            const response = await api.getLeaderboard();
            setLeaderboard(response.leaderboard || []);
        } catch (error) {
            console.error('Failed to fetch leaderboard:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchLeaderboard();
        }
    }, [user]);

    const getRankStyle = (rank: number) => {
        switch (rank) {
            case 1:
                return {
                    bgLight: 'bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20',
                    border: 'border-l-4 border-l-yellow-400',
                    badge: '🥇',
                };
            case 2:
                return {
                    bgLight: 'bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-800/50 dark:to-slate-800/50',
                    border: 'border-l-4 border-l-gray-400',
                    badge: '🥈',
                };
            case 3:
                return {
                    bgLight: 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20',
                    border: 'border-l-4 border-l-amber-600',
                    badge: '🥉',
                };
            default:
                return {
                    bgLight: 'bg-white dark:bg-gray-800',
                    border: '',
                    badge: `#${rank}`,
                };
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                    <p className="text-gray-500">Loading leaderboard...</p>
                </div>
            </div>
        );
    }

    // Get top 3 for podium
    const topThree = leaderboard.slice(0, 3);
    const remaining = leaderboard.slice(3);

    // Calculate totals
    const totalRevenue = leaderboard.reduce((sum, e) => sum + e.revenue, 0);
    const totalDeals = leaderboard.reduce((sum, e) => sum + e.deals, 0);

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Trophy className="text-yellow-400" size={28} />
                        Sales Leaderboard
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        Top performers ranked by revenue
                        {user?.branchName && ` · ${user.branchName}`}
                    </p>
                </div>
                <Button variant="ghost" size="icon" onClick={fetchLeaderboard} title="Refresh">
                    <RefreshCcw size={18} />
                </Button>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4">
                <Card className="p-4 flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                        <Users size={20} className="text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Total Participants</div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{leaderboard.length}</div>
                    </div>
                </Card>
                <Card className="p-4 flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                        <DollarSign size={20} className="text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Total Revenue</div>
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(totalRevenue)}</div>
                    </div>
                </Card>
                <Card className="p-4 flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                        <Target size={20} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Total Deals</div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{totalDeals}</div>
                    </div>
                </Card>
            </div>

            {leaderboard.length === 0 ? (
                <Card className="p-12 text-center">
                    <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Closed Deals Yet</h3>
                    <p className="text-gray-500">Close some deals to see the leaderboard!</p>
                </Card>
            ) : (
                <>
                    {/* Top 3 Podium */}
                    {topThree.length > 0 && (
                        <div className="grid grid-cols-3 gap-4 mb-6">
                            {/* Second Place */}
                            <div className="pt-8">
                                {topThree[1] && (
                                    <Card className="p-6 text-center border-l-4 border-l-gray-400 bg-gradient-to-b from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-800">
                                        <div className="text-4xl mb-3">🥈</div>
                                        <Avatar name={topThree[1].name} size="lg" className="mx-auto mb-3" />
                                        <div className="font-semibold text-gray-900 dark:text-white">{topThree[1].name}</div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">{topThree[1].team}</div>
                                        <div className="text-xl font-bold text-green-600 dark:text-green-400">{formatCurrency(topThree[1].revenue)}</div>
                                        <div className="text-sm text-gray-500">{topThree[1].deals} deals</div>
                                    </Card>
                                )}
                            </div>

                            {/* First Place */}
                            {topThree[0] && (
                                <Card className="p-6 text-center border-l-4 border-l-yellow-400 bg-gradient-to-b from-yellow-50 to-white dark:from-yellow-900/20 dark:to-gray-800 transform scale-105">
                                    <div className="text-5xl mb-3">🥇</div>
                                    <Avatar name={topThree[0].name} size="xl" className="mx-auto mb-3" />
                                    <div className="font-bold text-lg text-gray-900 dark:text-white">{topThree[0].name}</div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">{topThree[0].team}</div>
                                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(topThree[0].revenue)}</div>
                                    <div className="text-sm text-gray-500">{topThree[0].deals} deals</div>
                                    <Badge variant="success" className="mt-2">Top Performer</Badge>
                                </Card>
                            )}

                            {/* Third Place */}
                            <div className="pt-12">
                                {topThree[2] && (
                                    <Card className="p-6 text-center border-l-4 border-l-amber-600 bg-gradient-to-b from-amber-50 to-white dark:from-amber-900/20 dark:to-gray-800">
                                        <div className="text-4xl mb-3">🥉</div>
                                        <Avatar name={topThree[2].name} size="lg" className="mx-auto mb-3" />
                                        <div className="font-semibold text-gray-900 dark:text-white">{topThree[2].name}</div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">{topThree[2].team}</div>
                                        <div className="text-xl font-bold text-green-600 dark:text-green-400">{formatCurrency(topThree[2].revenue)}</div>
                                        <div className="text-sm text-gray-500">{topThree[2].deals} deals</div>
                                    </Card>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Remaining Rankings */}
                    {remaining.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Other Rankings</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {remaining.map((entry) => {
                                        const style = getRankStyle(entry.rank);
                                        return (
                                            <div
                                                key={entry.id}
                                                className={cn(
                                                    'flex items-center gap-4 p-4 rounded-lg',
                                                    style.bgLight,
                                                    style.border
                                                )}
                                            >
                                                <div className="w-10 text-center font-bold text-gray-500">
                                                    {style.badge}
                                                </div>
                                                <Avatar name={entry.name} size="md" />
                                                <div className="flex-1">
                                                    <div className="font-medium text-gray-900 dark:text-white">{entry.name}</div>
                                                    <div className="text-sm text-gray-500 dark:text-gray-400">{entry.team}</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-semibold text-green-600 dark:text-green-400">
                                                        {formatCurrency(entry.revenue)}
                                                    </div>
                                                    <div className="text-sm text-gray-500">{entry.deals} deals</div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </>
            )}
        </div>
    );
}
