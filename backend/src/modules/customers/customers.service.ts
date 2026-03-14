import { Injectable, NotFoundException, ForbiddenException, Logger, BadRequestException } from '@nestjs/common';
import { Role, Prisma, InvoiceStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

interface UserContext {
    id: string;
    role: Role;
    managerId?: string | null;
}

@Injectable()
export class CustomersService {
    private readonly logger = new Logger(CustomersService.name);

    constructor(private prisma: PrismaService) { }

    private async assertAssigneeExists(assigneeId?: string) {
        if (!assigneeId) return;
        const user = await this.prisma.user.findUnique({ where: { id: assigneeId }, select: { id: true } });
        if (!user) {
            throw new BadRequestException('Assignee not found');
        }
    }

    async create(createCustomerDto: CreateCustomerDto, userId: string) {
        await this.assertAssigneeExists(createCustomerDto.assigneeId);

        try {
            return await this.prisma.customer.create({
                data: {
                    ...createCustomerDto,
                    assigneeId: createCustomerDto.assigneeId || userId,
                },
                include: {
                    assignee: {
                        select: { id: true, firstName: true, lastName: true, email: true },
                    },
                },
            });
        } catch (e: any) {
            if (typeof e?.message === 'string' && e.message.toLowerCase().includes('unique')) {
                throw new BadRequestException('Customer with this email already exists');
            }
            this.logger.error('Failed to create customer', e);
            throw e;
        }
    }

    async createFromLead(leadId: string, userId: string) {
        const lead = await this.prisma.lead.findUnique({ where: { id: leadId } });

        if (!lead) {
            throw new NotFoundException('Lead not found');
        }

        const customer = await this.prisma.customer.create({
            data: {
                firstName: lead.firstName,
                lastName: lead.lastName,
                email: lead.email,
                phone: lead.mobile,
                company: lead.company,
                assigneeId: lead.assigneeId || userId,
                leadId: lead.id,
                passwordHash: lead.passwordHash,
            },
            include: {
                assignee: {
                    select: { id: true, firstName: true, lastName: true, email: true },
                },
            },
        });

        // Update lead with converted customer reference
        await this.prisma.lead.update({
            where: { id: leadId },
            data: { convertedToCustomerId: customer.id },
        });

        return customer;
    }

    async getCustomerOptions(user: UserContext, params: { search?: string; page?: number; limit?: number }) {
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

        const page = Math.max(params.page ?? 1, 1);
        const limit = Math.min(Math.max(params.limit ?? 50, 1), 200);
        const skip = (page - 1) * limit;

        if (params.search) {
            where.OR = [
                { firstName: { contains: params.search, mode: 'insensitive' } },
                { lastName: { contains: params.search, mode: 'insensitive' } },
                { email: { contains: params.search, mode: 'insensitive' } },
                { company: { contains: params.search, mode: 'insensitive' } },
                { phone: { contains: params.search, mode: 'insensitive' } },
            ];
        }

        const [items, total] = await Promise.all([
            this.prisma.customer.findMany({
                where,
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    phone: true,
                    company: true,
                },
                orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
                skip,
                take: limit,
            }),
            this.prisma.customer.count({ where }),
        ]);

        return {
            data: items,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async findAll(user: UserContext, filters?: {
        assigneeId?: string;
        search?: string;
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

        if (filters?.assigneeId && user.role !== Role.EMPLOYEE) {
            // If Manager, ensure the requested assignee is in their team
            if (user.role === Role.MANAGER) {
                where.AND = [
                    { assigneeId: filters.assigneeId }
                ];
            } else {
                where.assigneeId = filters.assigneeId;
            }
        }
        if (filters?.search) {
            where.OR = [
                { firstName: { contains: filters.search, mode: 'insensitive' } },
                { lastName: { contains: filters.search, mode: 'insensitive' } },
                { email: { contains: filters.search, mode: 'insensitive' } },
                { company: { contains: filters.search, mode: 'insensitive' } },
            ];
        }

        const pageSize = Math.min(Math.max(filters?.pageSize ?? 25, 1), 100);
        const page = Math.max(filters?.page ?? 1, 1);

        const sortBy = filters?.sortBy ?? 'createdAt';
        const sortOrder: 'asc' | 'desc' = filters?.sortOrder ?? 'desc';
        const allowedSortBy = new Set(['createdAt', 'updatedAt', 'firstName', 'lastName', 'email', 'company']);
        const safeSortBy = allowedSortBy.has(sortBy) ? sortBy : 'createdAt';
        const orderBy: Prisma.CustomerOrderByWithRelationInput = { [safeSortBy]: sortOrder } as any;

        const baseQuery: Prisma.CustomerFindManyArgs = {
            where,
            include: {
                assignee: {
                    select: { id: true, firstName: true, lastName: true, email: true },
                },
                _count: {
                    select: { invoices: true, activities: true },
                },
            },
            orderBy,
        };

        const usingCursor = !!filters?.cursor;

        const items = await this.prisma.customer.findMany({
            ...baseQuery,
            ...(usingCursor
                ? {
                    cursor: { id: filters!.cursor! },
                    skip: 1,
                    take: pageSize,
                }
                : {
                    skip: (page - 1) * pageSize,
                    take: pageSize,
                }),
        });

        const nextCursor = items.length > 0 ? items[items.length - 1].id : null;
        const total = usingCursor ? undefined : await this.prisma.customer.count({ where });

        return {
            items,
            page: usingCursor ? undefined : page,
            pageSize,
            total,
            nextCursor,
        };
    }

    async findOne(id: string, user: UserContext) {
        const customer = await this.prisma.customer.findUnique({
            where: { id },
            include: {
                assignee: {
                    select: { id: true, firstName: true, lastName: true, email: true, phone: true },
                },
                activities: {
                    orderBy: { scheduledAt: 'desc' },
                    take: 10,
                },
                invoices: {
                    orderBy: { createdAt: 'desc' },
                },
                attachments: {
                    orderBy: { createdAt: 'desc' },
                },
                emailLogs: {
                    orderBy: { createdAt: 'desc' },
                    take: 20,
                },
                customerNotes: {
                    orderBy: { createdAt: 'desc' },
                },
                tenderSubscriptions: true,
            },
        });

        if (!customer) {
            throw new NotFoundException('Customer not found');
        }

        if (user.role === Role.EMPLOYEE && customer.assigneeId !== user.id) {
            throw new ForbiddenException('You do not have access to this customer');
        }

        if (user.role === Role.MANAGER) {
            // Check if customer belongs to manager or their team
            if (customer.assigneeId !== user.id) {
                // Check if assignee is in team
                const assignee = await this.prisma.user.findUnique({
                    where: { id: customer.assigneeId || undefined },
                    select: { managerId: true }
                });
                if (assignee?.managerId !== user.id) {
                    throw new ForbiddenException('You do not have access to this customer');
                }
            }
        }

        return customer;
    }

    async update(id: string, updateCustomerDto: UpdateCustomerDto, user: UserContext) {
        const customer = await this.prisma.customer.findUnique({ where: { id } });

        if (!customer) {
            throw new NotFoundException('Customer not found');
        }

        if (user.role === Role.EMPLOYEE && customer.assigneeId !== user.id) {
            throw new ForbiddenException('You do not have access to update this customer');
        }

        await this.assertAssigneeExists((updateCustomerDto as any)?.assigneeId);

        try {
            return await this.prisma.customer.update({
                where: { id },
                data: updateCustomerDto,
                include: {
                    assignee: {
                        select: { id: true, firstName: true, lastName: true, email: true },
                    },
                },
            });
        } catch (e: any) {
            if (typeof e?.message === 'string' && e.message.toLowerCase().includes('unique')) {
                throw new BadRequestException('Customer with this email already exists');
            }
            this.logger.error('Failed to update customer', e);
            throw e;
        }
    }

    async delete(id: string, user: UserContext) {
        const customer = await this.prisma.customer.findUnique({ where: { id } });

        if (!customer) {
            throw new NotFoundException('Customer not found');
        }

        if (user.role === Role.EMPLOYEE) {
            throw new ForbiddenException('Employees cannot delete customers');
        }

        // Delete related notifications that link to this customer
        await this.prisma.notification.deleteMany({
            where: {
                link: { contains: `/customers/${id}` }
            }
        });

        await this.prisma.customer.delete({ where: { id } });
        return { message: 'Customer deleted successfully' };
    }

    async activateFreeTrial(customerId: string, user: UserContext) {
        const customer = await this.prisma.customer.findUnique({
            where: { id: customerId },
        });

        if (!customer) {
            throw new NotFoundException('Customer not found');
        }

        if (customer.freeTrialUsed) {
            throw new BadRequestException('Free trial has already been used for this customer');
        }

        if (customer.freeTrialActive) {
            throw new BadRequestException('Free trial is already active for this customer');
        }

        // Set 3-day trial
        const now = new Date();
        const trialEndDate = new Date(now);
        trialEndDate.setDate(trialEndDate.getDate() + 3);

        const updated = await this.prisma.customer.update({
            where: { id: customerId },
            data: {
                freeTrialUsed: true,
                freeTrialActive: true,
                freeTrialStartDate: now,
                freeTrialEndDate: trialEndDate,
                subscriptionActive: true,
                subscriptionStartDate: now,
                subscriptionEndDate: trialEndDate,
                planType: 'FREE_TRIAL',
            },
            include: {
                assignee: {
                    select: { id: true, firstName: true, lastName: true, email: true },
                },
            },
        });

        return {
            message: 'Free trial activated successfully',
            trialEndDate,
            customer: updated,
        };
    }

    async getCustomerStats(user: UserContext) {
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

        const customers = await this.prisma.customer.findMany({
            where,
            select: { id: true, company: true },
        });

        const customerIds = customers.map(c => c.id);
        const total = customers.length;

        const companies = new Set(customers.map(c => c.company).filter(Boolean) as string[]).size;

        const paidRevenue = customerIds.length
            ? await this.prisma.invoice.aggregate({
                where: {
                    customerId: { in: customerIds },
                    status: InvoiceStatus.PAID,
                },
                _sum: { total: true },
            })
            : { _sum: { total: 0 } };

        return {
            total,
            companies,
            revenue: paidRevenue._sum.total || 0,
        };
    }
}
