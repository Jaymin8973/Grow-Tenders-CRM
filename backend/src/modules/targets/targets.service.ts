
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TargetsService {
    constructor(private prisma: PrismaService) { }

    async setTarget(userId: string, amount: number, month: Date) {
        // Ensure month is set to the first day
        const firstDayOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);

        return this.prisma.target.upsert({
            where: {
                userId_month: {
                    userId,
                    month: firstDayOfMonth,
                },
            },
            update: {
                amount,
            },
            create: {
                userId,
                amount,
                month: firstDayOfMonth,
            },
        });
    }

    async getEmployeeStats(userId: string, month: Date) {
        const firstDayOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
        const lastDayOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);

        // 1. Get Target
        const target = await this.prisma.target.findUnique({
            where: {
                userId_month: {
                    userId,
                    month: firstDayOfMonth,
                },
            },
        });

        const targetAmount = target?.amount || 0;

        // 2. Calculate Achieved (Sum of Payments created by this user in this month)
        // Note: Adjust logic if payments are attributed differently (e.g. by Lead assignee)
        // Assuming 'createdById' tracks the employee who closed the deal/collected payment
        const payments = await this.prisma.payment.aggregate({
            where: {
                createdById: userId,
                paymentDate: {
                    gte: firstDayOfMonth,
                    lte: lastDayOfMonth,
                },
            },
            _sum: {
                amount: true,
            },
        });

        const achievedAmount = payments._sum.amount || 0;
        const pendingAmount = Math.max(0, targetAmount - achievedAmount);
        const percentage = targetAmount > 0 ? (achievedAmount / targetAmount) * 100 : 0;

        return {
            target: targetAmount,
            achieved: achievedAmount,
            pending: pendingAmount,
            percentage: parseFloat(percentage.toFixed(2)),
            month: firstDayOfMonth,
        };
    }

    async findAll(month: Date) {
        const firstDayOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);

        const targets = await this.prisma.target.findMany({
            where: {
                month: firstDayOfMonth,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        role: true,
                        avatar: true,
                    }
                }
            }
        });

        // Enrich with achieved stats
        // This might be N+1 but for a small team it's fine. 
        // Better: Aggregate all payments for the month grouped by userId.

        const enrichedTargets = await Promise.all(targets.map(async (t: any) => {
            const stats = await this.getEmployeeStats(t.userId, month);
            return {
                ...t,
                achieved: stats.achieved,
                percentage: stats.percentage
            };
        }));

        return enrichedTargets;
    }
}
