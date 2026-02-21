'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/auth-context';
import apiClient from '@/lib/api-client';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Users,
    UserPlus,
    CheckCircle2,
    DollarSign,
    TrendingUp,
    CalendarDays,
    AlertCircle,
    Target,
    ArrowUpRight,
    ArrowDownRight,
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
} from 'recharts';

import { TargetStatsCard } from '@/components/targets/TargetStatsCard';
import { PaymentRequestForm } from '@/components/targets/PaymentRequestForm';


const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function DashboardPage() {
    const { user } = useAuth();

    const { data: stats, isLoading } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: async () => {
            const response = await apiClient.get('/reports/dashboard');
            return response.data;
        },
    });

    const { data: salesData } = useQuery({
        queryKey: ['sales-performance'],
        queryFn: async () => {
            const response = await apiClient.get('/reports/sales-performance');
            return response.data;
        },
    });

    const { data: pipelineData } = useQuery({
        queryKey: ['pipeline-breakdown'],
        queryFn: async () => {
            const response = await apiClient.get('/reports/pipeline');
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

    const statsCards = [
        {
            title: 'Total Leads',
            value: stats?.totalLeads || 0,
            change: stats?.newLeadsThisMonth || 0,
            changeLabel: 'this month',
            trend: 'up',
            icon: UserPlus,
            gradient: 'from-blue-500 to-blue-600',
            bg: 'bg-blue-50',
            iconColor: 'text-blue-500',
        },
        {
            title: 'Customers',
            value: stats?.totalCustomers || 0,
            change: stats?.newCustomersThisMonth || 0,
            changeLabel: 'new customers',
            trend: 'up',
            icon: Users,
            gradient: 'from-emerald-500 to-emerald-600',
            bg: 'bg-emerald-50',
            iconColor: 'text-emerald-500',
        },
        {
            title: 'Pending Activities',
            value: stats?.pendingActivities || 0,
            change: stats?.activitiesToday || 0,
            changeLabel: 'due today',
            trend: 'up',
            icon: CheckCircle2,
            gradient: 'from-violet-500 to-violet-600',
            bg: 'bg-violet-50',
            iconColor: 'text-violet-500',
        },
        {
            title: 'Revenue',
            value: formatCurrency(stats?.revenueThisMonth || 0),
            change: 12,
            changeLabel: 'vs last month',
            trend: 'up',
            icon: DollarSign,
            gradient: 'from-amber-500 to-amber-600',
            bg: 'bg-amber-50',
            iconColor: 'text-amber-500',
        },
        {
            title: 'Activities Today',
            value: stats?.activitiesToday || 0,
            icon: CalendarDays,
            gradient: 'from-cyan-500 to-cyan-600',
            bg: 'bg-cyan-50',
            iconColor: 'text-cyan-500',
        },
        {
            title: 'Overdue Tasks',
            value: stats?.overdueActivities || 0,
            trend: stats?.overdueActivities > 0 ? 'down' : 'up',
            icon: AlertCircle,
            gradient: 'from-rose-500 to-rose-600',
            bg: 'bg-rose-50',
            iconColor: 'text-rose-500',
        },
    ];

    return (
        <div className="space-y-8 page-enter">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Dashboard</h1>
                    <p className="text-muted-foreground mt-1">
                        Welcome back, {user?.firstName}! Here's your sales overview.
                    </p>
                </div>
                <div className="flex gap-4 items-center">

                    <div className="text-right hidden sm:block">
                        <p className="text-sm text-muted-foreground">Today</p>
                        <p className="text-lg font-semibold">
                            {new Date().toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </p>
                    </div>
                </div>
            </div>

            {/* Target & Payments Section - Only for Employees */}
            {user?.role === 'EMPLOYEE' && (
                <div className="space-y-6">
                    <TargetStatsCard />
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <PaymentRequestForm />
                        {/* Placeholder for maybe recent requests or instruction?? For now just form and empty space or maybe match charts width */}
                        <Card className="flex items-center justify-center p-6 text-muted-foreground border-dashed">
                            <div className="text-center">
                                <p className="font-medium">Payment History & Status</p>
                                <p className="text-sm mt-1">Check your "My Payments" or "Requests" section for status updates.</p>
                                {/* Maybe a link to payments page? */}
                            </div>
                        </Card>
                    </div>
                </div>
            )}

            {/* Start Restricted Admin/Manager Sections */}
            {(user?.role === 'SUPER_ADMIN' || user?.role === 'MANAGER') && (
                <>
                    {/* Stats Cards */}
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                        {statsCards.map((stat) => {
                            const IconComponent = stat.icon;
                            return (
                                <Card key={stat.title} className="card-hover overflow-hidden">
                                    <CardContent className="p-5">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className={`stat-icon ${stat.bg}`}>
                                                <IconComponent className={`h-6 w-6 ${stat.iconColor}`} />
                                            </div>
                                            {stat.trend && (
                                                <div className={`flex items-center gap-1 text-xs font-medium ${stat.trend === 'up' ? 'text-emerald-600' : 'text-rose-600'
                                                    }`}>
                                                    {stat.trend === 'up' ? (
                                                        <ArrowUpRight className="h-3 w-3" />
                                                    ) : (
                                                        <ArrowDownRight className="h-3 w-3" />
                                                    )}
                                                    {stat.change && `+${stat.change}`}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold">{stat.value}</p>
                                            <p className="text-sm text-muted-foreground">{stat.title}</p>
                                            {stat.changeLabel && (
                                                <p className="text-xs text-muted-foreground mt-1">{stat.changeLabel}</p>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>

                    {/* Charts */}
                    <div className="grid gap-6 lg:grid-cols-2">
                        {/* Monthly Revenue Chart */}
                        <Card className="card-hover">
                            <CardHeader className="pb-2">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <div className="p-2 rounded-lg bg-primary/10">
                                        <TrendingUp className="h-5 w-5 text-primary" />
                                    </div>
                                    Monthly Revenue
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={salesData?.monthlyRevenue || []}>
                                            <defs>
                                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
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
                                                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                                                }}
                                                formatter={(value: any) => [formatCurrency(value || 0), 'Revenue']}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="revenue"
                                                stroke="#6366f1"
                                                strokeWidth={3}
                                                fillOpacity={1}
                                                fill="url(#colorRevenue)"
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Pipeline Chart */}
                        <Card className="card-hover">
                            <CardHeader className="pb-2">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <div className="p-2 rounded-lg bg-primary/10">
                                        <Target className="h-5 w-5 text-primary" />
                                    </div>
                                    Lead Pipeline
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-80 flex items-center justify-center">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={pipelineData || []}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={70}
                                                outerRadius={110}
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
                                {/* Legend */}
                                <div className="flex flex-wrap justify-center gap-4 -mt-4">
                                    {(pipelineData || []).map((entry: any, index: number) => (
                                        <div key={entry.stage} className="flex items-center gap-2">
                                            <div
                                                className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                            />
                                            <span className="text-xs text-muted-foreground">{entry.stage}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Quick Stats for Admin/Manager */}
                    {salesData && (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
                                <CardContent className="p-6">
                                    <p className="text-indigo-100 text-sm font-medium">Total Revenue</p>
                                    <p className="text-3xl font-bold mt-2">{formatCurrency(salesData.totalRevenue || 0)}</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
                                <CardContent className="p-6">
                                    <p className="text-emerald-100 text-sm font-medium">Leads Converted</p>
                                    <p className="text-3xl font-bold mt-2">{salesData.leadsConverted || 0}</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white">
                                <CardContent className="p-6">
                                    <p className="text-amber-100 text-sm font-medium">Win Rate</p>
                                    <p className="text-3xl font-bold mt-2">{salesData.winRate || 0}%</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-gradient-to-br from-rose-500 to-rose-600 text-white">
                                <CardContent className="p-6">
                                    <p className="text-rose-100 text-sm font-medium">Activities Completed</p>
                                    <p className="text-3xl font-bold mt-2">{salesData.activitiesCompleted || 0}</p>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </>
            )}
            {/* End Restricted Sections */}
        </div>
    );
}
