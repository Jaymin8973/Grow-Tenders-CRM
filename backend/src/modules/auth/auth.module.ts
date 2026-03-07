import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PublicAuthController } from './public-auth.controller';
import { PublicAuthService } from './public-auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { CustomerJwtStrategy } from './strategies/customer-jwt.strategy';
import { EmailModule } from '../email/email.module';
import { AuditModule } from '../audit/audit.module';

@Module({
    imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        EmailModule,
        AuditModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET'),
                signOptions: {
                    expiresIn: configService.get<string>('JWT_EXPIRATION') || '15m',
                } as any,
            }),
            inject: [ConfigService],
        }),
    ],
    controllers: [AuthController, PublicAuthController],
    providers: [AuthService, PublicAuthService, JwtStrategy, JwtRefreshStrategy, CustomerJwtStrategy],
    exports: [AuthService, PublicAuthService],
})
export class AuthModule { }
