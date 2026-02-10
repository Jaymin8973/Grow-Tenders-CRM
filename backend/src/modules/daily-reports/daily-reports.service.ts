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

    async findAll(userId: string, role: string, query: any) {
        const { employeeId, date } = query;
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

        return this.prisma.dailyReport.findMany({
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
        });
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
