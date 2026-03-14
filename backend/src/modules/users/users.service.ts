import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    private maskEmail<T extends { email?: string; showEmail?: boolean }>(user: T, requesterRole?: string): T {
        if (requesterRole !== 'SUPER_ADMIN' && user && user.showEmail === false) {
            return { ...user, email: undefined };
        }
        return user;
    }

    async create(createUserDto: CreateUserDto) {
        const email = createUserDto.email.trim().toLowerCase();
        const existingUser = await this.prisma.user.findFirst({
            where: {
                email: {
                    equals: email,
                    mode: 'insensitive',
                },
            },
        });

        if (existingUser) {
            throw new ConflictException('Email already exists');
        }

        const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

        try {
            const user = await this.prisma.user.create({
                data: {
                    ...createUserDto,
                    email,
                    password: hashedPassword,
                },
                select: {
                    id: true,
                    email: true,
                    showEmail: true,
                    firstName: true,
                    lastName: true,
                    role: true,
                    phone: true,
                    isActive: true,
                    managerId: true,
                    createdAt: true,
                },
            });

            return user;
        } catch (error: any) {
            // Handle Prisma unique constraint error (P2002)
            if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
                throw new ConflictException('Email already exists');
            }
            throw error;
        }
    }

    async findAll(role?: Role, requesterRole?: string) {
        const where = role ? { role } : {};

        const users = await this.prisma.user.findMany({
            where,
            select: {
                id: true,
                email: true,
                showEmail: true,
                firstName: true,
                lastName: true,
                role: true,
                phone: true,
                avatar: true,
                isActive: true,
                managerId: true,
                manager: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        showEmail: true,
                    },
                },
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        return users.map((u: any) => {
            const masked = this.maskEmail(u as any, requesterRole) as any;
            if (masked.manager) {
                masked.manager = this.maskEmail(masked.manager, requesterRole);
            }
            return masked;
        });
    }

    async getUserOptions(
        params: { role?: Role; search?: string; page?: number; limit?: number },
        requesterRole?: string,
    ) {
        const page = Math.max(params.page ?? 1, 1);
        const limit = Math.min(Math.max(params.limit ?? 50, 1), 200);
        const skip = (page - 1) * limit;

        const where: any = {
            ...(params.role ? { role: params.role } : {}),
            ...(params.search
                ? {
                    OR: [
                        { firstName: { contains: params.search, mode: 'insensitive' } },
                        { lastName: { contains: params.search, mode: 'insensitive' } },
                        { email: { contains: params.search, mode: 'insensitive' } },
                    ],
                }
                : {}),
        };

        const [items, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                select: {
                    id: true,
                    email: true,
                    showEmail: true,
                    firstName: true,
                    lastName: true,
                    role: true,
                    isActive: true,
                },
                orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
                skip,
                take: limit,
            }),
            this.prisma.user.count({ where }),
        ]);

        return {
            data: items.map((u: any) => this.maskEmail(u, requesterRole)),
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async findOne(id: string, requesterRole?: string) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                showEmail: true,
                firstName: true,
                lastName: true,
                role: true,
                phone: true,
                avatar: true,
                isActive: true,
                managerId: true,
                manager: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        showEmail: true,
                    },
                },
                employees: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        showEmail: true,
                        role: true,
                    },
                },
                createdAt: true,
                updatedAt: true,
            },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const masked: any = this.maskEmail(user as any, requesterRole);
        if (masked.manager) masked.manager = this.maskEmail(masked.manager, requesterRole);
        if (masked.employees?.length) masked.employees = masked.employees.map((e: any) => this.maskEmail(e, requesterRole));
        return masked;
    }

    async findByEmail(email: string) {
        return this.prisma.user.findUnique({
            where: { email },
        });
    }

    async update(id: string, updateUserDto: UpdateUserDto) {
        const user = await this.prisma.user.findUnique({ where: { id } });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const nextEmail = updateUserDto.email ? updateUserDto.email.trim().toLowerCase() : undefined;

        if (nextEmail && nextEmail !== user.email) {
            const existingUser = await this.prisma.user.findFirst({
                where: {
                    email: {
                        equals: nextEmail,
                        mode: 'insensitive',
                    },
                },
            });
            if (existingUser) {
                throw new ConflictException('Email already exists');
            }
        }

        const data: any = { ...updateUserDto };
        if (nextEmail) {
            data.email = nextEmail;
        }
        if (updateUserDto.password) {
            data.password = await bcrypt.hash(updateUserDto.password, 10);
        }

        return this.prisma.user.update({
            where: { id },
            data,
            select: {
                id: true,
                email: true,
                showEmail: true,
                firstName: true,
                lastName: true,
                role: true,
                phone: true,
                avatar: true,
                isActive: true,
                managerId: true,
                updatedAt: true,
            },
        });
    }

    async assignManager(employeeId: string, managerId: string) {
        const employee = await this.prisma.user.findUnique({ where: { id: employeeId } });
        if (!employee) {
            throw new NotFoundException('Employee not found');
        }

        if (employee.role === Role.SUPER_ADMIN) {
            throw new BadRequestException('Cannot assign manager to super admin');
        }

        const manager = await this.prisma.user.findUnique({ where: { id: managerId } });
        if (!manager) {
            throw new NotFoundException('Manager not found');
        }

        if (manager.role === Role.EMPLOYEE) {
            throw new BadRequestException('Cannot assign an employee as manager');
        }

        return this.prisma.user.update({
            where: { id: employeeId },
            data: { managerId },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                managerId: true,
                manager: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });
    }

    async deactivate(id: string) {
        const user = await this.prisma.user.findUnique({ where: { id } });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return this.prisma.user.update({
            where: { id },
            data: { isActive: false },
            select: {
                id: true,
                email: true,
                isActive: true,
            },
        });
    }

    async activate(id: string) {
        const user = await this.prisma.user.findUnique({ where: { id } });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return this.prisma.user.update({
            where: { id },
            data: { isActive: true },
            select: {
                id: true,
                email: true,
                isActive: true,
            },
        });
    }

    async getTeamMembers(managerId: string, requesterRole?: string) {
        const users = await this.prisma.user.findMany({
            where: { managerId },
            select: {
                id: true,
                email: true,
                showEmail: true,
                firstName: true,
                lastName: true,
                role: true,
                phone: true,
                avatar: true,
                isActive: true,
                createdAt: true,
            },
        });

        return users.map((u: any) => this.maskEmail(u, requesterRole));
    }

    async changePassword(userId: string, currentPassword: string, newPassword: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordValid) {
            throw new BadRequestException('Current password is incorrect');
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        return this.prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
            },
        });
    }

    async getManagers(requesterRole?: string) {
        const users = await this.prisma.user.findMany({
            where: {
                role: Role.MANAGER,
                isActive: true,
            },
            select: {
                id: true,
                email: true,
                showEmail: true,
                firstName: true,
                lastName: true,
                role: true,
            },
        });

        return users.map((u: any) => this.maskEmail(u, requesterRole));
    }
}
