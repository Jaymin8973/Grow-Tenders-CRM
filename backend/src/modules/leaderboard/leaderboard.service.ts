import { Injectable } from '@nestjs/common';
import { Role, DealStage, ActivityStatus, LeadStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

interface UserContext {
    id: string;
    role: Role;
    managerId?: string | null;
}

export interface LeaderboardEntry {
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
    metrics: {
        revenueClosed: number;
        dealsWon: number;
        activitiesCompleted: number;
        followUpCompletionRate: number;
        leadConversionRate: number;
    };
    rank: number;
}

@Injectable()
export class LeaderboardService {
    constructor(private prisma: PrismaService) { }

    async getGlobalLeaderboard(period?: { startDate: Date; endDate: Date }): Promise<LeaderboardEntry[]> {
        const users = await this.prisma.user.findMany({
            where: { isActive: true, role: { not: Role.SUPER_ADMIN } },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatar: true,
            },
        });

        const leaderboard = await Promise.all(
            users.map(async (user) => {
                const metrics = await this.calculateUserMetrics(user.id, period);
                return {
                    userId: user.id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    avatar: user.avatar || undefined,
                    metrics,
                    rank: 0,
                };
            }),
        );

        // Sort by revenue closed, then by deals won
        leaderboard.sort((a, b) => {
            if (b.metrics.revenueClosed !== a.metrics.revenueClosed) {
                return b.metrics.revenueClosed - a.metrics.revenueClosed;
            }
            return b.metrics.dealsWon - a.metrics.dealsWon;
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
            },
        });

        const leaderboard = await Promise.all(
            teamMembers.map(async (user) => {
                const metrics = await this.calculateUserMetrics(user.id, period);
                return {
                    userId: user.id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    avatar: user.avatar || undefined,
                    metrics,
                    rank: 0,
                };
            }),
        );

        leaderboard.sort((a, b) => b.metrics.revenueClosed - a.metrics.revenueClosed);
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
        const globalRank = await this.getUserGlobalRank(userId);

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

        // Revenue closed (from won deals)
        const wonDeals = await this.prisma.deal.aggregate({
            where: {
                ownerId: userId,
                stage: DealStage.CLOSED_WON,
                ...dateFilter,
            },
            _sum: { value: true },
            _count: true,
        });

        // Total deals by user
        const totalDeals = await this.prisma.deal.count({
            where: { ownerId: userId, ...dateFilter },
        });

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

        // Leads converted (to won)
        const leadsConverted = await this.prisma.lead.count({
            where: {
                assigneeId: userId,
                status: LeadStatus.WON,
                ...dateFilter,
            },
        });

        return {
            revenueClosed: wonDeals._sum.value || 0,
            dealsWon: wonDeals._count,
            activitiesCompleted,
            followUpCompletionRate: totalActivities > 0
                ? Math.round((activitiesCompleted / totalActivities) * 100)
                : 0,
            leadConversionRate: leadsAssigned > 0
                ? Math.round((leadsConverted / leadsAssigned) * 100)
                : 0,
        };
    }

    private async getUserGlobalRank(userId: string): Promise<number> {
        const leaderboard = await this.getGlobalLeaderboard();
        const userEntry = leaderboard.find(entry => entry.userId === userId);
        return userEntry?.rank || 0;
    }

    async getMonthlyStats(userId: string) {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        return this.getSelfStats(userId, { startDate: startOfMonth, endDate: endOfMonth });
    }
}
