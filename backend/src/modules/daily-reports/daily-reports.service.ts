import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDailyReportDto } from './dto/create-daily-report.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class DailyReportsService {
    constructor(private readonly prisma: PrismaService) { }

    async create(userId: string, createDailyReportDto: CreateDailyReportDto) {
        const { paymentReceivedFromCustomerIds, ...rest } = createDailyReportDto;
        return this.prisma.dailyReport.create({
            data: {
                ...rest,
                employeeId: userId,
                paymentReceivedFromCustomers: paymentReceivedFromCustomerIds ? {
                    connect: paymentReceivedFromCustomerIds.map(id => ({ id })),
                } : undefined,
            },
        });
    }

    async getTodayMetrics(userId: string) {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        // Calculate call count: number of completed CALL activities for today
        const callCount = await this.prisma.activity.count({
            where: {
                assigneeId: userId,
                type: 'CALL',
                status: 'COMPLETED',
                updatedAt: { gte: todayStart, lte: todayEnd }
            }
        });

        // Calculate leads generated: number of leads created by this user today
        const leadsGenerated = await this.prisma.lead.count({
            where: {
                createdById: userId,
                createdAt: { gte: todayStart, lte: todayEnd }
            }
        });

        return { callCount, leadsGenerated };
    }

    async findAll(userId: string, role: string, query: any) {
        const { employeeId, date, page = 1, limit = 10 } = query;
        const where: Prisma.DailyReportWhereInput = {};

        if (role === 'EMPLOYEE') {
            where.employeeId = userId;
        } else if (role === 'MANAGER' || role === 'SUPER_ADMIN') {
            if (employeeId) {
                where.employeeId = employeeId;
            }
        }

        if (date) {
            const startDate = new Date(date);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(date);
            endDate.setHours(23, 59, 59, 999);

            where.date = {
                gte: startDate,
                lte: endDate,
            };
        }

        const skip = (Number(page) - 1) * Number(limit);
        const take = Number(limit);

        const [data, total] = await Promise.all([
            this.prisma.dailyReport.findMany({
                where,
                include: {
                    employee: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            role: true,
                        },
                    },
                    paymentReceivedFromCustomers: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            company: true,
                        }
                    }
                },
                orderBy: {
                    date: 'desc',
                },
                skip,
                take,
            }),
            this.prisma.dailyReport.count({ where }),
        ]);

        return {
            data,
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / Number(limit)),
        };
    }

    async findOne(id: string) {
        const report = await this.prisma.dailyReport.findUnique({
            where: { id },
            include: {
                employee: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    }
                }
            }
        });
        if (!report) throw new NotFoundException('Report not found');
        return report;
    }
}
