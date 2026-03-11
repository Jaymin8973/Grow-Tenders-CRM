import { Injectable } from '@nestjs/common';
import { Role, ActivityStatus, LeadStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface LeaderboardEntry {
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
    role?: string;
    branch?: { name: string } | null;
    metrics: {
        revenueClosed: number;
        activitiesCompleted: number;
        followUpCompletionRate: number;
        leadConversionRate: number;
        leadsConverted?: number;
        teamSize?: number;
    };
    rank: number;
}

@Injectable()
export class LeaderboardService {
    constructor(private prisma: PrismaService) { }

    async getGlobalLeaderboard(period?: { startDate: Date; endDate: Date }): Promise<LeaderboardEntry[]> {
        const users = await this.prisma.user.findMany({
            where: { isActive: true, role: Role.EMPLOYEE },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatar: true,
                role: true,
                branch: { select: { name: true } },
            },
        });

        const userIds = users.map(u => u.id);
        if (userIds.length === 0) return [];

        const dateFilter = period
            ? { createdAt: { gte: period.startDate, lte: period.endDate } }
            : undefined;

        const paymentDateFilter = period
            ? { paymentDate: { gte: period.startDate, lte: period.endDate } }
            : undefined;

        const [activitiesCompletedAgg, totalActivitiesAgg, leadsAssignedAgg, leadsConvertedAgg, revenueAgg] = await Promise.all([
            this.prisma.activity.groupBy({
                by: ['assigneeId'],
                where: {
                    assigneeId: { in: userIds },
                    status: ActivityStatus.COMPLETED,
                    ...(dateFilter ? dateFilter : {}),
                },
                _count: { _all: true },
            }),
            this.prisma.activity.groupBy({
                by: ['assigneeId'],
                where: {
                    assigneeId: { in: userIds },
                    ...(dateFilter ? dateFilter : {}),
                },
                _count: { _all: true },
            }),
            this.prisma.lead.groupBy({
                by: ['assigneeId'],
                where: {
                    assigneeId: { in: userIds },
                    ...(dateFilter ? dateFilter : {}),
                },
                _count: { _all: true },
            }),
            this.prisma.lead.groupBy({
                by: ['assigneeId'],
                where: {
                    assigneeId: { in: userIds },
                    status: LeadStatus.CLOSED_LEAD,
                    ...(dateFilter ? dateFilter : {}),
                },
                _count: { _all: true },
            }),
            this.prisma.payment.groupBy({
                by: ['createdById'],
                where: {
                    createdById: { in: userIds },
                    ...(paymentDateFilter ? paymentDateFilter : {}),
                },
                _sum: { totalAmount: true },
            }),
        ]);

        const toCountMap = (rows: Array<{ assigneeId: string | null; _count: { _all: number } }>) => {
            const map = new Map<string, number>();
            for (const r of rows) {
                if (r.assigneeId) map.set(r.assigneeId, r._count._all);
            }
            return map;
        };

        const toRevenueMap = (rows: Array<{ createdById: string | null; _sum: { totalAmount: number | null } }>) => {
            const map = new Map<string, number>();
            for (const r of rows) {
                if (r.createdById) map.set(r.createdById, r._sum.totalAmount || 0);
            }
            return map;
        };

        const activitiesCompletedMap = toCountMap(activitiesCompletedAgg as any);
        const totalActivitiesMap = toCountMap(totalActivitiesAgg as any);
        const leadsAssignedMap = toCountMap(leadsAssignedAgg as any);
        const leadsConvertedMap = toCountMap(leadsConvertedAgg as any);
        const revenueMap = toRevenueMap(revenueAgg as any);

        const leaderboard = users.map((user) => {
            const activitiesCompleted = activitiesCompletedMap.get(user.id) ?? 0;
            const totalActivities = totalActivitiesMap.get(user.id) ?? 0;
            const leadsAssigned = leadsAssignedMap.get(user.id) ?? 0;
            const leadsConverted = leadsConvertedMap.get(user.id) ?? 0;
            const revenueClosed = revenueMap.get(user.id) ?? 0;

            const metrics = {
                revenueClosed,
                activitiesCompleted,
                followUpCompletionRate:
                    totalActivities > 0 ? Math.round((activitiesCompleted / totalActivities) * 100) : 0,
                leadConversionRate:
                    leadsAssigned > 0 ? Math.round((leadsConverted / leadsAssigned) * 100) : 0,
                leadsConverted,
            };

            return {
                userId: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                avatar: user.avatar || undefined,
                role: user.role,
                branch: user.branch,
                metrics,
                rank: 0,
            };
        });

        // Sort by revenue closed, then by activities completed
        leaderboard.sort((a, b) => {
            if (b.metrics.revenueClosed !== a.metrics.revenueClosed) {
                return b.metrics.revenueClosed - a.metrics.revenueClosed;
            }
            return b.metrics.activitiesCompleted - a.metrics.activitiesCompleted;
        });

        // Assign ranks
        leaderboard.forEach((entry, index) => {
            entry.rank = index + 1;
        });

        return leaderboard;
    }

    async getTeamLeaderboard(managerId: string, period?: { startDate: Date; endDate: Date }): Promise<LeaderboardEntry[]> {
        const teamMembers = await this.prisma.user.findMany({
            where: { managerId, isActive: true },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatar: true,
                role: true,
                branch: { select: { name: true } },
            },
        });

        const userIds = teamMembers.map(u => u.id);
        if (userIds.length === 0) return [];

        const dateFilter = period
            ? { createdAt: { gte: period.startDate, lte: period.endDate } }
            : undefined;

        const paymentDateFilter = period
            ? { paymentDate: { gte: period.startDate, lte: period.endDate } }
            : undefined;

        const [activitiesCompletedAgg, totalActivitiesAgg, leadsAssignedAgg, leadsConvertedAgg, revenueAgg] = await Promise.all([
            this.prisma.activity.groupBy({
                by: ['assigneeId'],
                where: {
                    assigneeId: { in: userIds },
                    status: ActivityStatus.COMPLETED,
                    ...(dateFilter ? dateFilter : {}),
                },
                _count: { _all: true },
            }),
            this.prisma.activity.groupBy({
                by: ['assigneeId'],
                where: {
                    assigneeId: { in: userIds },
                    ...(dateFilter ? dateFilter : {}),
                },
                _count: { _all: true },
            }),
            this.prisma.lead.groupBy({
                by: ['assigneeId'],
                where: {
                    assigneeId: { in: userIds },
                    ...(dateFilter ? dateFilter : {}),
                },
                _count: { _all: true },
            }),
            this.prisma.lead.groupBy({
                by: ['assigneeId'],
                where: {
                    assigneeId: { in: userIds },
                    status: LeadStatus.CLOSED_LEAD,
                    ...(dateFilter ? dateFilter : {}),
                },
                _count: { _all: true },
            }),
            this.prisma.payment.groupBy({
                by: ['createdById'],
                where: {
                    createdById: { in: userIds },
                    ...(paymentDateFilter ? paymentDateFilter : {}),
                },
                _sum: { totalAmount: true },
            }),
        ]);

        const toCountMap = (rows: Array<{ assigneeId: string | null; _count: { _all: number } }>) => {
            const map = new Map<string, number>();
            for (const r of rows) {
                if (r.assigneeId) map.set(r.assigneeId, r._count._all);
            }
            return map;
        };

        const toRevenueMap = (rows: Array<{ createdById: string | null; _sum: { totalAmount: number | null } }>) => {
            const map = new Map<string, number>();
            for (const r of rows) {
                if (r.createdById) map.set(r.createdById, r._sum.totalAmount || 0);
            }
            return map;
        };

        const activitiesCompletedMap = toCountMap(activitiesCompletedAgg as any);
        const totalActivitiesMap = toCountMap(totalActivitiesAgg as any);
        const leadsAssignedMap = toCountMap(leadsAssignedAgg as any);
        const leadsConvertedMap = toCountMap(leadsConvertedAgg as any);
        const revenueMap = toRevenueMap(revenueAgg as any);

        const leaderboard = teamMembers.map((user) => {
            const activitiesCompleted = activitiesCompletedMap.get(user.id) ?? 0;
            const totalActivities = totalActivitiesMap.get(user.id) ?? 0;
            const leadsAssigned = leadsAssignedMap.get(user.id) ?? 0;
            const leadsConverted = leadsConvertedMap.get(user.id) ?? 0;
            const revenueClosed = revenueMap.get(user.id) ?? 0;

            const metrics = {
                revenueClosed,
                activitiesCompleted,
                followUpCompletionRate:
                    totalActivities > 0 ? Math.round((activitiesCompleted / totalActivities) * 100) : 0,
                leadConversionRate:
                    leadsAssigned > 0 ? Math.round((leadsConverted / leadsAssigned) * 100) : 0,
                leadsConverted,
            };

            return {
                userId: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                avatar: user.avatar || undefined,
                role: user.role,
                branch: user.branch,
                metrics,
                rank: 0,
            };
        });

        leaderboard.sort((a, b) => {
            if (b.metrics.revenueClosed !== a.metrics.revenueClosed) {
                return b.metrics.revenueClosed - a.metrics.revenueClosed;
            }
            return b.metrics.activitiesCompleted - a.metrics.activitiesCompleted;
        });
        leaderboard.forEach((entry, index) => {
            entry.rank = index + 1;
        });

        return leaderboard;
    }

    async getSelfStats(userId: string, period?: { startDate: Date; endDate: Date }) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatar: true,
            },
        });

        if (!user) {
            return null;
        }

        const metrics = await this.calculateUserMetrics(userId, period);
        const globalRank = await this.getUserGlobalRank(userId, period);

        return {
            userId: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            avatar: user.avatar,
            metrics,
            globalRank,
        };
    }

    private async calculateUserMetrics(userId: string, period?: { startDate: Date; endDate: Date }) {
        const dateFilter = period ? {
            createdAt: { gte: period.startDate, lte: period.endDate },
        } : {};

        const paymentDateFilter = period ? {
            paymentDate: { gte: period.startDate, lte: period.endDate },
        } : {};

        // Activities completed
        const activitiesCompleted = await this.prisma.activity.count({
            where: {
                assigneeId: userId,
                status: ActivityStatus.COMPLETED,
                ...dateFilter,
            },
        });

        // Total scheduled activities
        const totalActivities = await this.prisma.activity.count({
            where: {
                assigneeId: userId,
                ...dateFilter,
            },
        });

        // Leads assigned
        const leadsAssigned = await this.prisma.lead.count({
            where: { assigneeId: userId, ...dateFilter },
        });

        // Leads converted (to closed)
        const leadsConverted = await this.prisma.lead.count({
            where: {
                assigneeId: userId,
                status: LeadStatus.CLOSED_LEAD,
                ...dateFilter,
            },
        });

        // Revenue from payments
        const revenueResult = await this.prisma.payment.aggregate({
            where: {
                createdById: userId,
                ...paymentDateFilter,
            },
            _sum: { totalAmount: true },
        });

        return {
            revenueClosed: revenueResult._sum.totalAmount || 0,
            activitiesCompleted,
            followUpCompletionRate: totalActivities > 0
                ? Math.round((activitiesCompleted / totalActivities) * 100)
                : 0,
            leadConversionRate: leadsAssigned > 0
                ? Math.round((leadsConverted / leadsAssigned) * 100)
                : 0,
            leadsConverted,
        };
    }

    private async getUserGlobalRank(userId: string, period?: { startDate: Date; endDate: Date }): Promise<number> {
        const leaderboard = await this.getGlobalLeaderboard(period);
        const userEntry = leaderboard.find(entry => entry.userId === userId);
        return userEntry?.rank || 0;
    }

    async getMonthlyStats(userId: string) {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        return this.getSelfStats(userId, { startDate: startOfMonth, endDate: endOfMonth });
    }
    async getManagersLeaderboard(period?: { startDate: Date; endDate: Date }) {
        const managers = await this.prisma.user.findMany({
            where: {
                role: Role.MANAGER,
                isActive: true,
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatar: true,
                role: true,
                branch: { select: { name: true } },
            },
        });

        const leaderboard = await Promise.all(
            managers.map(async (manager) => {
                // Get all team members
                const teamMembers = await this.prisma.user.findMany({
                    where: { managerId: manager.id },
                    select: { id: true },
                });
                const teamIds = teamMembers.map(m => m.id);

                if (teamIds.length === 0) {
                    return {
                        userId: manager.id,
                        firstName: manager.firstName,
                        lastName: manager.lastName,
                        email: manager.email,
                        avatar: manager.avatar,
                        role: manager.role,
                        branch: manager.branch,
                        metrics: {
                            revenueClosed: 0,
                            leadsConverted: 0,
                            teamSize: 0,
                        },
                        rank: 0,
                    };
                }

                // Calculate team metrics
                const dateFilter = period ? {
                    createdAt: { gte: period.startDate, lte: period.endDate },
                } : {};

                const paymentDateFilter = period ? {
                    paymentDate: { gte: period.startDate, lte: period.endDate },
                } : {};

                const [leadsConverted, revenueResult] = await Promise.all([
                    this.prisma.lead.count({
                        where: {
                            assigneeId: { in: teamIds },
                            status: LeadStatus.CLOSED_LEAD,
                            ...dateFilter,
                        },
                    }),
                    this.prisma.payment.aggregate({
                        where: {
                            createdById: { in: teamIds },
                            ...paymentDateFilter,
                        },
                        _sum: { totalAmount: true },
                    }),
                ]);

                return {
                    userId: manager.id,
                    firstName: manager.firstName,
                    lastName: manager.lastName,
                    email: manager.email,
                    avatar: manager.avatar,
                    role: manager.role,
                    branch: manager.branch,
                    metrics: {
                        revenueClosed: revenueResult._sum.totalAmount || 0,
                        leadsConverted,
                        teamSize: teamIds.length,
                    },
                    rank: 0,
                };
            })
        );

        // Sort by revenue closed, then by leads converted
        leaderboard.sort((a, b) => {
            if ((b.metrics as any).revenueClosed !== (a.metrics as any).revenueClosed) {
                return (b.metrics as any).revenueClosed - (a.metrics as any).revenueClosed;
            }
            return (b.metrics as any).leadsConverted - (a.metrics as any).leadsConverted;
        });

        // Assign ranks
        leaderboard.forEach((entry, index) => {
            entry.rank = index + 1;
        });

        return leaderboard;
    }
}
