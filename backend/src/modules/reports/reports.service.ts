import { Injectable } from '@nestjs/common';
import { Role, LeadStatus, InvoiceStatus } from '@prisma/client';
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
            userFilter = { assigneeId: userId };
        } else if (role === Role.MANAGER) {
            const teamMembers = await this.prisma.user.findMany({
                where: { managerId: userId },
                select: { id: true },
            });
            const teamIds = [userId, ...teamMembers.map(m => m.id)];
            userFilter = { assigneeId: { in: teamIds } };
        }

        const [
            totalLeads,
            closedLeads,
            monthlyData,
        ] = await Promise.all([
            this.prisma.lead.count({
                where: { ...dateFilter, ...userFilter },
            }),
            this.prisma.lead.count({
                where: { status: LeadStatus.CLOSED_LEAD, ...dateFilter, ...userFilter },
            }),
            this.getMonthlyLeadData(userFilter),
        ]);

        const conversionRate = totalLeads > 0
            ? Math.round((closedLeads / totalLeads) * 100)
            : 0;

        return {
            totalRevenue: 0,
            totalLeads,
            closedLeads,
            conversionRate,
            monthlyRevenue: monthlyData,
        };
    }

    private async getMonthlyLeadData(userFilter: any) {
        const now = new Date();
        const months = [];

        for (let i = 11; i >= 0; i--) {
            const startDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

            const leadsCount = await this.prisma.lead.count({
                where: {
                    status: LeadStatus.CLOSED_LEAD,
                    createdAt: { gte: startDate, lte: endDate },
                    ...userFilter,
                },
            });

            months.push({
                month: startDate.toLocaleString('default', { month: 'short', year: 'numeric' }),
                revenue: 0,
                closedLeads: leadsCount,
            });
        }

        return months;
    }

    async getPipelineBreakdown(userId: string, role: Role) {
        const stages = Object.values(LeadStatus);

        let userFilter: any = {};
        if (role === Role.EMPLOYEE) {
            userFilter = { assigneeId: userId };
        } else if (role === Role.MANAGER) {
            const teamMembers = await this.prisma.user.findMany({
                where: { managerId: userId },
                select: { id: true },
            });
            const teamIds = [userId, ...teamMembers.map(m => m.id)];
            userFilter = { assigneeId: { in: teamIds } };
        }

        const breakdown = await Promise.all(
            stages.map(async (status) => {
                const count = await this.prisma.lead.count({
                    where: { status, ...userFilter },
                });
                return {
                    stage: status,
                    count,
                    value: 0,
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
                    revenue,
                ] = await Promise.all([
                    this.prisma.lead.count({
                        where: { assigneeId: employee.id, ...dateFilter }
                    }),
                    this.prisma.lead.count({
                        where: { assigneeId: employee.id, status: LeadStatus.CLOSED_LEAD, ...dateFilter }
                    }),
                    this.prisma.invoice.aggregate({
                        where: {
                            status: InvoiceStatus.PAID,
                            customer: { assigneeId: employee.id },
                            ...dateFilter,
                        },
                        _sum: { total: true },
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
                    revenue: revenue._sum.total || 0,
                };
            }),
        );

        return productivity.sort((a, b) => b.leadsConverted - a.leadsConverted);
    }

    async getFollowUpOverdueReport() {
        const now = new Date();

        const overdueFollowUps = await this.prisma.followUp.findMany({
            where: {
                scheduledAt: { lt: now },
                status: { in: ['SCHEDULED'] },
            },
            include: {
                lead: {
                    select: { id: true, firstName: true, lastName: true, company: true },
                },
            },
            orderBy: { scheduledAt: 'asc' },
        });

        return {
            totalOverdue: overdueFollowUps.length,
            followUps: overdueFollowUps,
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
                    where: { source: item.source, status: LeadStatus.CLOSED_LEAD, ...dateFilter },
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
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        const leadScopeWhere = role !== Role.SUPER_ADMIN ? { assigneeId: userId } : {};
        const invoiceScopeWhere = role !== Role.SUPER_ADMIN
            ? { customer: { assigneeId: userId } }
            : {};

        const monthlyRevenue = await this.getMonthlyRevenue(invoiceScopeWhere);

        const leadsByStatus = await this.getLeadsByStatus(leadScopeWhere);

        const [
            totalLeads,
            coldLeads,
            hotLeads,
            warmLeads,
            assignedLeads,
            unassignedLeads,
            newLeadsThisMonth,
            totalCustomers,
            followUpsToday,
            overdueFollowUps,
        ] = await Promise.all([
            this.prisma.lead.count({ where: leadScopeWhere }),
            this.prisma.lead.count({ where: { ...leadScopeWhere, status: LeadStatus.COLD_LEAD } }),
            this.prisma.lead.count({ where: { ...leadScopeWhere, status: LeadStatus.HOT_LEAD } }),
            this.prisma.lead.count({ where: { ...leadScopeWhere, status: LeadStatus.WARM_LEAD } }),
            this.prisma.lead.count({
                where: {
                    ...leadScopeWhere,
                    assigneeId: { not: null },
                },
            }),
            this.prisma.lead.count({
                where: {
                    ...leadScopeWhere,
                    OR: [
                        { assigneeId: null },
                        { assigneeId: { isSet: false } },
                    ],
                },
            }),
            this.prisma.lead.count({
                where: {
                    createdAt: { gte: thisMonth },
                    ...leadScopeWhere,
                },
            }),
            this.prisma.customer.count({ where: leadScopeWhere }),
            this.prisma.followUp.count({
                where: {
                    scheduledAt: { gte: today, lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) },
                    status: { in: ['SCHEDULED'] },
                },
            }),
            this.prisma.followUp.count({
                where: {
                    scheduledAt: { lt: today },
                    status: { in: ['SCHEDULED'] },
                },
            }),
        ]);

        return {
            totalLeads,
            coldLeads,
            hotLeads,
            warmLeads,
            assignedLeads,
            unassignedLeads,
            newLeadsThisMonth,
            totalCustomers,
            followUpsToday,
            overdueFollowUps,
            monthlyRevenue,
            leadsByStatus,
        };
    }

    private async getLeadsByStatus(leadScopeWhere: any) {
        const rows = await this.prisma.lead.groupBy({
            by: ['status'],
            where: leadScopeWhere,
            _count: true,
        });

        return rows.reduce((acc, r) => {
            acc[r.status] = r._count;
            return acc;
        }, {} as Record<string, number>);
    }

    private async getMonthlyRevenue(invoiceScopeWhere: any) {
        const now = new Date();
        const months: Array<{ month: string; revenue: number }> = [];

        for (let i = 11; i >= 0; i--) {
            const startDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);

            const revenueAgg = await this.prisma.invoice.aggregate({
                where: {
                    status: InvoiceStatus.PAID,
                    createdAt: { gte: startDate, lte: endDate },
                    ...(invoiceScopeWhere || {}),
                },
                _sum: { total: true },
            });

            months.push({
                month: startDate.toLocaleString('default', { month: 'short', year: 'numeric' }),
                revenue: revenueAgg._sum.total || 0,
            });
        }

        return months;
    }
}
