'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Users,
    TrendingUp,
    Target,
    Award,
    Briefcase,
    ChevronDown,
    ChevronUp,
    DollarSign,
    PieChart,
    Mail
} from 'lucide-react';
import { getInitials, formatCurrency, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ComposeEmailDialog } from '@/components/mail/compose-email-dialog';

export default function TeamsPage() {
    const { user } = useAuth();
    const [expandedTeams, setExpandedTeams] = useState<Record<string, boolean>>({});

    // Fetch all users to get hierarchy
    const { data: users, isLoading: usersLoading } = useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            const response = await apiClient.get('/users');
            return response.data;
        },
    });

    // Fetch productivity stats
    const { data: productivity, isLoading: statsLoading } = useQuery({
        queryKey: ['reports', 'productivity'],
        queryFn: async () => {
            const response = await apiClient.get('/reports/employee-productivity');
            return response.data;
        },
    });

    const toggleTeam = (managerId: string) => {
        setExpandedTeams(prev => ({ ...prev, [managerId]: !prev[managerId] }));
    };

    if (usersLoading || statsLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        );
    }

    // Processing Logic (same as before)
    const managersMap = new Map();
    const unassignedEmployees: any[] = [];

    users?.forEach((u: any) => {
        if (u.role === 'MANAGER') {
            managersMap.set(u.id, { ...u, team: [], totalRevenue: 0, totalLeadsConverted: 0, totalDeals: 0 });
        }
    });

    users?.forEach((u: any) => {
        if (u.role === 'EMPLOYEE') {
            const stats = productivity?.find((p: any) => p.id === u.id) || {
                leadsAssigned: 0,
                leadsConverted: 0,
                leadConversionRate: 0,
                dealsWon: 0,
                revenue: 0
            };

            const employeeWithStats = { ...u, stats };

            if (u.managerId && managersMap.has(u.managerId)) {
                const manager = managersMap.get(u.managerId);
                manager.team.push(employeeWithStats);
                manager.totalRevenue += stats.revenue;
                manager.totalLeadsConverted += stats.leadsConverted;
                manager.totalDeals += stats.dealsWon;
            } else {
                unassignedEmployees.push(employeeWithStats);
            }
        }
    });

    const managers = Array.from(managersMap.values())
        .filter(m => m.team.length > 0 || m.role === 'MANAGER')
        .sort((a, b) => b.totalRevenue - a.totalRevenue);

    return (
        <div className="space-y-6 page-enter max-w-7xl mx-auto pb-10">
            <div className="flex flex-col gap-2 mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                    Teams Overview
                </h1>
                <p className="text-muted-foreground text-sm">
                    Sales performance breakdown by manager and team.
                </p>
            </div>

            <div className="flex justify-end mb-4">
                <ComposeEmailDialog>
                    <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
                        <Mail className="h-4 w-4" /> Compose Email
                    </Button>
                </ComposeEmailDialog>
            </div>

            <div className="grid gap-6">
                {managers.map((manager, index) => {
                    const isExpanded = expandedTeams[manager.id] ?? true; // Default expanded

                    return (
                        <Card key={manager.id} className="overflow-hidden border shadow-sm hover:shadow-md transition-all">
                            {/* Card Header: Manager Info & Aggregate Stats */}
                            <div className="p-6">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    {/* Manager Profile */}
                                    <div className="flex items-center gap-4 min-w-[250px]">
                                        <Avatar className="h-14 w-14 border border-gray-100 dark:border-gray-800">
                                            <AvatarImage src={manager.avatar} />
                                            <AvatarFallback className="bg-primary/5 text-primary text-lg font-medium">
                                                {getInitials(manager.firstName, manager.lastName)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                                {manager.firstName} {manager.lastName}
                                            </h3>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                                <Badge variant="outline" className="font-normal text-xs bg-gray-50 dark:bg-gray-900">
                                                    {manager.branch?.code || 'HQ'}
                                                </Badge>
                                                <span>•</span>
                                                <span>{manager.team.length} Team Members</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Aggregate Stats */}
                                    <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="space-y-1">
                                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Revenue</p>
                                            <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                                                {formatCurrency(manager.totalRevenue)}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Deals Won</p>
                                            <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                                                {manager.totalDeals}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Conversions</p>
                                            <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                                                {manager.totalLeadsConverted}
                                            </p>
                                        </div>
                                        <div className="flex items-center justify-end">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => toggleTeam(manager.id)}
                                                className="gap-2 text-muted-foreground"
                                            >
                                                {isExpanded ? 'Hide Details' : 'View Details'}
                                                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Team Details Table (Collapsible) */}
                            {isExpanded && (
                                <>
                                    <Separator />
                                    <div className="bg-gray-50/50 dark:bg-gray-900/20 p-2 sm:p-4">
                                        <div className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow className="hover:bg-transparent">
                                                        <TableHead className="w-[30%] pl-6">Member</TableHead>
                                                        <TableHead>Performance</TableHead>
                                                        <TableHead>Activity</TableHead>
                                                        <TableHead className="text-right pr-6">Revenue</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {manager.team.map((employee: any) => (
                                                        <TableRow key={employee.id} className="hover:bg-muted/50">
                                                            <TableCell className="pl-6 py-3">
                                                                <div className="flex items-center gap-3">
                                                                    <Avatar className="h-8 w-8">
                                                                        <AvatarFallback className="text-xs">
                                                                            {getInitials(employee.firstName, employee.lastName)}
                                                                        </AvatarFallback>
                                                                    </Avatar>
                                                                    <div>
                                                                        <div className="font-medium text-sm">
                                                                            {employee.firstName} {employee.lastName}
                                                                        </div>
                                                                        <div className="text-xs text-muted-foreground">
                                                                            {employee.role.toLowerCase()}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex items-center gap-4">
                                                                    <div className="flex flex-col gap-1 w-24">
                                                                        <div className="flex justify-between text-[10px] font-medium text-muted-foreground">
                                                                            <span>Win Rate</span>
                                                                            <span>{employee.stats.leadConversionRate}%</span>
                                                                        </div>
                                                                        <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                                                                            <div
                                                                                className={cn("h-full rounded-full",
                                                                                    employee.stats.leadConversionRate > 40 ? "bg-emerald-500" :
                                                                                        employee.stats.leadConversionRate > 20 ? "bg-amber-500" : "bg-blue-500"
                                                                                )}
                                                                                style={{ width: `${Math.min(employee.stats.leadConversionRate, 100)}%` }}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-xs">
                                                                        <span className="font-semibold">{employee.stats.dealsWon}</span> Deals
                                                                    </div>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                                    <span className="bg-secondary px-2 py-0.5 rounded-sm text-secondary-foreground font-medium">
                                                                        {employee.stats.leadsAssigned} Leads
                                                                    </span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-right pr-6 font-mono text-sm font-medium">
                                                                {formatCurrency(employee.stats.revenue)}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                    {manager.team.length === 0 && (
                                                        <TableRow>
                                                            <TableCell colSpan={4} className="h-24 text-center text-muted-foreground text-sm">
                                                                No team members assigned
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>
                                </>
                            )}
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
