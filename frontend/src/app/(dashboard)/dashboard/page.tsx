'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/auth-context';
import apiClient from '@/lib/api-client';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
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
    MessageSquare,
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    AreaChart,
    Area,
} from 'recharts';

import { TargetStatsCard } from '@/components/targets/TargetStatsCard';
import { PaymentRequestForm } from '@/components/targets/PaymentRequestForm';
import { TodayTasksList } from '@/components/dashboard/today-tasks-list';
import { SubmitEodReportDialog } from '@/components/daily-reports/submit-eod-report-dialog';


const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const PIPELINE_COLORS: Record<string, string> = {
    WARM_LEAD: '#3b82f6',
    HOT_LEAD: '#22c55e',
    WEBSITE_LEAD: '#f97316',
    COLD_LEAD: '#ef4444',
    CLOSED_LEAD: '#000000',
    PROPOSAL_LEAD: '#8b5cf6',
};

export default function DashboardPage() {
    const { user } = useAuth();

    const { data: inquiryStats } = useQuery({
        queryKey: ['inquiries', 'assigned-count'],
        queryFn: async () => {
            const res = await apiClient.get('/inquiries?page=1&pageSize=1');
            return res.data;
        },
        enabled: user?.role === 'EMPLOYEE',
    });

    const { data: stats, isLoading } = useQuery({
        queryKey: ['dashboard-analytics'],
        queryFn: async () => {
            const response = await apiClient.get('/reports/dashboard');
            return response.data;
        },
    });

    const { data: managerAllocation, isLoading: managerAllocationLoading } = useQuery({
        queryKey: ['manager-allocation-dashboard'],
        queryFn: async () => {
            const month = new Date();
            const monthParam = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}-01`;
            const response = await apiClient.get(`/targets/manager-allocation?month=${monthParam}`);
            return response.data;
        },
        enabled: user?.role === 'MANAGER',
    });

    const salesData = stats?.monthlyRevenue
        ? {
            totalRevenue: 0,
            leadsConverted: 0,
            winRate: 0,
            activitiesCompleted: 0,
            monthlyRevenue: stats.monthlyRevenue,
        }
        : undefined;

    const pipelineData: Array<{ stage: string; count: number; color: string }> = stats?.leadsByStatus
        ? Object.entries(stats.leadsByStatus)
            .map(([stage, count]) => ({
                stage,
                count: Number(count) || 0,
                color: PIPELINE_COLORS[stage] || COLORS[0],
            }))
            .filter((x) => x.count > 0)
        : [];

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
            gradient: 'from-slate-600 to-slate-700',
            bg: 'bg-slate-50',
            iconColor: 'text-slate-600',
        },
        {
            title: 'Cold Leads',
            value: stats?.coldLeads || 0,
            icon: Users,
            trend: 'up',
            gradient: 'from-red-500 to-red-600',
            bg: 'bg-red-50',
            iconColor: 'text-red-600',
        },
        {
            title: 'Hot Leads',
            value: stats?.hotLeads || 0,
            icon: CheckCircle2,
            trend: 'up',
            gradient: 'from-emerald-500 to-emerald-600',
            bg: 'bg-emerald-50',
            iconColor: 'text-emerald-600',
        },
        {
            title: 'Warm Leads',
            value: stats?.warmLeads || 0,
            trend: 'up',
            icon: DollarSign,
            gradient: 'from-blue-500 to-blue-600',
            bg: 'bg-blue-50',
            iconColor: 'text-blue-600',
        },
        {
            title: 'Assigned Leads',
            value: stats?.assignedLeads || 0,
            icon: CalendarDays,
            gradient: 'from-cyan-500 to-cyan-600',
            bg: 'bg-cyan-50',
            iconColor: 'text-cyan-500',
        },
        {
            title: 'Unassigned Leads',
            value: stats?.unassignedLeads || 0,
            trend: (stats?.unassignedLeads || 0) > 0 ? 'down' : 'up',
            icon: AlertCircle,
            gradient: 'from-rose-500 to-rose-600',
            bg: 'bg-rose-50',
            iconColor: 'text-rose-500',
        },
    ];

    const isSuperAdmin = user?.role === 'SUPER_ADMIN';
    const isManager = user?.role === 'MANAGER';

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
                    {user?.role === 'EMPLOYEE' && (
                        <SubmitEodReportDialog />
                    )}
                </div>
            </div>

            {/* Target & Payments Section - Only for Employees */}
            {user?.role === 'EMPLOYEE' && (
                <div className="space-y-6">
                    <TargetStatsCard />
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <PaymentRequestForm />
                        <TodayTasksList />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="card-hover cursor-pointer" onClick={() => (window.location.href = '/inquiries')}>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <MessageSquare className="h-5 w-5 text-primary" />
                                    Assigned Inquiries
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-bold">{inquiryStats?.total || 0}</p>
                                <p className="text-xs text-muted-foreground mt-1">Inquiries assigned to you</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}

            {/* Manager Dashboard */}
            {isManager && (
                <div className="space-y-6">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <Card className="overflow-hidden border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur">
                            <div className="h-1.5 bg-gradient-to-r from-indigo-500 to-violet-500" />
                            <CardContent className="p-4">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Your Target</p>
                                <p className="text-2xl font-bold mt-1">
                                    {managerAllocation?.hasTarget ? formatCurrency(managerAllocation?.managerTarget?.total || 0) : '-'}
                                </p>
                                {!managerAllocationLoading && managerAllocation?.hasTarget === false && (
                                    <p className="text-xs text-muted-foreground mt-1">No target assigned for this month</p>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="overflow-hidden border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur">
                            <div className="h-1.5 bg-gradient-to-r from-sky-500 to-cyan-500" />
                            <CardContent className="p-4">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Allocated to Team</p>
                                <p className="text-2xl font-bold mt-1">
                                    {managerAllocation?.hasTarget ? formatCurrency(managerAllocation?.managerTarget?.allocated || 0) : '-'}
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="overflow-hidden border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur">
                            <div className="h-1.5 bg-gradient-to-r from-emerald-500 to-green-500" />
                            <CardContent className="p-4">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Remaining</p>
                                <p className="text-2xl font-bold mt-1">
                                    {managerAllocation?.hasTarget ? formatCurrency(managerAllocation?.managerTarget?.remaining || 0) : '-'}
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="overflow-hidden border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur">
                            <div className="h-1.5 bg-gradient-to-r from-amber-500 to-orange-500" />
                            <CardContent className="p-4">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Your Achievement</p>
                                <p className="text-2xl font-bold mt-1">
                                    {managerAllocation?.hasTarget ? formatCurrency(managerAllocation?.managerTarget?.achieved || 0) : '-'}
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
                        <Card className="card-hover">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg">Team Follow-ups Today</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-bold">{stats?.followUpsToday || 0}</p>
                                <p className="text-xs text-muted-foreground mt-1">Across your team</p>
                            </CardContent>
                        </Card>
                        <Card className="card-hover">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg">Overdue Follow-ups</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-3xl font-bold">{stats?.overdueFollowUps || 0}</p>
                                <p className="text-xs text-muted-foreground mt-1">Needs attention</p>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="card-hover">
                        <CardHeader>
                            <CardTitle className="text-lg">Employee-wise Targets</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {!managerAllocationLoading && managerAllocation?.hasTarget && managerAllocation?.teamMembers?.length > 0 ? (
                                <div className="space-y-3">
                                    {managerAllocation.teamMembers.map((m: any) => (
                                        <div key={m.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border p-3 bg-white/60 dark:bg-slate-900/60">
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold">
                                                    {m.firstName?.[0]}{m.lastName?.[0]}
                                                </div>
                                                <div>
                                                    <p className="font-medium">{m.firstName} {m.lastName}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Target: {formatCurrency(m.target || 0)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-6">
                                                <div className="text-right">
                                                    <p className="text-xs text-muted-foreground">Achieved</p>
                                                    <p className="font-semibold">{formatCurrency(m.achieved || 0)}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs text-muted-foreground">Progress</p>
                                                    <p className="font-semibold">{Number(m.percentage || 0).toFixed(0)}%</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">No team target data available for this month.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Start Restricted Admin/Manager Sections */}
            {isSuperAdmin && (
                <>
                    {/* Stats Cards */}
                    <TooltipProvider>
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
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <p className="text-2xl font-bold cursor-default">{formatNumber(stat.value)}</p>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>{stat.value.toLocaleString('en-IN')}</p>
                                                </TooltipContent>
                                            </Tooltip>
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
                    </TooltipProvider>

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
                                            <RechartsTooltip
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
                                                        fill={entry.color || COLORS[index % COLORS.length]}
                                                        className="stroke-2 stroke-card"
                                                    />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip
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
                                                style={{ backgroundColor: entry.color || COLORS[index % COLORS.length] }}
                                            />
                                            <span className="text-xs text-muted-foreground">{entry.stage}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Quick Stats for Admin/Manager */}
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <Card className="bg-gradient-to-br from-slate-600 to-slate-700 text-white">
                            <CardContent className="p-6">
                                <p className="text-slate-100 text-sm font-medium">New Leads This Month</p>
                                <p className="text-3xl font-bold mt-2">{stats?.newLeadsThisMonth || 0}</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-br from-cyan-500 to-cyan-600 text-white">
                            <CardContent className="p-6">
                                <p className="text-cyan-100 text-sm font-medium">Assigned vs Unassigned</p>
                                <p className="text-3xl font-bold mt-2">
                                    {(stats?.assignedLeads || 0)} / {(stats?.unassignedLeads || 0)}
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
                            <CardContent className="p-6">
                                <p className="text-indigo-100 text-sm font-medium">Follow-ups Today</p>
                                <p className="text-3xl font-bold mt-2">{stats?.followUpsToday || 0}</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-br from-rose-500 to-rose-600 text-white">
                            <CardContent className="p-6">
                                <p className="text-rose-100 text-sm font-medium">Overdue Follow-ups</p>
                                <p className="text-3xl font-bold mt-2">{stats?.overdueFollowUps || 0}</p>
                            </CardContent>
                        </Card>
                    </div>
                </>
            )}
            {/* End Restricted Sections */}
        </div>
    );
}
