import { Injectable, NotFoundException } from '@nestjs/common';
import { TenderStatus } from '@prisma/client';
import { CreateTenderDto } from './dto/create-tender.dto';
import { UpdateTenderDto } from './dto/update-tender.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class TendersService {
    constructor(
        private prisma: PrismaService,
        private configService: ConfigService,
    ) { }

    private addMonths(date: Date, months: number) {
        const d = new Date(date);
        d.setMonth(d.getMonth() + months);
        return d;
    }

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
        // Delete related notifications that link to this tender
        await this.prisma.notification.deleteMany({
            where: {
                link: { contains: `/tenders/${id}` }
            }
        });

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

    // Get distinct categories from tender.categoryName (same as scraped-tenders)
    async findDistinctCategories(search?: string, limit: number = 100): Promise<string[]> {
        const where: any = {
            source: 'GEM',
            categoryName: { not: null },
        };

        if (search) {
            where.categoryName = {
                not: null,
                contains: search,
                mode: 'insensitive',
            };
        }

        const tenders = await this.prisma.tender.findMany({
            where,
            select: { categoryName: true },
            distinct: ['categoryName'],
            take: limit,
        });

        return tenders.map(t => t.categoryName!).filter(Boolean).sort();
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
        const startDate = createSubscriptionDto.startDate ? new Date(createSubscriptionDto.startDate) : new Date();
        const durationMonths = createSubscriptionDto.durationMonths ?? 1;
        const endDate = this.addMonths(startDate, durationMonths);

        const existing = await this.prisma.tenderSubscription.findUnique({
            where: { customerId: createSubscriptionDto.customerId },
        });

        if (existing) {
            return this.prisma.tenderSubscription.update({
                where: { id: existing.id },
                data: {
                    categories: createSubscriptionDto.categories,
                    states: createSubscriptionDto.states,
                    cities: createSubscriptionDto.cities || [],
                    isActive: createSubscriptionDto.isActive ?? true,
                    startDate,
                    durationMonths,
                    endDate,
                },
                include: { customer: true },
            });
        }

        return this.prisma.tenderSubscription.create({
            data: {
                customerId: createSubscriptionDto.customerId,
                categories: createSubscriptionDto.categories,
                states: createSubscriptionDto.states,
                cities: createSubscriptionDto.cities || [],
                isActive: createSubscriptionDto.isActive ?? true,
                startDate,
                durationMonths,
                endDate,
            },
            include: { customer: true },
        });
    }

    async findCustomerSubscription(customerId: string) {
        const sub = await this.prisma.tenderSubscription.findUnique({
            where: { customerId },
        });

        if (!sub) return sub;

        const safeStartDate = sub.startDate ? new Date(sub.startDate) : new Date(sub.createdAt);
        const safeDurationMonths = typeof sub.durationMonths === 'number' && sub.durationMonths > 0 ? sub.durationMonths : 1;
        const computedEndDate = sub.endDate || this.addMonths(safeStartDate, safeDurationMonths);
        const isExpired = computedEndDate < new Date();
        return {
            ...sub,
            endDate: computedEndDate,
            isActive: isExpired ? false : sub.isActive,
        };
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

        return subscriptions.map((s: any) => s.customer);
    }

    async updateSubscription(customerId: string, categories: string[], states: string[], cities: string[] = [], isActive: boolean = true) {
        return this.prisma.tenderSubscription.update({
            where: { customerId },
            data: { categories, states, cities, isActive },
            include: { customer: true },
        });
    }

    async deactivateSubscription(customerId: string) {
        return this.prisma.tenderSubscription.update({
            where: { customerId },
            data: { isActive: false },
        });
    }

    // Public API methods (no auth required)
    async findPublicTenders(filters?: {
        category?: string;
        search?: string;
        state?: string;
        city?: string;
        department?: string;
        ministry?: string;
        status?: string;
        fromDate?: string;
        toDate?: string;
        limit?: number;
        offset?: number;
    }) {
        const where: any = {
            status: 'PUBLISHED',
        };

        if (filters?.category) {
            where.OR = [
                { categoryName: { contains: filters.category, mode: 'insensitive' } },
                { category: { name: { contains: filters.category, mode: 'insensitive' } } },
            ];
        }
        if (filters?.search) {
            where.OR = [
                { title: { contains: filters.search, mode: 'insensitive' } },
                { description: { contains: filters.search, mode: 'insensitive' } },
                { referenceId: { contains: filters.search, mode: 'insensitive' } },
            ];
        }
        if (filters?.state) {
            where.state = { contains: filters.state, mode: 'insensitive' };
        }

        if (filters?.city) {
            where.city = { contains: filters.city, mode: 'insensitive' };
        }

        if (filters?.department) {
            where.department = { contains: filters.department, mode: 'insensitive' };
        }

        if (filters?.fromDate || filters?.toDate) {
            const range: any = {};
            const from = filters?.fromDate ? new Date(filters.fromDate) : null;
            const to = filters?.toDate ? new Date(filters.toDate) : null;
            if (from && !isNaN(from.getTime())) range.gte = from;
            if (to && !isNaN(to.getTime())) range.lte = to;
            if (Object.keys(range).length > 0) {
                where.closingDate = range;
            }
        }

        const limit = filters?.limit || 20;
        const offset = filters?.offset || 0;

        const [tenders, total] = await Promise.all([
            this.prisma.tender.findMany({
                where,
                include: {
                    category: {
                        select: { id: true, name: true },
                    },
                    attachments: {
                        select: { id: true, filename: true, url: true },
                    },
                    _count: {
                        select: { attachments: true },
                    },
                },
                orderBy: { publishDate: 'desc' },
                take: limit,
                skip: offset,
            }),
            this.prisma.tender.count({ where }),
        ]);

        return {
            data: tenders,
            pagination: {
                total,
                limit,
                offset,
                hasMore: offset + limit < total,
            },
        };
    }

    async getPublicStates(): Promise<string[]> {
        const tenders = await this.prisma.tender.findMany({
            where: {
                status: 'PUBLISHED',
                state: { not: null },
            },
            select: { state: true },
            distinct: ['state'],
        });

        return tenders.map(t => t.state!).filter(Boolean).sort();
    }

    async getPublicCities(state: string): Promise<string[]> {
        if (!state) return [];

        const tenders = await this.prisma.tender.findMany({
            where: {
                status: 'PUBLISHED',
                state: { contains: state, mode: 'insensitive' },
                city: { not: null },
            },
            select: { city: true },
            distinct: ['city'],
        });

        return tenders.map(t => t.city!).filter(Boolean).sort();
    }

    async getPublicDepartments(): Promise<string[]> {
        const tenders = await this.prisma.tender.findMany({
            where: {
                status: 'PUBLISHED',
                department: { not: null },
            },
            select: { department: true },
            distinct: ['department'],
        }) as unknown as Array<{ department: string | null }>;

        return tenders.map(t => t.department!).filter(Boolean).sort();
    }

    async findOnePublicTender(id: string) {
        const tender = await this.prisma.tender.findFirst({
            where: { id, status: 'PUBLISHED' },
            include: {
                category: {
                    select: { id: true, name: true },
                },
                attachments: {
                    select: { id: true, filename: true, url: true, mimeType: true, size: true },
                },
            },
        });

        if (!tender) {
            throw new NotFoundException('Tender not found');
        }

        return tender;
    }

    async getPublicStats() {
        const [totalTenders, activeTenders, categories, states] = await Promise.all([
            this.prisma.tender.count({ where: { status: 'PUBLISHED' } }),
            this.prisma.tender.count({
                where: {
                    status: 'PUBLISHED',
                    closingDate: { gte: new Date() },
                },
            }),
            this.prisma.tenderCategory.findMany({
                where: { isActive: true },
                include: {
                    _count: { select: { tenders: { where: { status: 'PUBLISHED' } } } },
                },
            }),
            this.prisma.tender.groupBy({
                by: ['state'],
                where: { status: 'PUBLISHED', state: { not: null } },
                _count: true,
            }),
        ]);

        return {
            totalTenders,
            activeTenders,
            categories: categories.map(c => ({
                id: c.id,
                name: c.name,
                count: c._count.tenders,
            })),
            states: states.map(s => ({
                name: s.state,
                count: s._count,
            })),
        };
    }

    async verifyCustomerFromToken(token: string) {
        try {
            const secret = this.configService.get<string>('JWT_SECRET') || 'default-secret-change-in-production';
            const decoded = jwt.verify(token, secret) as any;
            
            if (decoded.type !== 'customer') {
                return null;
            }

            const customer = await this.prisma.customer.findUnique({
                where: { id: decoded.sub },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    subscriptionActive: true,
                    planType: true,
                },
            });

            return customer;
        } catch (error) {
            return null;
        }
    }

    // Saved Tenders Methods
    async saveTender(customerId: string, tenderId: string, notes?: string) {
        // Check if already saved
        const existing = await this.prisma.savedTender.findUnique({
            where: {
                customerId_tenderId: { customerId, tenderId },
            },
        });

        if (existing) {
            // Update notes if provided
            if (notes !== undefined) {
                return this.prisma.savedTender.update({
                    where: { id: existing.id },
                    data: { notes },
                    include: {
                        tender: {
                            select: {
                                id: true,
                                title: true,
                                status: true,
                                value: true,
                                closingDate: true,
                                state: true,
                                category: { select: { id: true, name: true } },
                            },
                        },
                    },
                });
            }
            return existing;
        }

        return this.prisma.savedTender.create({
            data: { customerId, tenderId, notes },
            include: {
                tender: {
                    select: {
                        id: true,
                        title: true,
                        status: true,
                        value: true,
                        closingDate: true,
                        state: true,
                        category: { select: { id: true, name: true } },
                    },
                },
            },
        });
    }

    async unsaveTender(customerId: string, tenderId: string) {
        await this.prisma.savedTender.delete({
            where: {
                customerId_tenderId: { customerId, tenderId },
            },
        });

        return { message: 'Tender removed from saved list' };
    }

    async getSavedTenders(customerId: string, limit: number = 20, offset: number = 0) {
        const [saved, total] = await Promise.all([
            this.prisma.savedTender.findMany({
                where: { customerId },
                include: {
                    tender: {
                        select: {
                            id: true,
                            title: true,
                            description: true,
                            status: true,
                            value: true,
                            publishDate: true,
                            closingDate: true,
                            state: true,
                            city: true,
                            categoryName: true,
                            category: { select: { id: true, name: true } },
                            referenceId: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: offset,
            }),
            this.prisma.savedTender.count({ where: { customerId } }),
        ]);

        return {
            data: saved.map((s: any) => ({
                id: s.id,
                createdAt: s.createdAt,
                notes: s.notes,
                tender: {
                    ...s.tender,
                    accessLevel: 'full', // Saved tenders always show full access
                },
            })),
            pagination: {
                total,
                limit,
                offset,
                hasMore: offset + limit < total,
            },
        };
    }

    async checkIfTenderSaved(customerId: string, tenderId: string) {
        const saved = await this.prisma.savedTender.findUnique({
            where: {
                customerId_tenderId: { customerId, tenderId },
            },
        });

        return {
            isSaved: !!saved,
            savedAt: saved?.createdAt || null,
            notes: saved?.notes || null,
        };
    }

    // Tender History
    async addTenderHistory(
        tenderId: string,
        action: string,
        customerId?: string,
        oldValue?: string,
        newValue?: string,
        notes?: string,
    ) {
        return this.prisma.tenderHistory.create({
            data: {
                tenderId,
                customerId: customerId || null,
                action,
                oldValue,
                newValue,
                notes,
            },
        });
    }

    async getTenderHistory(tenderId: string, limit: number = 20, offset: number = 0) {
        const [history, total] = await Promise.all([
            this.prisma.tenderHistory.findMany({
                where: { tenderId },
                include: {
                    customer: {
                        select: { id: true, firstName: true, lastName: true, email: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: offset,
            }),
            this.prisma.tenderHistory.count({ where: { tenderId } }),
        ]);

        return {
            data: history,
            pagination: {
                total,
                limit,
                offset,
                hasMore: offset + limit < total,
            },
        };
    }

    async getCustomerTenderHistory(customerId: string, limit: number = 20, offset: number = 0) {
        const [history, total] = await Promise.all([
            this.prisma.tenderHistory.findMany({
                where: { customerId },
                include: {
                    tender: {
                        select: {
                            id: true,
                            title: true,
                            status: true,
                            value: true,
                            closingDate: true,
                            state: true,
                            category: { select: { id: true, name: true } },
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: offset,
            }),
            this.prisma.tenderHistory.count({ where: { customerId } }),
        ]);

        return {
            data: history,
            pagination: {
                total,
                limit,
                offset,
                hasMore: offset + limit < total,
            },
        };
    }
}
