import { Injectable, UnauthorizedException, BadRequestException, Logger, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { LeadStatus, LeadSource } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CustomerRegisterDto } from './dto/customer-register.dto';
import { CustomerLoginDto } from './dto/customer-login.dto';

@Injectable()
export class PublicAuthService {
    private readonly logger = new Logger(PublicAuthService.name);

    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
        private configService: ConfigService,
    ) { }

    async register(registerDto: CustomerRegisterDto) {
        const { email, password, firstName, lastName, phone, company } = registerDto;

        // Check if customer already exists
        const existingCustomer = await this.prisma.customer.findUnique({
            where: { email },
        });

        if (existingCustomer) {
            throw new ConflictException('Email already registered');
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create customer
        const customer = await this.prisma.customer.create({
            data: {
                email,
                passwordHash,
                firstName,
                lastName,
                phone,
                company,
                emailVerified: false,
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                company: true,
                createdAt: true,
            },
        });

        // Create Lead for CRM tracking - website registration
        try {
            await this.prisma.lead.create({
                data: {
                    title: `${firstName} ${lastName}`,
                    firstName,
                    lastName,
                    email,
                    mobile: phone,
                    company,
                    status: LeadStatus.HOT_LEAD,
                    source: LeadSource.WEBSITE,
                    description: 'Lead created from website registration',
                },
            });
            this.logger.log(`Lead created for website registration: ${email}`);
        } catch (leadError) {
            // Log error but don't fail registration if lead creation fails
            this.logger.warn(`Failed to create lead for ${email}: ${leadError instanceof Error ? leadError.message : leadError}`);
        }

        // Generate tokens
        const tokens = await this.generateTokens(customer.id, customer.email);

        // Save refresh token
        await this.updateRefreshToken(customer.id, tokens.refreshToken);

        this.logger.log(`Customer registered: ${customer.email}`);

        return {
            message: 'Registration successful',
            customer,
            ...tokens,
        };
    }

    async login(loginDto: CustomerLoginDto) {
        const { email, password } = loginDto;

        const customer = await this.prisma.customer.findUnique({
            where: { email },
        });

        if (!customer || !customer.passwordHash) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const isPasswordValid = await bcrypt.compare(password, customer.passwordHash);

        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Update last login
        await this.prisma.customer.update({
            where: { id: customer.id },
            data: { lastLoginAt: new Date() },
        });

        // Generate tokens
        const tokens = await this.generateTokens(customer.id, customer.email);
        await this.updateRefreshToken(customer.id, tokens.refreshToken);

        this.logger.log(`Customer logged in: ${customer.email}`);

        return {
            customer: {
                id: customer.id,
                email: customer.email,
                firstName: customer.firstName,
                lastName: customer.lastName,
                phone: customer.phone,
                company: customer.company,
                subscriptionActive: customer.subscriptionActive,
                planType: customer.planType,
            },
            ...tokens,
        };
    }

    async refreshTokens(refreshToken: string) {
        try {
            // Verify the refresh token
            const payload = await this.jwtService.verifyAsync(refreshToken, {
                secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
            });

            const customerId = payload.sub;

            const customer = await this.prisma.customer.findUnique({
                where: { id: customerId },
            });

            if (!customer || !customer.refreshToken) {
                throw new UnauthorizedException('Access denied');
            }

            const refreshTokenMatches = await bcrypt.compare(refreshToken, customer.refreshToken);

            if (!refreshTokenMatches) {
                throw new UnauthorizedException('Access denied');
            }

            const tokens = await this.generateTokens(customer.id, customer.email);
            await this.updateRefreshToken(customer.id, tokens.refreshToken);

            return tokens;
        } catch (error) {
            throw new UnauthorizedException('Invalid refresh token');
        }
    }

    async logout(customerId: string) {
        await this.prisma.customer.update({
            where: { id: customerId },
            data: { refreshToken: null },
        });

        return { message: 'Logged out successfully' };
    }

    async getProfile(customerId: string) {
        const customer = await this.prisma.customer.findUnique({
            where: { id: customerId },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                company: true,
                position: true,
                address: true,
                city: true,
                state: true,
                country: true,
                industry: true,
                subscriptionActive: true,
                subscriptionStartDate: true,
                subscriptionEndDate: true,
                planType: true,
                categoryPreferences: true,
                statePreferences: true,
                createdAt: true,
                tenderSubscriptions: {
                    where: { isActive: true },
                    select: {
                        id: true,
                        categories: true,
                        states: true,
                        startDate: true,
                        endDate: true,
                        durationMonths: true,
                    },
                },
            },
        });

        if (!customer) {
            throw new UnauthorizedException('Customer not found');
        }

        return customer;
    }

    async updateProfile(customerId: string, updateDto: any) {
        // Remove undefined values
        const updateData: any = {};
        if (updateDto.firstName !== undefined) updateData.firstName = updateDto.firstName;
        if (updateDto.lastName !== undefined) updateData.lastName = updateDto.lastName;
        if (updateDto.phone !== undefined) updateData.phone = updateDto.phone;
        if (updateDto.company !== undefined) updateData.company = updateDto.company;
        if (updateDto.position !== undefined) updateData.position = updateDto.position;
        if (updateDto.address !== undefined) updateData.address = updateDto.address;
        if (updateDto.city !== undefined) updateData.city = updateDto.city;
        if (updateDto.state !== undefined) updateData.state = updateDto.state;

        const customer = await this.prisma.customer.update({
            where: { id: customerId },
            data: updateData,
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                company: true,
                position: true,
                address: true,
                city: true,
                state: true,
                country: true,
                industry: true,
                subscriptionActive: true,
                subscriptionStartDate: true,
                subscriptionEndDate: true,
                planType: true,
            },
        });

        return customer;
    }

    async changePassword(customerId: string, changePasswordDto: any) {
        const customer = await this.prisma.customer.findUnique({
            where: { id: customerId },
            select: { id: true, passwordHash: true },
        });

        if (!customer || !customer.passwordHash) {
            throw new BadRequestException('Customer not found or no password set');
        }

        // Verify current password
        const isPasswordValid = await bcrypt.compare(
            changePasswordDto.currentPassword,
            customer.passwordHash,
        );

        if (!isPasswordValid) {
            throw new BadRequestException('Current password is incorrect');
        }

        // Hash new password
        const newPasswordHash = await bcrypt.hash(changePasswordDto.newPassword, 10);

        // Update password
        await this.prisma.customer.update({
            where: { id: customerId },
            data: { passwordHash: newPasswordHash },
        });

        return { message: 'Password changed successfully' };
    }

    private async generateTokens(customerId: string, email: string) {
        const payload = { sub: customerId, email, type: 'customer' };

        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload as any, {
                secret: this.configService.get<string>('JWT_SECRET'),
                expiresIn: this.configService.get<string>('JWT_EXPIRATION') || '15m',
            } as any),
            this.jwtService.signAsync(payload as any, {
                secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
                expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION') || '7d',
            } as any),
        ]);

        return { accessToken, refreshToken };
    }

    private async updateRefreshToken(customerId: string, refreshToken: string) {
        const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
        await this.prisma.customer.update({
            where: { id: customerId },
            data: { refreshToken: hashedRefreshToken },
        });
    }
}
