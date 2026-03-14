import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateInquiryDto } from './dto/create-inquiry.dto';

@Injectable()
export class InquiriesService {
    constructor(private prisma: PrismaService) {}

    async create(dto: CreateInquiryDto) {
        return (this.prisma as any).inquiry.create({
            data: {
                name: dto.name,
                email: dto.email,
                phone: dto.phone,
                type: dto.type,
                subject: dto.subject,
                message: dto.message,
            },
        });
    }

    async findAll(filters?: { page?: number; pageSize?: number; search?: string; assigneeId?: string }) {
        const pageSize = Math.min(Math.max(filters?.pageSize ?? 25, 1), 100);
        const page = Math.max(filters?.page ?? 1, 1);

        const where: any = {};
        if (filters?.assigneeId) {
            where.assigneeId = filters.assigneeId;
        }
        if (filters?.search) {
            where.OR = [
                { name: { contains: filters.search, mode: 'insensitive' } },
                { email: { contains: filters.search, mode: 'insensitive' } },
                { subject: { contains: filters.search, mode: 'insensitive' } },
                { message: { contains: filters.search, mode: 'insensitive' } },
                { phone: { contains: filters.search, mode: 'insensitive' } },
                { type: { contains: filters.search, mode: 'insensitive' } },
            ];
        }

        const [items, total] = await Promise.all([
            (this.prisma as any).inquiry.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * pageSize,
                take: pageSize,
                include: {
                    assignee: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            role: true,
                        },
                    },
                },
            }),
            (this.prisma as any).inquiry.count({ where }),
        ]);

        return { items, page, pageSize, total };
    }

    async assignInquiry(inquiryId: string, assigneeId: string) {
        // Ensure inquiry exists
        const inquiry = await (this.prisma as any).inquiry.findUnique({
            where: { id: inquiryId },
            select: { id: true },
        });

        if (!inquiry) {
            return null;
        }

        // Ensure assignee exists and is employee
        const user = await this.prisma.user.findUnique({
            where: { id: assigneeId },
            select: { id: true, role: true },
        });

        if (!user || user.role !== Role.EMPLOYEE) {
            return null;
        }

        return (this.prisma as any).inquiry.update({
            where: { id: inquiryId },
            data: { assigneeId },
            include: {
                assignee: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        role: true,
                    },
                },
            },
        });
    }

    async bulkAssignInquiries(inquiryIds: string[], assigneeId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: assigneeId },
            select: { id: true, role: true },
        });

        if (!user || user.role !== Role.EMPLOYEE) {
            return { updatedCount: 0, message: 'Assignee must be an active employee' };
        }

        const result = await (this.prisma as any).inquiry.updateMany({
            where: { id: { in: inquiryIds } },
            data: { assigneeId },
        });

        return {
            updatedCount: result?.count || 0,
            message: `Assigned ${result?.count || 0} inquiry(s) successfully`,
        };
    }
}
