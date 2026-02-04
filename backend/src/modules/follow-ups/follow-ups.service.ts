import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateFollowUpDto } from './dto/create-follow-up.dto';
import { UpdateFollowUpDto } from './dto/update-follow-up.dto';
import { Role } from '@prisma/client';

@Injectable()
export class FollowUpsService {
    constructor(private prisma: PrismaService) { }

    async create(dto: CreateFollowUpDto, userId: string) {
        // Verify lead exists
        const lead = await this.prisma.lead.findUnique({
            where: { id: dto.leadId },
        });

        if (!lead) {
            throw new NotFoundException('Lead not found');
        }

        return this.prisma.followUp.create({
            data: {
                description: dto.description,
                scheduledAt: new Date(dto.scheduledAt),
                leadId: dto.leadId,
                createdById: userId,
            },
            include: {
                lead: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });
    }

    async findByLead(leadId: string, userId: string, userRole: Role) {
        // Verify lead exists and user has access
        const lead = await this.prisma.lead.findUnique({
            where: { id: leadId },
        });

        if (!lead) {
            throw new NotFoundException('Lead not found');
        }

        // Check access based on role
        if (userRole === Role.EMPLOYEE && lead.assigneeId !== userId) {
            throw new ForbiddenException('You do not have access to this lead');
        }

        return this.prisma.followUp.findMany({
            where: { leadId },
            orderBy: { scheduledAt: 'desc' },
            include: {
                lead: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });
    }

    async findOne(id: string) {
        const followUp = await this.prisma.followUp.findUnique({
            where: { id },
            include: {
                lead: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });

        if (!followUp) {
            throw new NotFoundException('Follow-up not found');
        }

        return followUp;
    }

    async update(id: string, dto: UpdateFollowUpDto, userId: string, userRole: Role) {
        const followUp = await this.findOne(id);

        // Only creator or admins can update
        if (userRole === Role.EMPLOYEE && followUp.createdById !== userId) {
            throw new ForbiddenException('You can only update your own follow-ups');
        }

        const data: any = {};
        if (dto.description) data.description = dto.description;
        if (dto.scheduledAt) data.scheduledAt = new Date(dto.scheduledAt);
        if (dto.status) {
            data.status = dto.status;
            if (dto.status === 'COMPLETED') {
                data.completedAt = new Date();
            }
        }
        if (dto.completedAt) data.completedAt = new Date(dto.completedAt);

        return this.prisma.followUp.update({
            where: { id },
            data,
            include: {
                lead: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });
    }

    async delete(id: string, userId: string, userRole: Role) {
        const followUp = await this.findOne(id);

        // Only creator or admins can delete
        if (userRole === Role.EMPLOYEE && followUp.createdById !== userId) {
            throw new ForbiddenException('You can only delete your own follow-ups');
        }

        return this.prisma.followUp.delete({
            where: { id },
        });
    }

    async markComplete(id: string, userId: string, userRole: Role) {
        return this.update(id, { status: 'COMPLETED' }, userId, userRole);
    }
}
