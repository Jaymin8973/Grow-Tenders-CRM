import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDailyReportDto } from './dto/create-daily-report.dto';

@Injectable()
export class DailyReportsService {
    constructor(private readonly prisma: PrismaService) { }

    async create(userId: string, createDailyReportDto: CreateDailyReportDto) {
        const { paymentReceivedFromCustomerIds, leadIds, paymentDetails, ...rest } = createDailyReportDto;

        // Check if report already exists for today
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const existingReport = await this.prisma.dailyReport.findFirst({
            where: {
                employeeId: userId,
                date: { gte: todayStart, lte: todayEnd }
            }
        });

        if (existingReport) {
            throw new BadRequestException('Daily report already submitted for today. You can edit your existing report.');
        }

        // Extract lead IDs from paymentDetails
        const paymentLeadIds = paymentDetails?.map(p => p.leadId).filter((id): id is string => !!id) || [];
        const allLeadIds = [...new Set([...(leadIds || []), ...paymentLeadIds])];

        return this.prisma.dailyReport.create({
            data: {
                ...rest,
                employeeId: userId,
                paymentReceivedFromCustomers: paymentReceivedFromCustomerIds ? {
                    connect: paymentReceivedFromCustomerIds.map(id => ({ id })),
                } : undefined,
                leadIds: allLeadIds,
                paymentDetails: paymentDetails ? JSON.parse(JSON.stringify(paymentDetails)) : undefined,
            },
            include: {
                paymentReceivedFromCustomers: {
                    select: { id: true, firstName: true, lastName: true, company: true }
                },
            }
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

    async findAll(userId: string, role: string, query: any, managerId?: string) {
        const { employeeId, date, page = 1, limit = 10 } = query;
        const where: any = {};

        if (role === 'EMPLOYEE') {
            where.employeeId = userId;
        } else if (role === 'MANAGER') {
            // Manager can only see their team's reports
            if (employeeId) {
                // Verify this employee is in manager's team
                const teamMember = await this.prisma.user.findFirst({
                    where: { id: employeeId, managerId: userId }
                });
                if (!teamMember && employeeId !== userId) {
                    throw new ForbiddenException('You can only view your team members\' reports');
                }
                where.employeeId = employeeId;
            } else {
                // Get all team members including the manager themselves
                const teamMembers = await this.prisma.user.findMany({
                    where: { managerId: userId },
                    select: { id: true }
                });
                const teamMemberIds = [userId, ...teamMembers.map(m => m.id)];
                where.employeeId = { in: teamMemberIds };
            }
        } else if (role === 'SUPER_ADMIN') {
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
                            showEmail: true,
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

        // Fetch lead details for each report's leadIds
        const reportsWithLeads = await Promise.all(
            data.map(async (report) => {
                if (report.leadIds && report.leadIds.length > 0) {
                    const leads = await this.prisma.lead.findMany({
                        where: { id: { in: report.leadIds } },
                        select: { id: true, firstName: true, lastName: true, company: true, status: true }
                    });
                    const maskedEmployee: any = { ...report.employee };
                    if (role !== 'SUPER_ADMIN' && maskedEmployee.showEmail === false) {
                        maskedEmployee.email = undefined;
                    }
                    return { ...report, employee: maskedEmployee, leads };
                }
                const maskedEmployee: any = { ...report.employee };
                if (role !== 'SUPER_ADMIN' && maskedEmployee.showEmail === false) {
                    maskedEmployee.email = undefined;
                }
                return { ...report, employee: maskedEmployee, leads: [] };
            })
        );

        return {
            data: reportsWithLeads,
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / Number(limit)),
        };
    }

    async findOne(id: string, userId?: string, role?: string) {
        const report = await this.prisma.dailyReport.findUnique({
            where: { id },
            include: {
                employee: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    }
                },
                paymentReceivedFromCustomers: {
                    select: { id: true, firstName: true, lastName: true, company: true }
                }
            }
        });
        if (!report) throw new NotFoundException('Report not found');

        // Authorization check
        if (role === 'EMPLOYEE' && report.employeeId !== userId) {
            throw new ForbiddenException('You can only view your own reports');
        }

        if (role === 'MANAGER') {
            const teamMembers = await this.prisma.user.findMany({
                where: { managerId: userId },
                select: { id: true }
            });
            const teamMemberIds = [userId, ...teamMembers.map(m => m.id)];
            if (!teamMemberIds.includes(report.employeeId)) {
                throw new ForbiddenException('You can only view your team\'s reports');
            }
        }

        // Fetch lead details
        if (report.leadIds && report.leadIds.length > 0) {
            const leads = await this.prisma.lead.findMany({
                where: { id: { in: report.leadIds } },
                select: { id: true, firstName: true, lastName: true, company: true, status: true }
            });
            return { ...report, leads };
        }
        return { ...report, leads: [] };
    }

    async update(id: string, userId: string, role: string, updateDto: CreateDailyReportDto) {
        const report = await this.prisma.dailyReport.findUnique({ where: { id } });
        if (!report) throw new NotFoundException('Report not found');

        // Only the employee who created the report can edit it
        if (report.employeeId !== userId) {
            throw new ForbiddenException('You can only edit your own reports');
        }

        const { paymentReceivedFromCustomerIds, leadIds, paymentDetails, ...rest } = updateDto;
        const paymentLeadIds = paymentDetails?.map(p => p.leadId).filter((id): id is string => !!id) || [];
        const allLeadIds = [...new Set([...(leadIds || []), ...paymentLeadIds])];

        return this.prisma.dailyReport.update({
            where: { id },
            data: {
                ...rest,
                paymentReceivedFromCustomers: paymentReceivedFromCustomerIds ? {
                    set: paymentReceivedFromCustomerIds.map(id => ({ id })),
                } : { set: [] },
                leadIds: allLeadIds,
                paymentDetails: paymentDetails ? JSON.parse(JSON.stringify(paymentDetails)) : undefined,
            },
            include: {
                paymentReceivedFromCustomers: {
                    select: { id: true, firstName: true, lastName: true, company: true }
                },
            }
        });
    }

    async remove(id: string, userId: string, role: string) {
        const report = await this.prisma.dailyReport.findUnique({ where: { id } });
        if (!report) throw new NotFoundException('Report not found');

        // Only the employee who created the report can delete it
        if (report.employeeId !== userId) {
            throw new ForbiddenException('You can only delete your own reports');
        }

        await this.prisma.dailyReport.delete({ where: { id } });
        return { message: 'Report deleted successfully' };
    }
}
