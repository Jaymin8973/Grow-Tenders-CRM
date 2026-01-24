import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBranchDto, UpdateBranchDto } from './dto/branch.dto';

@Injectable()
export class BranchesService {
    constructor(private prisma: PrismaService) { }

    async create(dto: CreateBranchDto) {
        // Check if branch with same name or code exists
        const existing = await this.prisma.branch.findFirst({
            where: {
                OR: [
                    { name: dto.name },
                    { code: dto.code },
                ],
            },
        });

        if (existing) {
            throw new ConflictException('Branch with this name or code already exists');
        }

        return this.prisma.branch.create({
            data: dto,
        });
    }

    async findAll(includeInactive = false) {
        return this.prisma.branch.findMany({
            where: includeInactive ? {} : { isActive: true },
            include: {
                _count: {
                    select: {
                        users: true,
                        leads: true,
                        customers: true,
                        deals: true,
                    },
                },
            },
            orderBy: { name: 'asc' },
        });
    }

    async findOne(id: string) {
        const branch = await this.prisma.branch.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        users: true,
                        leads: true,
                        customers: true,
                        deals: true,
                    },
                },
            },
        });

        if (!branch) {
            throw new NotFoundException('Branch not found');
        }

        return branch;
    }

    async update(id: string, dto: UpdateBranchDto) {
        await this.findOne(id); // Verify exists

        // Check for duplicate name/code if changing
        if (dto.name || dto.code) {
            const existing = await this.prisma.branch.findFirst({
                where: {
                    AND: [
                        { id: { not: id } },
                        {
                            OR: [
                                dto.name ? { name: dto.name } : {},
                                dto.code ? { code: dto.code } : {},
                            ].filter(obj => Object.keys(obj).length > 0),
                        },
                    ],
                },
            });

            if (existing) {
                throw new ConflictException('Branch with this name or code already exists');
            }
        }

        return this.prisma.branch.update({
            where: { id },
            data: dto,
        });
    }

    async remove(id: string) {
        await this.findOne(id); // Verify exists

        // Check if branch has any users, leads, customers, or deals
        const counts = await this.prisma.branch.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        users: true,
                        leads: true,
                        customers: true,
                        deals: true,
                    },
                },
            },
        });

        const totalLinked =
            (counts?._count?.users || 0) +
            (counts?._count?.leads || 0) +
            (counts?._count?.customers || 0) +
            (counts?._count?.deals || 0);

        if (totalLinked > 0) {
            throw new ConflictException('Cannot delete branch with linked records. Deactivate instead.');
        }

        return this.prisma.branch.delete({
            where: { id },
        });
    }

    async getBranchStats(branchId: string) {
        const [usersCount, leadsCount, customersCount, dealsCount, dealsValue] = await Promise.all([
            this.prisma.user.count({ where: { branchId } }),
            this.prisma.lead.count({ where: { branchId } }),
            this.prisma.customer.count({ where: { branchId } }),
            this.prisma.deal.count({ where: { branchId } }),
            this.prisma.deal.aggregate({
                where: { branchId },
                _sum: { value: true },
            }),
        ]);

        return {
            users: usersCount,
            leads: leadsCount,
            customers: customersCount,
            deals: dealsCount,
            totalDealValue: dealsValue._sum.value || 0,
        };
    }
}
