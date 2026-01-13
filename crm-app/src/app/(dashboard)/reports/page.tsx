'use client';

import { useState, useEffect } from 'react';
import { Download, Filter, TrendingUp, Users, DollarSign, Target, Loader2 } from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardContent, Badge } from '@/components/ui';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    Legend,
} from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { useAuth } from '@/components/providers';
import { api } from '@/lib/api';

interface RevenueData {
    month: string;
    revenue: number;
    deals: number;
}

interface PipelineData {
    name: string;
    value: number;
    totalValue: number;
    color: string;
    [key: string]: string | number;
}

interface LeaderboardEntry {
    rank: number;
    id: string;
    name: string;
    team: string;
    revenue: number;
    deals: number;
}

export default function ReportsPage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
    const [pipelineData, setPipelineData] = useState<PipelineData[]>([]);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

    useEffect(() => {
        if (!user) return;

        const fetchReportData = async () => {
            setLoading(true);
            try {
                const [revenueRes, pipelineRes, leaderboardRes] = await Promise.all([
                    api.getRevenueData(),
                    api.getPipelineStats(),
                    api.getLeaderboard(),
                ]);

                setRevenueData(revenueRes.revenueData || []);
                setPipelineData(pipelineRes.pipeline || []);
                setLeaderboard(leaderboardRes.leaderboard || []);
            } catch (error) {
                console.error('Failed to fetch report data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchReportData();
    }, [user]);

    const totalRevenue = revenueData.reduce((sum, item) => sum + item.revenue, 0);
    const totalDeals = revenueData.reduce((sum, item) => sum + item.deals, 0);
    const avgDealValue = totalDeals > 0 ? totalRevenue / totalDeals : 0;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                    <p className="text-gray-500">Loading reports...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Reports & Analytics
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        Insights from your sales data
                        {user?.branchName && ` · ${user.branchName}`}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="secondary">
                        <Filter size={18} />
                        Filters
                    </Button>
                    <Button variant="secondary">
                        <Download size={18} />
                        Export
                    </Button>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-4 gap-4">
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
                        <div className="text-sm text-gray-500 dark:text-gray-400">Total Deals Closed</div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{totalDeals}</div>
                    </div>
                </Card>
                <Card className="p-4 flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                        <TrendingUp size={20} className="text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Avg Deal Value</div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(avgDealValue)}</div>
                    </div>
                </Card>
                <Card className="p-4 flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20">
                        <Users size={20} className="text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Top Performers</div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{leaderboard.length}</div>
                    </div>
                </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-2 gap-6">
                {/* Revenue Over Time */}
                <Card>
                    <CardHeader>
                        <CardTitle>Revenue Over Time</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            {revenueData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={revenueData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                                        <XAxis
                                            dataKey="month"
                                            tick={{ fill: 'var(--foreground-muted)', fontSize: 12 }}
                                        />
                                        <YAxis
                                            tick={{ fill: 'var(--foreground-muted)', fontSize: 12 }}
                                            tickFormatter={(value) => `₹${value / 1000}K`}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'var(--background-card)',
                                                borderColor: 'var(--border-color)',
                                            }}
                                            formatter={(value) => [formatCurrency(Number(value)), 'Revenue']}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="revenue"
                                            stroke="var(--primary-500)"
                                            strokeWidth={3}
                                            dot={{ fill: 'var(--primary-500)', strokeWidth: 0, r: 4 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full text-gray-500">
                                    No revenue data available
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Pipeline Distribution */}
                <Card>
                    <CardHeader>
                        <CardTitle>Pipeline Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            {pipelineData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pipelineData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={100}
                                            paddingAngle={2}
                                            dataKey="value"
                                        >
                                            {pipelineData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'var(--background-card)',
                                                borderColor: 'var(--border-color)',
                                            }}
                                        />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full text-gray-500">
                                    No pipeline data available
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Team Performance */}
            <Card>
                <CardHeader>
                    <CardTitle>Team Performance</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px]">
                        {leaderboard.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={leaderboard.slice(0, 8)} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                                    <XAxis
                                        type="number"
                                        tick={{ fill: 'var(--foreground-muted)', fontSize: 12 }}
                                        tickFormatter={(value) => `₹${value / 1000}K`}
                                    />
                                    <YAxis
                                        type="category"
                                        dataKey="name"
                                        tick={{ fill: 'var(--foreground-muted)', fontSize: 12 }}
                                        width={120}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'var(--background-card)',
                                            borderColor: 'var(--border-color)',
                                        }}
                                        formatter={(value) => [formatCurrency(Number(value)), 'Revenue']}
                                    />
                                    <Bar dataKey="revenue" fill="var(--primary-500)" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-500">
                                No team performance data available
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
