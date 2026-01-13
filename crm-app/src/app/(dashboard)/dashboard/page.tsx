'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers';
import { StatCard, Card, CardHeader, CardTitle, CardContent, Badge, Avatar } from '@/components/ui';
import {
    Users,
    Briefcase,
    DollarSign,
    CalendarCheck,
    TrendingUp,
    ArrowUpRight,
    Activity,
    Phone,
    Mail,
    Video,
    CheckCircle,
    Loader2,
} from 'lucide-react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from 'recharts';
import { cn, formatRelativeTime } from '@/lib/utils';
import { api } from '@/lib/api';

interface DashboardStats {
    leads: { value: number; change: number; label: string };
    deals: { value: number; change: number; label: string };
    revenue: { value: number; change: number; label: string };
    followUps: { value: number; change: number; label: string };
}

interface LeaderboardEntry {
    rank: number;
    id: string;
    name: string;
    team: string;
    revenue: number;
    deals: number;
}

interface ActivityItem {
    id: string;
    type: string;
    message: string;
    time: string;
    entityType: string;
}

interface TaskItem {
    id: string;
    title: string;
    time: string;
    type: string;
    completed: boolean;
    priority: string;
}

interface PipelineItem {
    name: string;
    value: number;
    totalValue: number;
    color: string;
    [key: string]: string | number;
}

interface RevenueDataItem {
    month: string;
    revenue: number;
    deals: number;
}

const typeIcons: Record<string, React.ElementType> = {
    lead_created: Users,
    lead_assigned: Users,
    deal_created: Briefcase,
    deal_closed: DollarSign,
    followup_completed: CalendarCheck,
    customer_added: Users,
    note_added: Activity,
};

export default function DashboardPage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [tasks, setTasks] = useState<TaskItem[]>([]);
    const [pipelineData, setPipelineData] = useState<PipelineItem[]>([]);
    const [revenueData, setRevenueData] = useState<RevenueDataItem[]>([]);

    useEffect(() => {
        if (!user) return;

        const fetchDashboardData = async () => {
            setLoading(true);
            try {
                const [statsRes, leaderboardRes, activityRes, tasksRes, pipelineRes, revenueRes] = await Promise.all([
                    api.getDashboardStats(),
                    api.getLeaderboard(),
                    api.getRecentActivity(),
                    api.getTodaysTasks(),
                    api.getPipelineStats(),
                    api.getRevenueData(),
                ]);

                setStats(statsRes.stats);
                setLeaderboard(leaderboardRes.leaderboard || []);
                setActivities(activityRes.activities || []);
                setTasks(tasksRes.tasks || []);
                setPipelineData(pipelineRes.pipeline || []);
                setRevenueData(revenueRes.revenueData || []);
            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [user]);

    if (!user) return null;

    const greeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                    <p className="text-gray-500">Loading dashboard...</p>
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
                        {greeting()}, {user.firstName}!
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        {user.role === 'super_admin'
                            ? 'Here\'s your organization overview'
                            : user.role === 'manager'
                                ? `Here's your team performance - ${user.branchName}`
                                : 'Here\'s your sales summary'}
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date().toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                        })}
                    </p>
                </div>
            </div>

            {/* KPI Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <StatCard
                    label={stats?.leads.label || 'Total Leads'}
                    value={stats?.leads.value || 0}
                    change={stats?.leads.change || 0}
                    icon={<Users size={24} />}
                    iconBg="var(--info-50)"
                />
                <StatCard
                    label={stats?.deals.label || 'Active Deals'}
                    value={stats?.deals.value || 0}
                    change={stats?.deals.change || 0}
                    icon={<Briefcase size={24} />}
                    iconBg="var(--warning-50)"
                />
                <StatCard
                    label={stats?.revenue.label || 'Total Revenue'}
                    value={stats?.revenue.value || 0}
                    change={stats?.revenue.change || 0}
                    format="currency"
                    icon={<DollarSign size={24} />}
                    iconBg="var(--success-50)"
                />
                <StatCard
                    label={stats?.followUps.label || 'Follow-ups'}
                    value={stats?.followUps.value || 0}
                    change={stats?.followUps.change || 0}
                    icon={<CalendarCheck size={24} />}
                    iconBg="var(--error-50)"
                />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Revenue Chart */}
                <Card className="col-span-1 lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Revenue Overview</CardTitle>
                        {revenueData.length > 0 && (
                            <div className="flex items-center gap-2">
                                <Badge variant="success">+{stats?.revenue.change || 0}%</Badge>
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                    vs last period
                                </span>
                            </div>
                        )}
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
                                            axisLine={{ stroke: 'var(--border-color)' }}
                                        />
                                        <YAxis
                                            tick={{ fill: 'var(--foreground-muted)', fontSize: 12 }}
                                            axisLine={{ stroke: 'var(--border-color)' }}
                                            tickFormatter={(value) => `₹${value / 1000}K`}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'var(--background-card)',
                                                borderColor: 'var(--border-color)',
                                                borderRadius: '12px',
                                                color: 'var(--foreground)'
                                            }}
                                            itemStyle={{ color: 'var(--foreground)' }}
                                            formatter={(value) => value !== undefined ? [`₹${Number(value).toLocaleString()}`, 'Revenue'] : ['', '']}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="revenue"
                                            stroke="var(--primary-500)"
                                            strokeWidth={3}
                                            dot={{ fill: 'var(--primary-500)', strokeWidth: 0, r: 4 }}
                                            activeDot={{ r: 6 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full text-gray-500">
                                    No revenue data yet
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Pipeline Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>Deals by Stage</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[240px]">
                            {pipelineData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pipelineData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
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
                                                borderRadius: '8px',
                                                color: 'var(--foreground)'
                                            }}
                                            itemStyle={{ color: 'var(--foreground)' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full text-gray-500">
                                    No deals yet
                                </div>
                            )}
                        </div>
                        <div className="space-y-3 mt-6">
                            {pipelineData.map((item) => (
                                <div key={item.name} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-3 h-3 rounded-full"
                                            style={{ background: item.color }}
                                        />
                                        <span className="text-gray-600 dark:text-gray-400">{item.name}</span>
                                    </div>
                                    <span className="font-medium text-gray-900 dark:text-white">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Leaderboard */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <span>🏆</span> Top Performers
                        </CardTitle>
                        <a
                            href="/leaderboard"
                            className="text-sm flex items-center gap-1 text-primary-600 hover:text-primary-700 font-medium"
                        >
                            View all <ArrowUpRight size={14} />
                        </a>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {leaderboard.length > 0 ? (
                                leaderboard.slice(0, 5).map((person) => (
                                    <div key={person.rank} className="flex items-center gap-3">
                                        <div
                                            className={cn(
                                                "w-8 text-center font-bold",
                                                person.rank === 1 ? "text-yellow-400" :
                                                    person.rank === 2 ? "text-gray-400" :
                                                        person.rank === 3 ? "text-amber-500" : "text-gray-500"
                                            )}
                                        >
                                            {person.rank === 1 ? '🥇' : person.rank === 2 ? '🥈' : person.rank === 3 ? '🥉' : `#${person.rank}`}
                                        </div>
                                        <Avatar name={person.name} size="sm" />
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-sm truncate text-gray-900 dark:text-white">{person.name}</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                {person.deals} deals
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-semibold text-sm text-green-600 dark:text-green-400">
                                                ₹{person.revenue.toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-4 text-gray-500">
                                    No closed deals yet
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Today's Tasks */}
                <Card>
                    <CardHeader>
                        <CardTitle>Today&apos;s Tasks</CardTitle>
                        <Badge variant="info">{tasks.filter((t) => !t.completed).length} pending</Badge>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {tasks.length > 0 ? (
                                tasks.map((task) => (
                                    <div
                                        key={task.id}
                                        className={cn(
                                            "flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 transition-opacity",
                                            task.completed && "opacity-50"
                                        )}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={task.completed}
                                            onChange={() => { }}
                                            className="mt-1 rounded accent-primary-500 w-4 h-4 cursor-pointer"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div
                                                className={cn(
                                                    "text-sm font-medium text-gray-900 dark:text-white",
                                                    task.completed && "line-through text-gray-500"
                                                )}
                                            >
                                                {task.title}
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                {task.time}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-4 text-gray-500">
                                    No tasks for today
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity size={18} /> Recent Activity
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {activities.length > 0 ? (
                                activities.map((activity) => {
                                    const Icon = typeIcons[activity.type] || Activity;
                                    return (
                                        <div key={activity.id} className="flex items-start gap-3">
                                            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400">
                                                <Icon size={16} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm text-gray-900 dark:text-white">{activity.message}</div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                    {formatRelativeTime(activity.time)}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center py-4 text-gray-500">
                                    No recent activity
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
