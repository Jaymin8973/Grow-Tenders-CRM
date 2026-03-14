
import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TargetsService {
    constructor(private prisma: PrismaService) { }

    /**
     * Set target for a user (Super Admin assigns to Managers, Managers assign to team)
     * @param userId - The user receiving the target
     * @param amount - Target amount
     * @param month - Month for the target
     * @param assignedById - ID of the user assigning the target
     * @param parentTargetId - Optional parent target ID (for team member targets)
     */
    async setTarget(userId: string, amount: number, month: Date, assignedById?: string, parentTargetId?: string, assignedByRole?: string) {
        // Ensure month is set to the first day
        const firstDayOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);

        // Get the user being assigned the target
        const targetUser = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { manager: true },
        });

        if (!targetUser) {
            throw new BadRequestException('User not found');
        }

        // Enforce hierarchy rules
        if (assignedByRole === 'SUPER_ADMIN') {
            if (targetUser.role !== 'MANAGER') {
                throw new ForbiddenException('Super Admin can assign targets only to Managers');
            }
            if (parentTargetId) {
                throw new BadRequestException('Parent target should not be provided when assigning to a Manager');
            }
        }

        if (assignedByRole === 'MANAGER') {
            if (targetUser.role !== 'EMPLOYEE') {
                throw new ForbiddenException('Manager can assign targets only to Employees');
            }
            if (targetUser.managerId !== assignedById) {
                throw new ForbiddenException('Manager can assign targets only to their own team members');
            }
            if (!parentTargetId) {
                throw new BadRequestException('parentTargetId is required when Manager assigns target to Employee');
            }

            // Ensure parentTarget belongs to this manager and month
            const parentTargetForMonth = await this.prisma.target.findFirst({
                where: {
                    id: parentTargetId,
                    userId: assignedById,
                    month: firstDayOfMonth,
                },
            });

            if (!parentTargetForMonth) {
                throw new ForbiddenException('Invalid parent target for this manager/month');
            }
        }

        // If parentTargetId is provided, validate allocation
        if (parentTargetId) {
            const parentTarget = await this.prisma.target.findUnique({
                where: { id: parentTargetId },
            });

            if (!parentTarget) {
                throw new BadRequestException('Parent target not found');
            }

            // Check if there's enough remaining amount
            const newRemaining = parentTarget.remainingAmount - amount;
            if (newRemaining < 0) {
                throw new BadRequestException(
                    `Insufficient remaining target. Available: ₹${parentTarget.remainingAmount.toLocaleString('en-IN')}`
                );
            }

            // Update parent's allocation tracking
            await this.prisma.target.update({
                where: { id: parentTargetId },
                data: {
                    allocatedAmount: parentTarget.allocatedAmount + amount,
                    remainingAmount: newRemaining,
                },
            });
        }

        const target = await this.prisma.target.upsert({
            where: {
                userId_month: {
                    userId,
                    month: firstDayOfMonth,
                },
            },
            update: {
                amount,
                parentTargetId,
                remainingAmount: amount, // Reset remaining for this target
            },
            create: {
                userId,
                amount,
                month: firstDayOfMonth,
                parentTargetId,
                remainingAmount: amount,
            },
        });

        // Add Notification
        await this.prisma.notification.create({
            data: {
                userId,
                type: 'TARGET_ASSIGNED',
                title: 'New Target Assigned',
                message: `Your target for ${firstDayOfMonth.toLocaleString('default', { month: 'long', year: 'numeric' })} has been set to ₹${amount.toLocaleString('en-IN')}`,
                link: '/dashboard',
            }
        });

        return target;
    }

    async getEmployeeStats(userId: string, month: Date) {
        const firstDayOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
        const lastDayOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);

        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, role: true },
        });

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
        const createdByIds = [userId];
        if (user?.role === 'MANAGER') {
            const teamMembers = await this.prisma.user.findMany({
                where: { managerId: userId },
                select: { id: true },
            });
            createdByIds.push(...teamMembers.map((m) => m.id));
        }

        const payments = await this.prisma.payment.aggregate({
            where: {
                createdById: { in: createdByIds },
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

    async findAll(month: Date, userId?: string, role?: string) {
        const firstDayOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);

        const where: any = {
            month: firstDayOfMonth,
        };

        // Manager should only see their own target + their team's targets
        if (role === 'MANAGER' && userId) {
            const teamMembers = await this.prisma.user.findMany({
                where: { managerId: userId },
                select: { id: true },
            });
            const allowedUserIds = [userId, ...teamMembers.map((m: { id: string }) => m.id)];
            where.userId = { in: allowedUserIds };
        }

        const targets = await this.prisma.target.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        role: true,
                        avatar: true,
                        showEmail: true,
                        email: true,
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

        return enrichedTargets.map((t: any) => {
            if (role !== 'SUPER_ADMIN' && t.user?.showEmail === false) {
                return { ...t, user: { ...t.user, email: undefined } };
            }
            return t;
        });
    }

    /**
     * Get a user's target for a specific month
     */
    async getUserTarget(userId: string, month: Date) {
        const firstDayOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
        
        const target = await this.prisma.target.findUnique({
            where: {
                userId_month: {
                    userId,
                    month: firstDayOfMonth,
                },
            },
            include: {
                parentTarget: {
                    include: {
                        user: {
                            select: { id: true, firstName: true, lastName: true, role: true }
                        }
                    }
                },
                childTargets: {
                    include: {
                        user: {
                            select: { id: true, firstName: true, lastName: true, role: true }
                        }
                    }
                },
            },
        });

        if (!target) {
            return null;
        }

        const stats = await this.getEmployeeStats(userId, month);
        
        return {
            ...target,
            achieved: stats.achieved,
            percentage: stats.percentage,
        };
    }

    /**
     * Get manager's target with team allocation details
     */
    async getManagerAllocation(managerId: string, month: Date, requesterRole?: string) {
        const firstDayOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);

        // Get manager's target
        const managerTarget = await this.prisma.target.findUnique({
            where: {
                userId_month: {
                    userId: managerId,
                    month: firstDayOfMonth,
                },
            },
            include: {
                childTargets: {
                    include: {
                        user: {
                            select: { id: true, firstName: true, lastName: true, role: true }
                        }
                    }
                }
            }
        });

        if (!managerTarget) {
            return {
                hasTarget: false,
                message: 'No target assigned for this month',
            };
        }

        // Get team members
        const teamMembers = await this.prisma.user.findMany({
            where: { managerId },
            select: { id: true, firstName: true, lastName: true, role: true, email: true, showEmail: true }
        });

        // Get each team member's stats
        const teamStats = await Promise.all(
            teamMembers.map(async (member: { id: string; firstName: string; lastName: string; role: string }) => {
                const stats = await this.getEmployeeStats(member.id, month);
                const memberTarget = await this.prisma.target.findUnique({
                    where: {
                        userId_month: {
                            userId: member.id,
                            month: firstDayOfMonth,
                        }
                    }
                });
                return {
                    ...member,
                    target: memberTarget?.amount || 0,
                    achieved: stats.achieved,
                    percentage: stats.percentage,
                    hasTarget: !!memberTarget,
                };
            })
        );

        const maskedTeamStats = teamStats.map((m: any) => {
            if (requesterRole !== 'SUPER_ADMIN' && m.showEmail === false) {
                return { ...m, email: undefined };
            }
            return m;
        });

        return {
            hasTarget: true,
            managerTarget: {
                id: managerTarget.id,
                total: managerTarget.amount,
                allocated: managerTarget.allocatedAmount,
                remaining: managerTarget.remainingAmount,
                achieved: (await this.getEmployeeStats(managerId, month)).achieved,
            },
            teamMembers: maskedTeamStats,
            allocatedTargets: managerTarget.childTargets,
        };
    }

    /**
     * Get team members for a manager (for target assignment)
     */
    async getTeamMembers(managerId: string) {
        const teamMembers = await this.prisma.user.findMany({
            where: { 
                managerId,
                isActive: true,
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
            }
        });

        return teamMembers;
    }

    /**
     * Update target amount
     */
    async updateTarget(targetId: string, newAmount: number, userId: string, role: string) {
        const target = await this.prisma.target.findUnique({
            where: { id: targetId },
            include: { parentTarget: true }
        });

        if (!target) {
            throw new BadRequestException('Target not found');
        }

        // If this target has a parent, we need to adjust the parent's allocation
        if (target.parentTargetId && target.parentTarget) {
            const parent = target.parentTarget;
            const amountDiff = newAmount - target.amount;
            
            // Check if parent has enough remaining for the increase
            if (amountDiff > 0 && parent.remainingAmount < amountDiff) {
                throw new BadRequestException(
                    `Insufficient remaining target in parent. Available: ₹${parent.remainingAmount.toLocaleString('en-IN')}`
                );
            }

            // Update parent's allocation
            await this.prisma.target.update({
                where: { id: parent.id },
                data: {
                    allocatedAmount: parent.allocatedAmount + amountDiff,
                    remainingAmount: parent.remainingAmount - amountDiff,
                }
            });
        }

        const updated = await this.prisma.target.update({
            where: { id: targetId },
            data: {
                amount: newAmount,
                remainingAmount: newAmount, // Reset remaining for this target
            }
        });

        return updated;
    }

    /**
     * Delete target (only if no child targets)
     */
    async deleteTarget(targetId: string) {
        const target = await this.prisma.target.findUnique({
            where: { id: targetId },
            include: { childTargets: true }
        });

        if (!target) {
            throw new BadRequestException('Target not found');
        }

        if (target.childTargets.length > 0) {
            throw new BadRequestException(
                'Cannot delete target with allocated child targets. Delete child targets first.'
            );
        }

        // If this target has a parent, restore the allocation to parent
        if (target.parentTargetId) {
            const parent = await this.prisma.target.findUnique({
                where: { id: target.parentTargetId }
            });

            if (parent) {
                await this.prisma.target.update({
                    where: { id: parent.id },
                    data: {
                        allocatedAmount: parent.allocatedAmount - target.amount,
                        remainingAmount: parent.remainingAmount + target.amount,
                    }
                });
            }
        }

        await this.prisma.target.delete({
            where: { id: targetId }
        });

        return { message: 'Target deleted successfully' };
    }
}
