'use client';

import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    BarChart3,
    TrendingUp,
    DollarSign,
    Target,
    Users,
    UserPlus,
    CheckCircle2,
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    AreaChart,
    Area,
    LineChart,
    Line,
} from 'recharts';
import { formatCurrency, cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

export default function ReportsPage() {
    const { user } = useAuth();

    const { data: salesData, isLoading } = useQuery({
        queryKey: ['sales-report'],
        queryFn: async () => {
            const response = await apiClient.get('/reports/sales-performance');
            return response.data;
        },
    });

    const { data: pipelineData } = useQuery({
        queryKey: ['pipeline-report'],
        queryFn: async () => {
            const response = await apiClient.get('/reports/pipeline');
            return response.data;
        },
    });

    const { data: leadSourceData } = useQuery({
        queryKey: ['lead-source-report'],
        queryFn: async () => {
            const response = await apiClient.get('/reports/lead-sources');
            return response.data;
        },
    });

    const { data: employeeData } = useQuery({
        queryKey: ['employee-productivity'],
        queryFn: async () => {
            const response = await apiClient.get('/reports/employee-productivity');
            return response.data;
        },
        enabled: user?.role !== 'EMPLOYEE',
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
                <h1 className="text-3xl font-bold">Reports</h1>
                <p className="text-muted-foreground mt-1">
                    Analytics and performance insights
                </p>
            </div>

            {/* Key Metrics */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="card-hover bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-white/20">
                                <DollarSign className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-white/80 text-sm">Total Revenue</p>
                                <p className="text-2xl font-bold">{formatCurrency(salesData?.totalRevenue || 0)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="card-hover bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-white/20">
                                <CheckCircle2 className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-white/80 text-sm">Deals Won</p>
                                <p className="text-2xl font-bold">{salesData?.wonDeals || 0}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="card-hover bg-gradient-to-br from-amber-500 to-amber-600 text-white">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-white/20">
                                <Target className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-white/80 text-sm">Win Rate</p>
                                <p className="text-2xl font-bold">{salesData?.winRate || 0}%</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="card-hover bg-gradient-to-br from-violet-500 to-violet-600 text-white">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-white/20">
                                <TrendingUp className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-white/80 text-sm">Avg Deal Size</p>
                                <p className="text-2xl font-bold">{formatCurrency(salesData?.avgDealSize || 0)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Monthly Revenue Trend */}
                <Card className="card-hover">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <TrendingUp className="h-5 w-5 text-primary" />
                            </div>
                            Monthly Revenue Trend
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={salesData?.monthlyRevenue || []}>
                                    <defs>
                                        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                                    <XAxis dataKey="month" className="text-xs" axisLine={false} tickLine={false} />
                                    <YAxis className="text-xs" axisLine={false} tickLine={false} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'hsl(var(--card))',
                                            border: '1px solid hsl(var(--border))',
                                            borderRadius: '12px',
                                        }}
                                        formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="revenue"
                                        stroke="#6366f1"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#revenueGradient)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Pipeline Breakdown */}
                <Card className="card-hover">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <BarChart3 className="h-5 w-5 text-primary" />
                            </div>
                            Pipeline Breakdown
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-72 flex items-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pipelineData || []}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={4}
                                        dataKey="count"
                                        nameKey="stage"
                                    >
                                        {(pipelineData || []).map((entry: any, index: number) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={COLORS[index % COLORS.length]}
                                                className="stroke-2 stroke-card"
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'hsl(var(--card))',
                                            border: '1px solid hsl(var(--border))',
                                            borderRadius: '12px',
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex flex-wrap justify-center gap-4 -mt-4">
                            {(pipelineData || []).map((entry: any, index: number) => (
                                <div key={entry.stage} className="flex items-center gap-2">
                                    <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                    />
                                    <span className="text-xs text-muted-foreground">{entry.stage}: {entry.count}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Lead Sources & Employee Productivity */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Lead Source Analysis */}
                <Card className="card-hover">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <div className="p-2 rounded-lg bg-emerald-50">
                                <UserPlus className="h-5 w-5 text-emerald-600" />
                            </div>
                            Lead Sources
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={leadSourceData || []} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                                    <XAxis type="number" className="text-xs" axisLine={false} tickLine={false} />
                                    <YAxis
                                        type="category"
                                        dataKey="source"
                                        className="text-xs"
                                        axisLine={false}
                                        tickLine={false}
                                        width={80}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'hsl(var(--card))',
                                            border: '1px solid hsl(var(--border))',
                                            borderRadius: '12px',
                                        }}
                                    />
                                    <Bar dataKey="count" fill="#22c55e" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Employee Productivity */}
                {user?.role !== 'EMPLOYEE' && (
                    <Card className="card-hover">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <div className="p-2 rounded-lg bg-violet-50">
                                    <Users className="h-5 w-5 text-violet-600" />
                                </div>
                                Top Performers
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {(employeeData || []).slice(0, 5).map((emp: any, index: number) => (
                                    <div key={emp.userId} className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted transition-colors">
                                        <div className="text-sm font-bold text-muted-foreground w-6">
                                            #{index + 1}
                                        </div>
                                        <Avatar className="h-10 w-10">
                                            <AvatarFallback className="bg-primary/10 text-primary">
                                                {getInitials(emp.firstName, emp.lastName)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">{emp.firstName} {emp.lastName}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {emp.dealsWon || 0} deals won
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold">{formatCurrency(emp.revenue || 0)}</p>
                                        </div>
                                    </div>
                                ))}
                                {(!employeeData || employeeData.length === 0) && (
                                    <div className="py-8 text-center text-muted-foreground">
                                        <Users className="h-10 w-10 mx-auto mb-2 opacity-30" />
                                        <p>No data available</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
