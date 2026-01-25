import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Role, DealStage } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDealDto } from './dto/create-deal.dto';
import { UpdateDealDto } from './dto/update-deal.dto';

interface UserContext {
    id: string;
    role: Role;
    managerId?: string | null;
}

@Injectable()
export class DealsService {
    constructor(private prisma: PrismaService) { }

    async create(createDealDto: CreateDealDto, userId: string) {
        const data: any = {
            ...createDealDto,
            ownerId: userId,
        };
        if (createDealDto.expectedCloseDate) {
            data.expectedCloseDate = new Date(createDealDto.expectedCloseDate);
        }
        return this.prisma.deal.create({
            data,
            include: {
                owner: {
                    select: { id: true, firstName: true, lastName: true, email: true },
                },
                customer: {
                    select: { id: true, firstName: true, lastName: true, company: true },
                },
                lead: {
                    select: { id: true, firstName: true, lastName: true, company: true },
                },
            },
        });
    }

    async createFromLead(leadId: string, dealData: CreateDealDto, userId: string) {
        const lead = await this.prisma.lead.findUnique({ where: { id: leadId } });

        if (!lead) {
            throw new NotFoundException('Lead not found');
        }

        const data: any = {
            ...dealData,
            leadId,
            ownerId: userId,
        };
        if (dealData.expectedCloseDate) {
            data.expectedCloseDate = new Date(dealData.expectedCloseDate);
        }

        return this.prisma.deal.create({
            data,
            include: {
                owner: {
                    select: { id: true, firstName: true, lastName: true, email: true },
                },
                lead: {
                    select: { id: true, firstName: true, lastName: true, company: true },
                },
            },
        });
    }

    async findAll(user: UserContext, filters?: {
        stage?: DealStage;
        ownerId?: string;
        customerId?: string;
        search?: string;
    }) {
        let where: any = {};

        if (user.role === Role.EMPLOYEE) {
            where.ownerId = user.id;
        } else if (user.role === Role.MANAGER) {
            const teamMembers = await this.prisma.user.findMany({
                where: { managerId: user.id },
                select: { id: true },
            });
            const teamIds = teamMembers.map(m => m.id);
            where.ownerId = { in: [user.id, ...teamIds] };
        }

        if (filters?.stage) {
            where.stage = filters.stage;
        }
        if (filters?.ownerId && user.role !== Role.EMPLOYEE) {
            where.ownerId = filters.ownerId;
        }
        if (filters?.customerId) {
            where.customerId = filters.customerId;
        }
        if (filters?.search) {
            where.title = { contains: filters.search, mode: 'insensitive' };
        }

        return this.prisma.deal.findMany({
            where,
            include: {
                owner: {
                    select: { id: true, firstName: true, lastName: true, email: true },
                },
                customer: {
                    select: { id: true, firstName: true, lastName: true, company: true },
                },
                lead: {
                    select: { id: true, firstName: true, lastName: true, company: true },
                },
                _count: {
                    select: { activities: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: string, user: UserContext) {
        const deal = await this.prisma.deal.findUnique({
            where: { id },
            include: {
                owner: {
                    select: { id: true, firstName: true, lastName: true, email: true, phone: true },
                },
                customer: {
                    select: { id: true, firstName: true, lastName: true, email: true, company: true },
                },
                lead: {
                    select: { id: true, firstName: true, lastName: true, email: true, company: true },
                },
                activities: {
                    orderBy: { scheduledAt: 'desc' },
                    take: 10,
                },
                notes: {
                    orderBy: { createdAt: 'desc' },
                },
                attachments: {
                    orderBy: { createdAt: 'desc' },
                },
                invoices: {
                    orderBy: { createdAt: 'desc' },
                },
            },
        });

        if (!deal) {
            throw new NotFoundException('Deal not found');
        }

        if (user.role === Role.EMPLOYEE && deal.ownerId !== user.id) {
            throw new ForbiddenException('You do not have access to this deal');
        }

        return deal;
    }

    async update(id: string, updateDealDto: UpdateDealDto, user: UserContext) {
        const deal = await this.prisma.deal.findUnique({ where: { id } });

        if (!deal) {
            throw new NotFoundException('Deal not found');
        }

        if (user.role === Role.EMPLOYEE && deal.ownerId !== user.id) {
            throw new ForbiddenException('You do not have access to update this deal');
        }

        // If closing the deal, set actual close date
        const data: any = { ...updateDealDto };
        if (updateDealDto.expectedCloseDate) {
            data.expectedCloseDate = new Date(updateDealDto.expectedCloseDate);
        }
        if (updateDealDto.stage === DealStage.CLOSED_WON || updateDealDto.stage === DealStage.CLOSED_LOST) {
            data.actualCloseDate = new Date();
        }

        return this.prisma.deal.update({
            where: { id },
            data,
            include: {
                owner: {
                    select: { id: true, firstName: true, lastName: true, email: true },
                },
                customer: {
                    select: { id: true, firstName: true, lastName: true, company: true },
                },
            },
        });
    }

    async delete(id: string, user: UserContext) {
        const deal = await this.prisma.deal.findUnique({ where: { id } });

        if (!deal) {
            throw new NotFoundException('Deal not found');
        }

        if (user.role === Role.EMPLOYEE) {
            throw new ForbiddenException('Employees cannot delete deals');
        }

        await this.prisma.deal.delete({ where: { id } });
        return { message: 'Deal deleted successfully' };
    }

    async updateStage(id: string, stage: DealStage, user: UserContext) {
        const deal = await this.prisma.deal.findUnique({ where: { id } });

        if (!deal) {
            throw new NotFoundException('Deal not found');
        }

        if (user.role === Role.EMPLOYEE && deal.ownerId !== user.id) {
            throw new ForbiddenException('You cannot update stage of this deal');
        }

        const data: any = { stage };
        if (stage === DealStage.CLOSED_WON || stage === DealStage.CLOSED_LOST) {
            data.actualCloseDate = new Date();
        }

        // Update probability based on stage
        const probabilityMap: Record<DealStage, number> = {
            [DealStage.QUALIFICATION]: 10,
            [DealStage.NEEDS_ANALYSIS]: 25,
            [DealStage.PROPOSAL]: 50,
            [DealStage.NEGOTIATION]: 75,
            [DealStage.CLOSED_WON]: 100,
            [DealStage.CLOSED_LOST]: 0,
        };
        data.probability = probabilityMap[stage];

        return this.prisma.deal.update({
            where: { id },
            data,
        });
    }

    async getDealStats(user: UserContext) {
        let where: any = {};

        if (user.role === Role.EMPLOYEE) {
            where.ownerId = user.id;
        } else if (user.role === Role.MANAGER) {
            const teamMembers = await this.prisma.user.findMany({
                where: { managerId: user.id },
                select: { id: true },
            });
            const teamIds = teamMembers.map(m => m.id);
            where.ownerId = { in: [user.id, ...teamIds] };
        }

        const [total, byStage, totalValue, wonDeals] = await Promise.all([
            this.prisma.deal.count({ where }),
            this.prisma.deal.groupBy({
                by: ['stage'],
                where,
                _count: true,
                _sum: { value: true },
            }),
            this.prisma.deal.aggregate({
                where,
                _sum: { value: true },
            }),
            this.prisma.deal.aggregate({
                where: { ...where, stage: DealStage.CLOSED_WON },
                _sum: { value: true },
                _count: true,
            }),
        ]);

        return {
            total,
            totalValue: totalValue._sum.value || 0,
            wonDeals: wonDeals._count,
            wonValue: wonDeals._sum.value || 0,
            byStage: byStage.reduce((acc, item) => {
                acc[item.stage] = {
                    count: item._count,
                    value: item._sum.value || 0,
                };
                return acc;
            }, {} as Record<DealStage, { count: number; value: number }>),
        };
    }

    async getPipelineView(user: UserContext) {
        let where: any = {};

        if (user.role === Role.EMPLOYEE) {
            where.ownerId = user.id;
        } else if (user.role === Role.MANAGER) {
            const teamMembers = await this.prisma.user.findMany({
                where: { managerId: user.id },
                select: { id: true },
            });
            const teamIds = teamMembers.map(m => m.id);
            where.ownerId = { in: [user.id, ...teamIds] };
        }

        const stages = Object.values(DealStage);
        const pipeline: Record<DealStage, any[]> = {} as any;

        for (const stage of stages) {
            pipeline[stage] = await this.prisma.deal.findMany({
                where: { ...where, stage },
                include: {
                    owner: {
                        select: { id: true, firstName: true, lastName: true },
                    },
                    customer: {
                        select: { id: true, firstName: true, lastName: true, company: true },
                    },
                },
                orderBy: { updatedAt: 'desc' },
            });
        }

        return pipeline;
    }
}
