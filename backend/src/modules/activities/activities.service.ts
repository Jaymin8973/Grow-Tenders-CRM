import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { Role, ActivityStatus, ActivityType, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';

interface UserContext {
    id: string;
    role: Role;
    managerId?: string | null;
}

@Injectable()
export class ActivitiesService {
    private readonly logger = new Logger(ActivitiesService.name);

    constructor(private prisma: PrismaService) { }

    private getSortByOrDefault(sortBy?: string) {
        const allowed: Array<keyof Prisma.ActivityOrderByWithRelationInput> = [
            'scheduledAt',
            'createdAt',
            'updatedAt',
            'title',
            'status',
            'type',
        ];

        if (!sortBy) return 'scheduledAt' as const;
        if (allowed.includes(sortBy as any)) return sortBy as any;
        return 'scheduledAt' as const;
    }

    async create(createActivityDto: CreateActivityDto, userId: string) {
        const assigneeId = createActivityDto.assigneeId || userId;

        if (assigneeId) {
            const assignee = await this.prisma.user.findUnique({ where: { id: assigneeId } });
            if (!assignee) {
                throw new BadRequestException('Assignee not found');
            }
        }

        const activity = await this.prisma.activity.create({
            data: {
                ...createActivityDto,
                createdById: userId,
                assigneeId,
                scheduledAt: new Date(createActivityDto.scheduledAt),
            },
            include: {
                assignee: {
                    select: { id: true, firstName: true, lastName: true, email: true },
                },
                createdBy: {
                    select: { id: true, firstName: true, lastName: true },
                },
                lead: {
                    select: { id: true, firstName: true, lastName: true, company: true },
                },
                customer: {
                    select: { id: true, firstName: true, lastName: true, company: true },
                },

            },
        });

        // Create notification for the assignee if it's not the creator
        if (assigneeId !== userId) {
            await this.prisma.notification.create({
                data: {
                    userId: assigneeId,
                    title: 'New Task Assigned',
                    message: `You have been assigned a new task: ${createActivityDto.title}`,
                    type: 'ACTIVITY_REMINDER',
                    link: `/tasks`,
                },
            });
        }

        return activity;
    }

    async findAll(user: UserContext, filters?: {
        type?: ActivityType;
        status?: ActivityStatus;
        assigneeId?: string;
        search?: string;
        startDate?: Date;
        endDate?: Date;
        page?: number;
        pageSize?: number;
        cursor?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    }) {
        let where: any = {};

        if (user.role === Role.EMPLOYEE) {
            where.assigneeId = user.id;
        } else if (user.role === Role.MANAGER) {
            const teamMembers = await this.prisma.user.findMany({
                where: { managerId: user.id },
                select: { id: true },
            });
            const teamIds = teamMembers.map(m => m.id);
            where.assigneeId = { in: [user.id, ...teamIds] };
        }

        if (filters?.type) {
            where.type = filters.type;
        }
        if (filters?.status) {
            where.status = filters.status;
        }
        if (filters?.assigneeId && user.role !== Role.EMPLOYEE) {
            where.assigneeId = filters.assigneeId;
        }
        if (filters?.search) {
            where.OR = [
                { title: { contains: filters.search, mode: 'insensitive' } },
                { description: { contains: filters.search, mode: 'insensitive' } },
            ];
        }
        if (filters?.startDate && filters?.endDate) {
            where.scheduledAt = {
                gte: filters.startDate,
                lte: filters.endDate,
            };
        }

        const pageSize = Math.min(Math.max(filters?.pageSize ?? 25, 1), 100);
        const sortBy = this.getSortByOrDefault(filters?.sortBy);
        const sortOrder: 'asc' | 'desc' = filters?.sortOrder ?? 'asc';

        // prefer cursor pagination when provided
        const cursor = filters?.cursor;
        if (cursor) {
            const [total, items] = await Promise.all([
                this.prisma.activity.count({ where }),
                this.prisma.activity.findMany({
                    where,
                    take: pageSize + 1,
                    skip: 1,
                    cursor: { id: cursor },
                    include: {
                        assignee: { select: { id: true, firstName: true, lastName: true, email: true } },
                        lead: { select: { id: true, firstName: true, lastName: true, company: true } },
                        customer: { select: { id: true, firstName: true, lastName: true, company: true } },
                    },
                    orderBy: { [sortBy]: sortOrder },
                }),
            ]);

            const hasNext = items.length > pageSize;
            const sliced = hasNext ? items.slice(0, pageSize) : items;
            const nextCursor = hasNext ? sliced[sliced.length - 1]?.id : null;

            return {
                items: sliced,
                total,
                page: null,
                pageSize,
                nextCursor,
                sortBy,
                sortOrder,
            };
        }

        const page = Math.max(filters?.page ?? 1, 1);
        const skip = (page - 1) * pageSize;

        const [total, items] = await Promise.all([
            this.prisma.activity.count({ where }),
            this.prisma.activity.findMany({
                where,
                skip,
                take: pageSize,
                include: {
                    assignee: { select: { id: true, firstName: true, lastName: true, email: true } },
                    lead: { select: { id: true, firstName: true, lastName: true, company: true } },
                    customer: { select: { id: true, firstName: true, lastName: true, company: true } },
                },
                orderBy: { [sortBy]: sortOrder },
            }),
        ]);

        return {
            items,
            total,
            page,
            pageSize,
            nextCursor: null,
            sortBy,
            sortOrder,
        };
    }

    async findToday(user: UserContext) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        let where: any = {
            scheduledAt: {
                gte: today,
                lt: tomorrow,
            },
        };

        if (user.role === Role.EMPLOYEE) {
            where.assigneeId = user.id;
        } else if (user.role === Role.MANAGER) {
            const teamMembers = await this.prisma.user.findMany({
                where: { managerId: user.id },
                select: { id: true },
            });
            const teamIds = teamMembers.map(m => m.id);
            where.assigneeId = { in: [user.id, ...teamIds] };
        }

        return this.prisma.activity.findMany({
            where,
            include: {
                assignee: {
                    select: { id: true, firstName: true, lastName: true },
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
    }

    async findOverdue(user: UserContext) {
        const now = new Date();

        let where: any = {
            scheduledAt: { lt: now },
            status: { in: [ActivityStatus.SCHEDULED] },
        };

        if (user.role === Role.EMPLOYEE) {
            where.assigneeId = user.id;
        } else if (user.role === Role.MANAGER) {
            const teamMembers = await this.prisma.user.findMany({
                where: { managerId: user.id },
                select: { id: true },
            });
            const teamIds = teamMembers.map(m => m.id);
            where.assigneeId = { in: [user.id, ...teamIds] };
        }

        // Update overdue activities
        await this.prisma.activity.updateMany({
            where,
            data: { status: ActivityStatus.OVERDUE },
        });

        return this.prisma.activity.findMany({
            where: { ...where, status: ActivityStatus.OVERDUE },
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
    }

    async findOne(id: string, user: UserContext) {
        const activity = await this.prisma.activity.findUnique({
            where: { id },
            include: {
                assignee: {
                    select: { id: true, firstName: true, lastName: true, email: true, phone: true },
                },
                createdBy: {
                    select: { id: true, firstName: true, lastName: true },
                },
                lead: {
                    select: { id: true, firstName: true, lastName: true, email: true, company: true },
                },
                customer: {
                    select: { id: true, firstName: true, lastName: true, email: true, company: true },
                },

            },
        });

        if (!activity) {
            throw new NotFoundException('Activity not found');
        }

        if (user.role === Role.EMPLOYEE && activity.assigneeId !== user.id) {
            throw new ForbiddenException('You do not have access to this activity');
        }

        return activity;
    }

    async update(id: string, updateActivityDto: UpdateActivityDto, user: UserContext) {
        const activity = await this.prisma.activity.findUnique({ where: { id } });

        if (!activity) {
            throw new NotFoundException('Activity not found');
        }

        if (user.role === Role.EMPLOYEE && activity.assigneeId !== user.id) {
            throw new ForbiddenException('You do not have access to update this activity');
        }

        const data: any = { ...updateActivityDto };
        if (updateActivityDto.assigneeId) {
            const assignee = await this.prisma.user.findUnique({ where: { id: updateActivityDto.assigneeId } });
            if (!assignee) {
                throw new BadRequestException('Assignee not found');
            }
        }
        if (updateActivityDto.scheduledAt) {
            data.scheduledAt = new Date(updateActivityDto.scheduledAt);
        }

        return this.prisma.activity.update({
            where: { id },
            data,
            include: {
                assignee: {
                    select: { id: true, firstName: true, lastName: true, email: true },
                },
            },
        });
    }

    async markComplete(id: string, outcome: string, user: UserContext) {
        const activity = await this.prisma.activity.findUnique({ where: { id } });

        if (!activity) {
            throw new NotFoundException('Activity not found');
        }

        if (user.role === Role.EMPLOYEE && activity.assigneeId !== user.id) {
            throw new ForbiddenException('You cannot complete this activity');
        }

        return this.prisma.activity.update({
            where: { id },
            data: {
                status: ActivityStatus.COMPLETED,
                completedAt: new Date(),
                outcome,
            },
        });
    }

    async reschedule(id: string, newDate: Date, user: UserContext) {
        const activity = await this.prisma.activity.findUnique({ where: { id } });

        if (!activity) {
            throw new NotFoundException('Activity not found');
        }

        if (user.role === Role.EMPLOYEE && activity.assigneeId !== user.id) {
            throw new ForbiddenException('You cannot reschedule this activity');
        }

        return this.prisma.activity.update({
            where: { id },
            data: {
                scheduledAt: newDate,
                status: ActivityStatus.SCHEDULED,
            },
        });
    }

    async cancel(id: string, user: UserContext) {
        const activity = await this.prisma.activity.findUnique({ where: { id } });

        if (!activity) {
            throw new NotFoundException('Activity not found');
        }

        return this.prisma.activity.update({
            where: { id },
            data: { status: ActivityStatus.CANCELLED },
        });
    }

    async delete(id: string, user: UserContext) {
        const activity = await this.prisma.activity.findUnique({ where: { id } });

        if (!activity) {
            throw new NotFoundException('Activity not found');
        }

        if (user.role === Role.EMPLOYEE && activity.assigneeId !== user.id) {
            throw new ForbiddenException('You cannot delete this activity');
        }

        await this.prisma.activity.delete({ where: { id } });
        return { message: 'Activity deleted successfully' };
    }

    async getActivityStats(user: UserContext) {
        let where: any = {};

        if (user.role === Role.EMPLOYEE) {
            where.assigneeId = user.id;
        } else if (user.role === Role.MANAGER) {
            const teamMembers = await this.prisma.user.findMany({
                where: { managerId: user.id },
                select: { id: true },
            });
            const teamIds = teamMembers.map(m => m.id);
            where.assigneeId = { in: [user.id, ...teamIds] };
        }

        const [total, byStatus, byType, completedThisMonth] = await Promise.all([
            this.prisma.activity.count({ where }),
            this.prisma.activity.groupBy({
                by: ['status'],
                where,
                _count: true,
            }),
            this.prisma.activity.groupBy({
                by: ['type'],
                where,
                _count: true,
            }),
            this.prisma.activity.count({
                where: {
                    ...where,
                    status: ActivityStatus.COMPLETED,
                    completedAt: {
                        gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                    },
                },
            }),
        ]);

        return {
            total,
            completedThisMonth,
            byStatus: byStatus.reduce((acc, item) => {
                acc[item.status] = item._count;
                return acc;
            }, {} as Record<ActivityStatus, number>),
            byType: byType.reduce((acc, item) => {
                acc[item.type] = item._count;
                return acc;
            }, {} as Record<ActivityType, number>),
        };
    }
}
