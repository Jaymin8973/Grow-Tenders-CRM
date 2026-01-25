import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Role, LeadStatus, LeadSource, Prisma, LeadType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';

interface UserContext {
    id: string;
    role: Role;
    managerId?: string | null;
}

@Injectable()
export class LeadsService {
    constructor(private prisma: PrismaService) { }

    async create(createLeadDto: CreateLeadDto, userId: string) {
        return this.prisma.lead.create({
            data: {
                ...createLeadDto,
                title: createLeadDto.title || `${createLeadDto.firstName} ${createLeadDto.lastName}`,
                notes: createLeadDto.notes ? {
                    create: { 
                        content: createLeadDto.notes,
                        createdById: userId,
                    }
                } : undefined,
                createdById: userId,
                assigneeId: createLeadDto.assigneeId || userId,
            },
            include: {
                assignee: {
                    select: { id: true, firstName: true, lastName: true, email: true },
                },
                createdBy: {
                    select: { id: true, firstName: true, lastName: true },
                },
            },
        });
    }

    async findAll(user: UserContext, filters?: {
        status?: LeadStatus;
        source?: LeadSource;
        assigneeId?: string;
        search?: string;
    }) {
        let where: any = {};

        // Role-based filtering
        if (user.role === Role.MANAGER) {
            // Manager can see their own leads and their team's leads
            const teamMembers = await this.prisma.user.findMany({
                where: { managerId: user.id },
                select: { id: true },
            });
            const teamIds = teamMembers.map(m => m.id);
            where.assigneeId = { in: [user.id, ...teamIds] };
        }
        // SUPER_ADMIN sees all

        // Apply filters
        if (filters?.status) {
            where.status = filters.status;
        }
        if (filters?.source) {
            where.source = filters.source;
        }
        if (filters?.assigneeId && user.role !== Role.EMPLOYEE) {
            where.assigneeId = filters.assigneeId;
        }
        if (filters?.search) {
            where.OR = [
                { firstName: { contains: filters.search, mode: 'insensitive' } },
                { lastName: { contains: filters.search, mode: 'insensitive' } },
                { email: { contains: filters.search, mode: 'insensitive' } },
                { company: { contains: filters.search, mode: 'insensitive' } },
            ];
        }

        return this.prisma.lead.findMany({
            where,
            include: {
                assignee: {
                    select: { id: true, firstName: true, lastName: true, email: true },
                },
                createdBy: {
                    select: { id: true, firstName: true, lastName: true },
                },
                _count: {
                    select: { activities: true, deals: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: string, user: UserContext) {
        const lead = await this.prisma.lead.findUnique({
            where: { id },
            include: {
                assignee: {
                    select: { id: true, firstName: true, lastName: true, email: true, phone: true },
                },
                createdBy: {
                    select: { id: true, firstName: true, lastName: true },
                },
                activities: {
                    orderBy: { scheduledAt: 'desc' },
                    take: 10,
                },
                deals: {
                    orderBy: { createdAt: 'desc' },
                },
                notes: {
                    orderBy: { createdAt: 'desc' },
                },
                attachments: {
                    orderBy: { createdAt: 'desc' },
                },
                emailLogs: {
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                },
            },
        });

        if (!lead) {
            throw new NotFoundException('Lead not found');
        }

        return lead;
    }

    async update(id: string, updateLeadDto: UpdateLeadDto, user: UserContext) {
        const lead = await this.prisma.lead.findUnique({ where: { id } });

        if (!lead) {
            throw new NotFoundException('Lead not found');
        }

        // Check access
        if (user.role === Role.EMPLOYEE && lead.assigneeId !== user.id) {
            throw new ForbiddenException('You do not have access to update this lead');
        }

        return this.prisma.lead.update({
            where: { id },
            data: updateLeadDto as Prisma.LeadUncheckedUpdateInput,
            include: {
                assignee: {
                    select: { id: true, firstName: true, lastName: true, email: true },
                },
            },
        });
    }

    async delete(id: string, user: UserContext) {
        const lead = await this.prisma.lead.findUnique({ where: { id } });

        if (!lead) {
            throw new NotFoundException('Lead not found');
        }

        if (user.role === Role.EMPLOYEE) {
            throw new ForbiddenException('Employees cannot delete leads');
        }

        await this.prisma.lead.delete({ where: { id } });
        return { message: 'Lead deleted successfully' };
    }

    async assignLead(id: string, assigneeId: string, user: UserContext) {
        const lead = await this.prisma.lead.findUnique({ where: { id } });

        if (!lead) {
            throw new NotFoundException('Lead not found');
        }

        if (user.role === Role.EMPLOYEE) {
            throw new ForbiddenException('Employees cannot reassign leads');
        }

        // Verify assignee exists
        const assignee = await this.prisma.user.findUnique({ where: { id: assigneeId } });
        if (!assignee) {
            throw new NotFoundException('Assignee not found');
        }

        return this.prisma.lead.update({
            where: { id },
            data: { assigneeId },
            include: {
                assignee: {
                    select: { id: true, firstName: true, lastName: true, email: true },
                },
            },
        });
    }

    async updateStatus(id: string, status: LeadStatus, user: UserContext) {
        const lead = await this.prisma.lead.findUnique({ where: { id } });

        if (!lead) {
            throw new NotFoundException('Lead not found');
        }

        if (user.role === Role.EMPLOYEE && lead.assigneeId !== user.id) {
            throw new ForbiddenException('You cannot update status of this lead');
        }

        return this.prisma.lead.update({
            where: { id },
            data: { status },
        });
    }

    async getLeadStats(user: UserContext) {
        let where: any = {};

        if (user.role === Role.MANAGER) {
            const teamMembers = await this.prisma.user.findMany({
                where: { managerId: user.id },
                select: { id: true },
            });
            const teamIds = teamMembers.map(m => m.id);
            where.assigneeId = { in: [user.id, ...teamIds] };
        }

        const [total, byStatus, hot, warm, converted] = await Promise.all([
            this.prisma.lead.count({ where }),
            this.prisma.lead.groupBy({
                by: ['status'],
                where,
                _count: true,
            }),
            this.prisma.lead.count({ where: { ...where, type: LeadType.HOT } }),
            this.prisma.lead.count({ where: { ...where, type: LeadType.WARM } }),
            this.prisma.lead.count({ where: { ...where, status: LeadStatus.WON } }),
        ]);

        return {
            total,
            hot,
            warm,
            converted,
            byStatus: byStatus.reduce((acc, item) => {
                acc[item.status] = item._count;
                return acc;
            }, {} as Record<LeadStatus, number>),
        };
    }
}
