import { Injectable } from '@nestjs/common';
import { InvoiceStatus, Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

interface UserContext {
    id: string;
    role: Role;
}

@Injectable()
export class AnalyticsService {
    constructor(private readonly prisma: PrismaService) { }

    async getDashboardAnalytics(user: UserContext) {
        let userIds: string[] | undefined = undefined;

        if (user.role === Role.EMPLOYEE) {
            userIds = [user.id];
        } else if (user.role === Role.MANAGER) {
            const teamMembers = await this.prisma.user.findMany({
                where: { managerId: user.id },
                select: { id: true },
            });
            userIds = [user.id, ...teamMembers.map(m => m.id)];
        }

        const assigneeFilter = userIds ? { assigneeId: { in: userIds } } : undefined;

        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const endOfToday = new Date(startOfToday);
        endOfToday.setHours(23, 59, 59, 999);

        const startOfMonth = new Date(startOfToday.getFullYear(), startOfToday.getMonth(), 1);

        const [
            leadStats,
            customerStats,
            invoiceStats,
            paymentStats,
        ] = await Promise.all([
            this.getLeadStats(assigneeFilter, startOfMonth),
            this.getCustomerStats(assigneeFilter),
            this.getInvoiceStats(),
            this.getPaymentStats(startOfToday, endOfToday),
        ]);

        return {
            leads: leadStats,
            customers: customerStats,
            activities: {
                dueToday: 0,
                overdue: 0,
                completedThisMonth: 0,
            },
            invoices: invoiceStats,
            payments: paymentStats,
        };
    }

    private async getLeadStats(assigneeFilter: any, startOfMonth: Date) {
        const [total, newThisMonth, byStatus] = await Promise.all([
            this.prisma.lead.count({ where: assigneeFilter }),
            this.prisma.lead.count({ where: { ...(assigneeFilter || {}), createdAt: { gte: startOfMonth } } }),
            this.prisma.lead.groupBy({
                by: ['status'],
                where: assigneeFilter,
                _count: true,
            }),
        ]);

        return {
            total,
            newThisMonth,
            byStatus: byStatus.reduce((acc, row) => {
                acc[row.status] = row._count;
                return acc;
            }, {} as Record<string, number>),
        };
    }

    private async getCustomerStats(assigneeFilter: any) {
        const customers = await this.prisma.customer.findMany({
            where: assigneeFilter,
            select: { id: true, company: true },
        });

        const companies = new Set(customers.map(c => c.company).filter(Boolean) as string[]).size;

        return {
            total: customers.length,
            companies,
        };
    }

    private async getInvoiceStats() {
        const [total, byStatus, totalRevenue, paidRevenue] = await Promise.all([
            this.prisma.invoice.count(),
            this.prisma.invoice.groupBy({
                by: ['status'],
                _count: true,
                _sum: { total: true },
            }),
            this.prisma.invoice.aggregate({ _sum: { total: true } }),
            this.prisma.invoice.aggregate({ where: { status: InvoiceStatus.PAID }, _sum: { total: true } }),
        ]);

        return {
            total,
            totalRevenue: totalRevenue._sum.total || 0,
            paidRevenue: paidRevenue._sum.total || 0,
            byStatus: byStatus.reduce((acc, row) => {
                acc[row.status] = {
                    count: row._count,
                    value: row._sum.total || 0,
                };
                return acc;
            }, {} as Record<string, { count: number; value: number }>),
        };
    }

    private async getPaymentStats(startOfToday: Date, endOfToday: Date) {
        const [totalPayments, todayAgg, totalAgg] = await Promise.all([
            this.prisma.payment.count(),
            this.prisma.payment.aggregate({
                where: { paymentDate: { gte: startOfToday, lte: endOfToday } },
                _sum: { totalAmount: true },
                _count: true,
            }),
            this.prisma.payment.aggregate({
                _sum: { totalAmount: true },
                _count: true,
            }),
        ]);

        return {
            totalPayments,
            totalAmount: totalAgg._sum.totalAmount || 0,
            todayPayments: todayAgg._count || 0,
            todayAmount: todayAgg._sum.totalAmount || 0,
        };
    }
}
