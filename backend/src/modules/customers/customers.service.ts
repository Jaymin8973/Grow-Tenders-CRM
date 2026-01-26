import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Role, CustomerLifecycle } from '@prisma/client';
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
    constructor(private prisma: PrismaService) { }

    async create(createCustomerDto: CreateCustomerDto, userId: string) {
        return this.prisma.customer.create({
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
                phone: lead.phone,
                company: lead.company,
                position: lead.position,
                address: lead.address,
                city: lead.city,
                state: lead.state,
                country: lead.country,
                website: lead.website,
                lifecycle: CustomerLifecycle.CUSTOMER,
                assigneeId: lead.assigneeId || userId,
                leadId: lead.id,
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

    async findAll(user: UserContext, filters?: {
        lifecycle?: CustomerLifecycle;
        assigneeId?: string;
        search?: string;
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

        if (filters?.lifecycle) {
            where.lifecycle = filters.lifecycle;
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

        return this.prisma.customer.findMany({
            where,
            include: {
                assignee: {
                    select: { id: true, firstName: true, lastName: true, email: true },
                },
                _count: {
                    select: { deals: true, invoices: true, activities: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: string, user: UserContext) {
        const customer = await this.prisma.customer.findUnique({
            where: { id },
            include: {
                assignee: {
                    select: { id: true, firstName: true, lastName: true, email: true, phone: true },
                },
                deals: {
                    orderBy: { createdAt: 'desc' },
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

        return this.prisma.customer.update({
            where: { id },
            data: updateCustomerDto,
            include: {
                assignee: {
                    select: { id: true, firstName: true, lastName: true, email: true },
                },
            },
        });
    }

    async delete(id: string, user: UserContext) {
        const customer = await this.prisma.customer.findUnique({ where: { id } });

        if (!customer) {
            throw new NotFoundException('Customer not found');
        }

        if (user.role === Role.EMPLOYEE) {
            throw new ForbiddenException('Employees cannot delete customers');
        }

        await this.prisma.customer.delete({ where: { id } });
        return { message: 'Customer deleted successfully' };
    }

    async updateLifecycle(id: string, lifecycle: CustomerLifecycle, user: UserContext) {
        const customer = await this.prisma.customer.findUnique({ where: { id } });

        if (!customer) {
            throw new NotFoundException('Customer not found');
        }

        return this.prisma.customer.update({
            where: { id },
            data: { lifecycle },
        });
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

        const [total, byLifecycle] = await Promise.all([
            this.prisma.customer.count({ where }),
            this.prisma.customer.groupBy({
                by: ['lifecycle'],
                where,
                _count: true,
            }),
        ]);

        return {
            total,
            byLifecycle: byLifecycle.reduce((acc, item) => {
                acc[item.lifecycle] = item._count;
                return acc;
            }, {} as Record<CustomerLifecycle, number>),
        };
    }
}
