import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async create(createUserDto: CreateUserDto) {
        const existingUser = await this.prisma.user.findUnique({
            where: { email: createUserDto.email },
        });

        if (existingUser) {
            throw new ConflictException('Email already exists');
        }

        const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

        const user = await this.prisma.user.create({
            data: {
                ...createUserDto,
                password: hashedPassword,
            },
            select: {
                id: true,
                email: true,
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
    }

    async findAll(role?: Role) {
        const where = role ? { role } : {};

        return this.prisma.user.findMany({
            where,
            select: {
                id: true,
                email: true,
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
                    },
                },
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: string) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
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
                    },
                },
                employees: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
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

        return user;
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

        if (updateUserDto.email && updateUserDto.email !== user.email) {
            const existingUser = await this.prisma.user.findUnique({
                where: { email: updateUserDto.email },
            });
            if (existingUser) {
                throw new ConflictException('Email already exists');
            }
        }

        const data: any = { ...updateUserDto };
        if (updateUserDto.password) {
            data.password = await bcrypt.hash(updateUserDto.password, 10);
        }

        return this.prisma.user.update({
            where: { id },
            data,
            select: {
                id: true,
                email: true,
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

    async getTeamMembers(managerId: string) {
        return this.prisma.user.findMany({
            where: { managerId },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                phone: true,
                avatar: true,
                isActive: true,
                createdAt: true,
            },
        });
    }

    async getManagers() {
        return this.prisma.user.findMany({
            where: {
                role: Role.MANAGER,
                isActive: true,
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
            },
        });
    }
}
