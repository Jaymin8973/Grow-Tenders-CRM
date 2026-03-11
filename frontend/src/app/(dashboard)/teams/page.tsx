'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    ChevronDown,
    ChevronUp,
    Users,
    UserCheck,
    TrendingUp,
    IndianRupee,
    Target,
    Award,
    BarChart3,
    Crown,
} from 'lucide-react';
import { getInitials, formatCurrency, formatNumber, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function TeamsPage() {
    const { user } = useAuth();
    const [expandedTeams, setExpandedTeams] = useState<Record<string, boolean>>({});
    const { toast } = useToast();

    const canView = user?.role === 'SUPER_ADMIN' || user?.role === 'MANAGER';

    // Fetch all users to get hierarchy
    const { data: users, isLoading: usersLoading } = useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            const response = await apiClient.get('/users');
            return response.data;
        },
        enabled: !!canView,
        placeholderData: (prev) => prev,
    });

    // Fetch employee productivity stats
    const { data: productivity, isLoading: statsLoading } = useQuery({
        queryKey: ['employee-productivity'],
        queryFn: async () => {
            const response = await apiClient.get('/reports/employee-productivity');
            return response.data;
        },
        enabled: !!canView,
        placeholderData: (prev) => prev,
    });

    const toggleTeam = (managerId: string) => {
        setExpandedTeams(prev => ({ ...prev, [managerId]: !prev[managerId] }));
    };

    const managers = useMemo(() => {
        const managersMap = new Map<string, any>();

        (users || []).forEach((u: any) => {
            if (u.role === 'MANAGER') {
                managersMap.set(u.id, { 
                    ...u, 
                    team: [], 
                    totalRevenue: 0, 
                    totalLeadsConverted: 0,
                    totalLeadsAssigned: 0,
                    avgConversionRate: 0,
                });
            }
        });

        const productivityById = new Map<string, any>((productivity || []).map((p: any) => [p.id, p]));

        (users || []).forEach((u: any) => {
            if (u.role === 'EMPLOYEE') {
                const stats = productivityById.get(u.id) || {
                    leadsAssigned: 0,
                    leadsConverted: 0,
                    leadConversionRate: 0,
                    revenue: 0,
                };

                const employeeWithStats = { ...u, stats };

                if (u.managerId && managersMap.has(u.managerId)) {
                    const manager = managersMap.get(u.managerId);
                    manager.team.push(employeeWithStats);
                    manager.totalRevenue += stats.revenue || 0;
                    manager.totalLeadsConverted += stats.leadsConverted || 0;
                    manager.totalLeadsAssigned += stats.leadsAssigned || 0;
                }
            }
        });

        // Calculate average conversion rate for each manager's team
        managersMap.forEach((manager) => {
            if (manager.team.length > 0) {
                const totalRate = manager.team.reduce((sum: number, emp: any) => sum + (emp.stats.leadConversionRate || 0), 0);
                manager.avgConversionRate = Math.round(totalRate / manager.team.length);
            }
        });

        return Array.from(managersMap.values())
            .filter(m => m.team.length > 0 || m.role === 'MANAGER')
            .sort((a, b) => (b.totalRevenue || 0) - (a.totalRevenue || 0));
    }, [users, productivity]);

    if (!canView) {
        return (
            <div className="flex h-full flex-col items-center justify-center gap-2">
                <p className="text-muted-foreground">You do not have permission to view teams.</p>
            </div>
        );
    }

    if (usersLoading || statsLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        );
    }

    const totals = {
        managers: managers.length,
        members: managers.reduce((sum, m) => sum + (m.team?.length || 0), 0),
        revenue: managers.reduce((sum, m) => sum + (m.totalRevenue || 0), 0),
        conversions: managers.reduce((sum, m) => sum + (m.totalLeadsConverted || 0), 0),
        assigned: managers.reduce((sum, m) => sum + (m.totalLeadsAssigned || 0), 0),
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
            <div className="max-w-7xl mx-auto space-y-6 page-enter px-4 sm:px-6 lg:px-8 pt-6 pb-10">
                {/* Header */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/10 p-6">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    
                    <div className="relative">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-primary/10">
                                <Users className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                                    Teams Overview
                                </h1>
                                <p className="text-muted-foreground text-sm mt-1">
                                    Sales performance breakdown by manager and team
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <TooltipProvider>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    <Card className="overflow-hidden border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur">
                        <div className="h-1.5 bg-gradient-to-r from-violet-500 to-purple-500" />
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/30">
                                    <Crown className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Managers</p>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 cursor-default">{formatNumber(totals.managers)}</p>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>{totals.managers.toLocaleString('en-IN')}</p>
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
                                    <UserCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Team Members</p>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 cursor-default">{formatNumber(totals.members)}</p>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>{totals.members.toLocaleString('en-IN')}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="overflow-hidden border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur">
                        <div className="h-1.5 bg-gradient-to-r from-amber-500 to-orange-500" />
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                                    <Target className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Leads Assigned</p>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 cursor-default">{formatNumber(totals.assigned)}</p>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>{totals.assigned.toLocaleString('en-IN')}</p>
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
                                    <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Conversions</p>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 cursor-default">{formatNumber(totals.conversions)}</p>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>{totals.conversions.toLocaleString('en-IN')}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="overflow-hidden border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur">
                        <div className="h-1.5 bg-gradient-to-r from-rose-500 to-pink-500" />
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-900/30">
                                    <IndianRupee className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Revenue</p>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 cursor-default">{formatCurrency(totals.revenue)}</p>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>₹{totals.revenue.toLocaleString('en-IN')}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                </TooltipProvider>

                {/* Teams List */}
                <div className="grid gap-6">
                    {managers.map((manager, index) => {
                        const isExpanded = expandedTeams[manager.id] ?? true;

                        return (
                            <Card key={manager.id} className="overflow-hidden border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur hover:shadow-xl transition-all">
                                {/* Manager Header */}
                                <div className="p-6 bg-gradient-to-r from-slate-50 to-transparent dark:from-slate-800/50">
                                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                        {/* Manager Profile */}
                                        <div className="flex items-center gap-4 min-w-[280px]">
                                            <div className="relative">
                                                <Avatar className="h-16 w-16 border-4 border-white shadow-lg">
                                                    <AvatarImage src={manager.avatar} />
                                                    <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-500 text-white text-xl font-bold">
                                                        {getInitials(manager.firstName, manager.lastName)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-violet-500 border-2 border-white shadow-md">
                                                    <Crown className="h-3 w-3 text-white" />
                                                </div>
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                                                    {manager.firstName} {manager.lastName}
                                                </h3>
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                                    <Badge variant="outline" className="font-medium bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-800">
                                                        {manager.branch?.code || 'HQ'}
                                                    </Badge>
                                                    <span className="flex items-center gap-1">
                                                        <Users className="h-3.5 w-3.5" />
                                                        {manager.team.length} Members
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Stats */}
                                        <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-900/20">
                                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Revenue</p>
                                                <p className="text-xl font-bold text-rose-600 dark:text-rose-400">
                                                    {formatCurrency(manager.totalRevenue)}
                                                </p>
                                            </div>

                                            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
                                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Converted</p>
                                                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                                                    {manager.totalLeadsConverted}
                                                </p>
                                            </div>

                                            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20">
                                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Assigned</p>
                                                <p className="text-xl font-bold text-amber-600 dark:text-amber-400">
                                                    {manager.totalLeadsAssigned}
                                                </p>
                                            </div>

                                            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20">
                                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Avg Win Rate</p>
                                                <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                                                    {manager.avgConversionRate}%
                                                </p>
                                            </div>
                                        </div>

                                        {/* Toggle Button */}
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => toggleTeam(manager.id)}
                                            className="gap-2 shrink-0"
                                        >
                                            {isExpanded ? 'Hide' : 'View'} Team
                                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                </div>

                                {/* Team Members Table */}
                                {isExpanded && (
                                    <>
                                        <Separator />
                                        <div className="p-4 bg-slate-50/50 dark:bg-slate-900/30">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow className="hover:bg-transparent">
                                                        <TableHead className="w-[30%] pl-6 font-semibold">Team Member</TableHead>
                                                        <TableHead className="font-semibold">Performance</TableHead>
                                                        <TableHead className="font-semibold">Activity</TableHead>
                                                        <TableHead className="text-right pr-6 font-semibold">Revenue</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {manager.team.map((employee: any) => (
                                                        <TableRow key={employee.id} className="hover:bg-white/50 dark:hover:bg-slate-800/50">
                                                            <TableCell className="pl-6 py-4">
                                                                <div className="flex items-center gap-3">
                                                                    <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                                                                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white text-sm font-semibold">
                                                                            {getInitials(employee.firstName, employee.lastName)}
                                                                        </AvatarFallback>
                                                                    </Avatar>
                                                                    <div>
                                                                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                                                                            {employee.firstName} {employee.lastName}
                                                                        </div>
                                                                        <div className="text-xs text-muted-foreground">
                                                                            {employee.email}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex items-center gap-4">
                                                                    <div className="flex flex-col gap-1.5 w-32">
                                                                        <div className="flex justify-between text-xs font-medium">
                                                                            <span className="text-muted-foreground">Win Rate</span>
                                                                            <span className={cn(
                                                                                "font-bold",
                                                                                employee.stats.leadConversionRate > 40 ? "text-emerald-600 dark:text-emerald-400" :
                                                                                employee.stats.leadConversionRate > 20 ? "text-amber-600 dark:text-amber-400" : "text-blue-600 dark:text-blue-400"
                                                                            )}>
                                                                                {employee.stats.leadConversionRate}%
                                                                            </span>
                                                                        </div>
                                                                        <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                                                            <div
                                                                                className={cn("h-full rounded-full transition-all",
                                                                                    employee.stats.leadConversionRate > 40 ? "bg-gradient-to-r from-emerald-400 to-green-500" :
                                                                                    employee.stats.leadConversionRate > 20 ? "bg-gradient-to-r from-amber-400 to-orange-500" : "bg-gradient-to-r from-blue-400 to-cyan-500"
                                                                                )}
                                                                                style={{ width: `${Math.min(employee.stats.leadConversionRate, 100)}%` }}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex items-center gap-2">
                                                                    <Badge variant="outline" className="font-medium bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800">
                                                                        {employee.stats.leadsAssigned} Leads
                                                                    </Badge>
                                                                    <Badge variant="outline" className="font-medium bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">
                                                                        {employee.stats.leadsConverted} Won
                                                                    </Badge>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-right pr-6">
                                                                <span className="text-lg font-bold text-rose-600 dark:text-rose-400">
                                                                    {formatCurrency(employee.stats.revenue)}
                                                                </span>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                    {manager.team.length === 0 && (
                                                        <TableRow>
                                                            <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                                                <div className="flex flex-col items-center gap-2">
                                                                    <Users className="h-8 w-8 opacity-30" />
                                                                    <p>No team members assigned</p>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </>
                                )}
                            </Card>
                        );
                    })}

                    {managers.length === 0 && (
                        <Card className="overflow-hidden border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur">
                            <CardContent className="flex flex-col items-center justify-center py-16">
                                <Users className="h-16 w-16 text-muted-foreground/30 mb-4" />
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">No Teams Found</h3>
                                <p className="text-muted-foreground text-sm mt-1">Create managers and assign employees to see team data</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
