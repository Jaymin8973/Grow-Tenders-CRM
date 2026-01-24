import { Injectable, NotFoundException } from '@nestjs/common';
import { TenderStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTenderDto } from './dto/create-tender.dto';
import { UpdateTenderDto } from './dto/update-tender.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';

@Injectable()
export class TendersService {
    constructor(private prisma: PrismaService) { }

    // Tender CRUD
    async createTender(createTenderDto: CreateTenderDto, userId: string) {
        return this.prisma.tender.create({
            data: {
                ...createTenderDto,
                openDate: new Date(createTenderDto.openDate),
                closeDate: new Date(createTenderDto.closeDate),
                createdById: userId,
            },
            include: {
                category: true,
                createdBy: {
                    select: { id: true, firstName: true, lastName: true },
                },
            },
        });
    }

    async findAllTenders(filters?: {
        status?: TenderStatus;
        categoryId?: string;
        search?: string;
    }) {
        let where: any = {};

        if (filters?.status) {
            where.status = filters.status;
        }
        if (filters?.categoryId) {
            where.categoryId = filters.categoryId;
        }
        if (filters?.search) {
            where.title = { contains: filters.search, mode: 'insensitive' };
        }

        return this.prisma.tender.findMany({
            where,
            include: {
                category: true,
                createdBy: {
                    select: { id: true, firstName: true, lastName: true },
                },
                _count: {
                    select: { attachments: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOneTender(id: string) {
        const tender = await this.prisma.tender.findUnique({
            where: { id },
            include: {
                category: true,
                createdBy: {
                    select: { id: true, firstName: true, lastName: true },
                },
                attachments: true,
                emailLogs: {
                    orderBy: { createdAt: 'desc' },
                },
            },
        });

        if (!tender) {
            throw new NotFoundException('Tender not found');
        }

        return tender;
    }

    async updateTender(id: string, updateTenderDto: UpdateTenderDto) {
        const tender = await this.prisma.tender.findUnique({ where: { id } });

        if (!tender) {
            throw new NotFoundException('Tender not found');
        }

        const data: any = { ...updateTenderDto };
        if (updateTenderDto.openDate) {
            data.openDate = new Date(updateTenderDto.openDate);
        }
        if (updateTenderDto.closeDate) {
            data.closeDate = new Date(updateTenderDto.closeDate);
        }

        return this.prisma.tender.update({
            where: { id },
            data,
            include: {
                category: true,
            },
        });
    }

    async updateTenderStatus(id: string, status: TenderStatus) {
        return this.prisma.tender.update({
            where: { id },
            data: { status },
        });
    }

    async deleteTender(id: string) {
        await this.prisma.tender.delete({ where: { id } });
        return { message: 'Tender deleted successfully' };
    }

    // Categories
    async createCategory(createCategoryDto: CreateCategoryDto) {
        return this.prisma.tenderCategory.create({
            data: createCategoryDto,
        });
    }

    async findAllCategories() {
        return this.prisma.tenderCategory.findMany({
            where: { isActive: true },
            include: {
                _count: {
                    select: { tenders: true },
                },
            },
            orderBy: { name: 'asc' },
        });
    }

    async updateCategory(id: string, data: { name?: string; description?: string; isActive?: boolean }) {
        return this.prisma.tenderCategory.update({
            where: { id },
            data,
        });
    }

    async deleteCategory(id: string) {
        await this.prisma.tenderCategory.delete({ where: { id } });
        return { message: 'Category deleted successfully' };
    }

    // Subscriptions
    async createSubscription(createSubscriptionDto: CreateSubscriptionDto) {
        const existing = await this.prisma.tenderSubscription.findUnique({
            where: { customerId: createSubscriptionDto.customerId },
        });

        if (existing) {
            return this.prisma.tenderSubscription.update({
                where: { id: existing.id },
                data: {
                    categories: createSubscriptionDto.categories,
                    states: createSubscriptionDto.states,
                    isActive: createSubscriptionDto.isActive ?? true,
                },
                include: { customer: true },
            });
        }

        return this.prisma.tenderSubscription.create({
            data: {
                customerId: createSubscriptionDto.customerId,
                categories: createSubscriptionDto.categories,
                states: createSubscriptionDto.states,
                isActive: createSubscriptionDto.isActive ?? true,
            },
            include: { customer: true },
        });
    }

    async findCustomerSubscription(customerId: string) {
        return this.prisma.tenderSubscription.findUnique({
            where: { customerId },
        });
    }

    async findSubscribedCustomers(categoryId: string) {
        const subscriptions = await this.prisma.tenderSubscription.findMany({
            where: {
                categories: { has: categoryId },
                isActive: true,
            },
            include: {
                customer: {
                    select: { id: true, firstName: true, lastName: true, email: true, company: true },
                },
            },
        });

        return subscriptions.map(s => s.customer);
    }

    async updateSubscription(customerId: string, categories: string[], states: string[], isActive: boolean = true) {
        return this.prisma.tenderSubscription.update({
            where: { customerId },
            data: { categories, states, isActive },
            include: { customer: true },
        });
    }

    async deactivateSubscription(customerId: string) {
        return this.prisma.tenderSubscription.update({
            where: { customerId },
            data: { isActive: false },
        });
    }
}
