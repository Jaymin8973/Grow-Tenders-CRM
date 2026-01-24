import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class AuditService {
    constructor(private prisma: PrismaService) { }

    async log(data: {
        userId: string;
        action: string;
        module: string;
        entityId?: string;
        oldValues?: any;
        newValues?: any;
        ipAddress?: string;
        userAgent?: string;
    }) {
        return this.prisma.auditLog.create({
            data: {
                userId: data.userId,
                action: data.action,
                module: data.module,
                entityId: data.entityId,
                oldValues: data.oldValues,
                newValues: data.newValues,
                ipAddress: data.ipAddress,
                userAgent: data.userAgent,
            },
        });
    }

    async findAll(filters?: {
        userId?: string;
        module?: string;
        action?: string;
        startDate?: Date;
        endDate?: Date;
        limit?: number;
    }) {
        const where: any = {};

        if (filters?.userId) where.userId = filters.userId;
        if (filters?.module) where.module = filters.module;
        if (filters?.action) where.action = filters.action;
        if (filters?.startDate || filters?.endDate) {
            where.createdAt = {};
            if (filters.startDate) where.createdAt.gte = filters.startDate;
            if (filters.endDate) where.createdAt.lte = filters.endDate;
        }

        return this.prisma.auditLog.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: filters?.limit || 100,
        });
    }

    async findByEntity(module: string, entityId: string) {
        return this.prisma.auditLog.findMany({
            where: { module, entityId },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async getRecentActivity(userId: string, limit = 20) {
        return this.prisma.auditLog.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }
}
