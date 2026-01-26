import { Injectable } from '@nestjs/common';
import { Role, DealStage, LeadStatus, ActivityStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

interface DateRange {
    startDate: Date;
    endDate: Date;
}

@Injectable()
export class ReportsService {
    constructor(private prisma: PrismaService) { }

    async getSalesPerformance(userId: string, role: Role, dateRange?: DateRange) {
        const dateFilter = dateRange ? {
            createdAt: { gte: dateRange.startDate, lte: dateRange.endDate },
        } : {};

        let userFilter: any = {};
        if (role === Role.EMPLOYEE) {
            userFilter = { ownerId: userId };
        } else if (role === Role.MANAGER) {
            const teamMembers = await this.prisma.user.findMany({
                where: { managerId: userId },
                select: { id: true },
            });
            const teamIds = [userId, ...teamMembers.map(m => m.id)];
            userFilter = { ownerId: { in: teamIds } };
        }

        const [
            totalRevenue,
            wonDeals,
            lostDeals,
            avgDealSize,
            monthlyRevenue,
        ] = await Promise.all([
            this.prisma.deal.aggregate({
                where: { stage: DealStage.CLOSED_WON, ...dateFilter, ...userFilter },
                _sum: { value: true },
            }),
            this.prisma.deal.count({
                where: { stage: DealStage.CLOSED_WON, ...dateFilter, ...userFilter },
            }),
            this.prisma.deal.count({
                where: { stage: DealStage.CLOSED_LOST, ...dateFilter, ...userFilter },
            }),
            this.prisma.deal.aggregate({
                where: { stage: DealStage.CLOSED_WON, ...dateFilter, ...userFilter },
                _avg: { value: true },
            }),
            this.getMonthlyRevenue(userFilter),
        ]);

        const winRate = wonDeals + lostDeals > 0
            ? Math.round((wonDeals / (wonDeals + lostDeals)) * 100)
            : 0;

        return {
            totalRevenue: totalRevenue._sum.value || 0,
            wonDeals,
            lostDeals,
            winRate,
            avgDealSize: avgDealSize._avg.value || 0,
            monthlyRevenue,
        };
    }

    private async getMonthlyRevenue(userFilter: any) {
        const now = new Date();
        const months = [];

        for (let i = 11; i >= 0; i--) {
            const startDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

            const revenue = await this.prisma.deal.aggregate({
                where: {
                    stage: DealStage.CLOSED_WON,
                    actualCloseDate: { gte: startDate, lte: endDate },
                    ...userFilter,
                },
                _sum: { value: true },
            });

            months.push({
                month: startDate.toLocaleString('default', { month: 'short', year: 'numeric' }),
                revenue: revenue._sum.value || 0,
            });
        }

        return months;
    }

    async getPipelineBreakdown(userId: string, role: Role) {
        const stages = Object.values(DealStage);

        let userFilter: any = {};
        if (role === Role.EMPLOYEE) {
            userFilter = { ownerId: userId };
        } else if (role === Role.MANAGER) {
            const teamMembers = await this.prisma.user.findMany({
                where: { managerId: userId },
                select: { id: true },
            });
            const teamIds = [userId, ...teamMembers.map(m => m.id)];
            userFilter = { ownerId: { in: teamIds } };
        }

        const breakdown = await Promise.all(
            stages.map(async (stage) => {
                const result = await this.prisma.deal.aggregate({
                    where: { stage, ...userFilter },
                    _count: true,
                    _sum: { value: true },
                });
                return {
                    stage,
                    count: result._count,
                    value: result._sum.value || 0,
                };
            }),
        );

        return breakdown;
    }

    async getEmployeeProductivity(dateRange?: DateRange) {
        const dateFilter = dateRange ? {
            createdAt: { gte: dateRange.startDate, lte: dateRange.endDate },
        } : {};

        const employees = await this.prisma.user.findMany({
            where: { role: Role.EMPLOYEE, isActive: true },
            select: { id: true, firstName: true, lastName: true },
        });

        const productivity = await Promise.all(
            employees.map(async (employee) => {
                const [
                    leadsAssigned,
                    leadsConverted,
                    activitiesTotal,
                    activitiesCompleted,
                    dealsWon,
                    revenue,
                ] = await Promise.all([
                    this.prisma.lead.count({
                        where: { assigneeId: employee.id, ...dateFilter }
                    }),
                    this.prisma.lead.count({
                        where: { assigneeId: employee.id, status: LeadStatus.WON, ...dateFilter }
                    }),
                    this.prisma.activity.count({
                        where: { assigneeId: employee.id, ...dateFilter }
                    }),
                    this.prisma.activity.count({
                        where: { assigneeId: employee.id, status: ActivityStatus.COMPLETED, ...dateFilter }
                    }),
                    this.prisma.deal.count({
                        where: { ownerId: employee.id, stage: DealStage.CLOSED_WON, ...dateFilter }
                    }),
                    this.prisma.deal.aggregate({
                        where: { ownerId: employee.id, stage: DealStage.CLOSED_WON, ...dateFilter },
                        _sum: { value: true },
                    }),
                ]);

                return {
                    id: employee.id,
                    name: `${employee.firstName} ${employee.lastName}`,
                    leadsAssigned,
                    leadsConverted,
                    leadConversionRate: leadsAssigned > 0
                        ? Math.round((leadsConverted / leadsAssigned) * 100)
                        : 0,
                    activitiesTotal,
                    activitiesCompleted,
                    activityCompletionRate: activitiesTotal > 0
                        ? Math.round((activitiesCompleted / activitiesTotal) * 100)
                        : 0,
                    dealsWon,
                    revenue: revenue._sum.value || 0,
                };
            }),
        );

        return productivity.sort((a, b) => b.revenue - a.revenue);
    }

    async getFollowUpOverdueReport() {
        const now = new Date();

        const overdueActivities = await this.prisma.activity.findMany({
            where: {
                scheduledAt: { lt: now },
                status: { in: [ActivityStatus.SCHEDULED, ActivityStatus.OVERDUE] },
            },
            include: {
                assignee: {
                    select: { id: true, firstName: true, lastName: true, email: true },
                },
                lead: {
                    select: { id: true, firstName: true, lastName: true, company: true },
                },
                customer: {
                    select: { id: true, firstName: true, lastName: true, company: true },
                },
            },
            orderBy: { scheduledAt: 'asc' },
        });

        // Group by assignee
        const byAssignee = overdueActivities.reduce((acc, activity) => {
            const assigneeId = activity.assigneeId;
            if (!acc[assigneeId]) {
                acc[assigneeId] = {
                    assignee: activity.assignee,
                    activities: [],
                    count: 0,
                };
            }
            acc[assigneeId].activities.push(activity);
            acc[assigneeId].count++;
            return acc;
        }, {} as Record<string, any>);

        return {
            totalOverdue: overdueActivities.length,
            byAssignee: Object.values(byAssignee),
            activities: overdueActivities,
        };
    }

    async getLeadSourceAnalysis(dateRange?: DateRange) {
        const dateFilter = dateRange ? {
            createdAt: { gte: dateRange.startDate, lte: dateRange.endDate },
        } : {};

        const analysis = await this.prisma.lead.groupBy({
            by: ['source'],
            where: dateFilter,
            _count: true,
        });

        const sourcesWithConversion = await Promise.all(
            analysis.map(async (item) => {
                const converted = await this.prisma.lead.count({
                    where: { source: item.source, status: LeadStatus.WON, ...dateFilter },
                });
                return {
                    source: item.source,
                    count: item._count,
                    converted,
                    conversionRate: item._count > 0
                        ? Math.round((converted / item._count) * 100)
                        : 0,
                };
            }),
        );

        return sourcesWithConversion;
    }

    async getDashboardStats(userId: string, role: Role) {
        let userFilter: any = {};

        if (role === Role.EMPLOYEE) {
            userFilter = { OR: [{ assigneeId: userId }, { ownerId: userId }] };
        } else if (role === Role.MANAGER) {
            const teamMembers = await this.prisma.user.findMany({
                where: { managerId: userId },
                select: { id: true },
            });
            const teamIds = [userId, ...teamMembers.map(m => m.id)];
            userFilter = { OR: [{ assigneeId: { in: teamIds } }, { ownerId: { in: teamIds } }] };
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        const [
            totalLeads,
            newLeadsThisMonth,
            totalCustomers,
            totalDeals,
            openDeals,
            wonDealsThisMonth,
            revenueThisMonth,
            activitiesToday,
            overdueActivities,
        ] = await Promise.all([
            this.prisma.lead.count({ where: role !== Role.SUPER_ADMIN ? { assigneeId: userId } : {} }),
            this.prisma.lead.count({
                where: {
                    createdAt: { gte: thisMonth },
                    ...(role !== Role.SUPER_ADMIN ? { assigneeId: userId } : {}),
                },
            }),
            this.prisma.customer.count({ where: role !== Role.SUPER_ADMIN ? { assigneeId: userId } : {} }),
            this.prisma.deal.count({ where: role !== Role.SUPER_ADMIN ? { ownerId: userId } : {} }),
            this.prisma.deal.count({
                where: {
                    stage: { notIn: [DealStage.CLOSED_WON, DealStage.CLOSED_LOST] },
                    ...(role !== Role.SUPER_ADMIN ? { ownerId: userId } : {}),
                },
            }),
            this.prisma.deal.count({
                where: {
                    stage: DealStage.CLOSED_WON,
                    actualCloseDate: { gte: thisMonth },
                    ...(role !== Role.SUPER_ADMIN ? { ownerId: userId } : {}),
                },
            }),
            this.prisma.deal.aggregate({
                where: {
                    stage: DealStage.CLOSED_WON,
                    actualCloseDate: { gte: thisMonth },
                    ...(role !== Role.SUPER_ADMIN ? { ownerId: userId } : {}),
                },
                _sum: { value: true },
            }),
            this.prisma.activity.count({
                where: {
                    scheduledAt: { gte: today, lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) },
                    ...(role !== Role.SUPER_ADMIN ? { assigneeId: userId } : {}),
                },
            }),
            this.prisma.activity.count({
                where: {
                    scheduledAt: { lt: today },
                    status: { in: [ActivityStatus.SCHEDULED, ActivityStatus.OVERDUE] },
                    ...(role !== Role.SUPER_ADMIN ? { assigneeId: userId } : {}),
                },
            }),
        ]);

        return {
            totalLeads,
            newLeadsThisMonth,
            totalCustomers,
            totalDeals,
            openDeals,
            wonDealsThisMonth,
            revenueThisMonth: revenueThisMonth._sum.value || 0,
            activitiesToday,
            overdueActivities,
        };
    }
}
