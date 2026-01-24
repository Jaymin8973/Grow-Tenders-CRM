import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

interface AuditLogData {
    userId: string;
    action: 'CREATE' | 'UPDATE' | 'DELETE';
    module: string;
    entityId?: string;
    oldValues?: any;
    newValues?: any;
    ipAddress?: string;
    userAgent?: string;
}

@Injectable()
export class AuditLogsService {
    constructor(private prisma: PrismaService) { }

    async log(data: AuditLogData) {
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
        action?: string;
        module?: string;
        startDate?: Date;
        endDate?: Date;
    }, page = 1, limit = 50) {
        const where: any = {};

        if (filters?.userId) {
            where.userId = filters.userId;
        }
        if (filters?.action) {
            where.action = filters.action;
        }
        if (filters?.module) {
            where.module = filters.module;
        }
        if (filters?.startDate && filters?.endDate) {
            where.createdAt = {
                gte: filters.startDate,
                lte: filters.endDate,
            };
        }

        const [logs, total] = await Promise.all([
            this.prisma.auditLog.findMany({
                where,
                include: {
                    user: {
                        select: { id: true, firstName: true, lastName: true, email: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.auditLog.count({ where }),
        ]);

        return {
            logs,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async findByEntity(module: string, entityId: string) {
        return this.prisma.auditLog.findMany({
            where: { module, entityId },
            include: {
                user: {
                    select: { id: true, firstName: true, lastName: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
}
