import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { EmailService } from '../email/email.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
        private configService: ConfigService,
        private emailService: EmailService,
        private auditService: AuditService,
    ) { }

    async login(loginDto: LoginDto) {
        const { email, password, otp } = loginDto;

        const user = await this.prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            this.auditService.log({
                userId: '000000000000000000000000',
                action: 'AUTH_LOGIN_FAILED',
                module: 'auth',
                newValues: { email },
            }).catch(() => { });
            throw new UnauthorizedException('Invalid credentials');
        }

        if (!user.isActive) {
            this.auditService.log({
                userId: user.id,
                action: 'AUTH_LOGIN_FAILED',
                module: 'auth',
                newValues: { reason: 'ACCOUNT_DEACTIVATED' },
            }).catch(() => { });
            throw new UnauthorizedException('Account is deactivated');
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            this.auditService.log({
                userId: user.id,
                action: 'AUTH_LOGIN_FAILED',
                module: 'auth',
                newValues: { reason: 'INVALID_PASSWORD' },
            }).catch(() => { });
            throw new UnauthorizedException('Invalid credentials');
        }

        // SUPER_ADMIN requires OTP verification (2-step login)
        if (user.role === 'SUPER_ADMIN') {
            const issueOtp = async () => {
                const otpCode = String(Math.floor(100000 + Math.random() * 900000));
                const otpHash = await bcrypt.hash(otpCode, 10);
                const ttlMinutes = Number(this.configService.get<string>('SUPER_ADMIN_OTP_TTL_MINUTES') || '10');
                const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

                // Invalidate any previous unused OTPs for this user
                await this.prisma.superAdminLoginOtp.updateMany({
                    where: {
                        userId: user.id,
                        consumedAt: null,
                    },
                    data: { consumedAt: new Date() },
                });

                const otpRow = await this.prisma.superAdminLoginOtp.create({
                    data: {
                        userId: user.id,
                        otpHash,
                        expiresAt,
                    },
                });

                const sent = await this.emailService.sendEmail({
                    to: user.email,
                    subject: 'Your Super Admin Login OTP',
                    html: `<p>Your OTP is <b>${otpCode}</b>.</p><p>This OTP will expire in ${ttlMinutes} minutes.</p>`,
                });

                if (!sent) {
                    throw new BadRequestException('Failed to send OTP email. Please try again.');
                }

                this.auditService.log({
                    userId: user.id,
                    action: 'AUTH_OTP_SENT',
                    module: 'auth',
                    entityId: otpRow.id,
                }).catch(() => { });

                return {
                    otpRequired: true,
                    userId: user.id,
                    email: user.email,
                    otpSessionId: otpRow.id,
                    message: 'OTP sent to email',
                };
            };

            if (!otp) {
                return issueOtp();
            }

            const normalizedOtp = String(otp).trim().replace(/\s+/g, '');

            const otpSessionId = (loginDto as any)?.otpSessionId as string | undefined;

            if (!otpSessionId) {
                // If frontend doesn't send session id, issue a new OTP to avoid verifying against the wrong record
                return issueOtp();
            }

            const otpRow = await this.prisma.superAdminLoginOtp.findUnique({
                where: { id: otpSessionId },
            });

            if (!otpRow) {
                // If user is trying to verify but no OTP exists, automatically issue a fresh OTP.
                return issueOtp();
            }

            if (otpRow.userId !== user.id) {
                this.auditService.log({
                    userId: user.id,
                    action: 'AUTH_OTP_FAILED',
                    module: 'auth',
                    entityId: otpSessionId,
                    newValues: { reason: 'INVALID_SESSION' },
                }).catch(() => { });
                throw new UnauthorizedException('Invalid OTP session');
            }

            if (otpRow.consumedAt) {
                return issueOtp();
            }

            if (otpRow.expiresAt.getTime() < Date.now()) {
                await this.prisma.superAdminLoginOtp.update({
                    where: { id: otpRow.id },
                    data: { consumedAt: new Date() },
                });

                this.auditService.log({
                    userId: user.id,
                    action: 'AUTH_OTP_FAILED',
                    module: 'auth',
                    entityId: otpRow.id,
                    newValues: { reason: 'OTP_EXPIRED' },
                }).catch(() => { });
                throw new UnauthorizedException('OTP expired. Please request a new OTP.');
            }

            const maxAttempts = Number(this.configService.get<string>('SUPER_ADMIN_OTP_MAX_ATTEMPTS') || '5');
            if (otpRow.attempts >= maxAttempts) {
                await this.prisma.superAdminLoginOtp.update({
                    where: { id: otpRow.id },
                    data: { consumedAt: new Date() },
                });

                this.auditService.log({
                    userId: user.id,
                    action: 'AUTH_OTP_FAILED',
                    module: 'auth',
                    entityId: otpRow.id,
                    newValues: { reason: 'MAX_ATTEMPTS' },
                }).catch(() => { });
                throw new UnauthorizedException('Too many invalid attempts. Please request a new OTP.');
            }

            const isOtpValid = await bcrypt.compare(normalizedOtp, otpRow.otpHash);
            if (!isOtpValid) {
                await this.prisma.superAdminLoginOtp.update({
                    where: { id: otpRow.id },
                    data: { attempts: { increment: 1 } },
                });
                this.logger.warn(`Invalid SUPER_ADMIN OTP attempt. userId=${user.id} attempts=${otpRow.attempts + 1}`);

                this.auditService.log({
                    userId: user.id,
                    action: 'AUTH_OTP_FAILED',
                    module: 'auth',
                    entityId: otpRow.id,
                }).catch(() => { });
                throw new UnauthorizedException('Invalid OTP');
            }

            await this.prisma.superAdminLoginOtp.update({
                where: { id: otpRow.id },
                data: { consumedAt: new Date() },
            });

            this.auditService.log({
                userId: user.id,
                action: 'AUTH_OTP_VERIFIED',
                module: 'auth',
                entityId: otpRow.id,
            }).catch(() => { });
        }

        const tokens = await this.generateTokens(user.id, user.email, user.role);

        await this.updateRefreshToken(user.id, tokens.refreshToken);

        this.auditService.log({
            userId: user.id,
            action: 'AUTH_LOGIN_SUCCESS',
            module: 'auth',
        }).catch(() => { });

        return {
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                avatar: user.avatar,
            },
            ...tokens,
        };
    }

    async logout(userId: string) {
        await this.prisma.user.update({
            where: { id: userId },
            data: { refreshToken: null },
        });

        this.auditService.log({
            userId,
            action: 'AUTH_LOGOUT',
            module: 'auth',
        }).catch(() => { });

        return { message: 'Logged out successfully' };
    }

    async refreshTokens(userId: string, refreshToken: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user || !user.refreshToken) {
            this.auditService.log({
                userId,
                action: 'AUTH_REFRESH_FAILED',
                module: 'auth',
                newValues: { reason: 'NO_REFRESH_TOKEN' },
            }).catch(() => { });
            throw new UnauthorizedException('Access denied');
        }

        const refreshTokenMatches = await bcrypt.compare(refreshToken, user.refreshToken);

        if (!refreshTokenMatches) {
            this.auditService.log({
                userId,
                action: 'AUTH_REFRESH_FAILED',
                module: 'auth',
                newValues: { reason: 'MISMATCH' },
            }).catch(() => { });
            throw new UnauthorizedException('Access denied');
        }

        const tokens = await this.generateTokens(user.id, user.email, user.role);
        await this.updateRefreshToken(user.id, tokens.refreshToken);

        this.auditService.log({
            userId: user.id,
            action: 'AUTH_REFRESH_SUCCESS',
            module: 'auth',
        }).catch(() => { });

        return tokens;
    }

    async validateUser(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                isActive: true,
                managerId: true,
            },
        });

        if (!user || !user.isActive) {
            throw new UnauthorizedException('User not found or inactive');
        }

        return user;
    }

    private async generateTokens(userId: string, email: string, role: string) {
        const payload = { sub: userId, email, role };

        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload as any, {
                secret: this.configService.get<string>('JWT_SECRET'),
                expiresIn: (this.configService.get<string>('JWT_EXPIRATION') || '15m'),
            } as any),
            this.jwtService.signAsync(payload as any, {
                secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
                expiresIn: (this.configService.get<string>('JWT_REFRESH_EXPIRATION') || '7d'),
            } as any),
        ]);

        return { accessToken, refreshToken };
    }

    private async updateRefreshToken(userId: string, refreshToken: string) {
        const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
        await this.prisma.user.update({
            where: { id: userId },
            data: { refreshToken: hashedRefreshToken },
        });
    }
}
