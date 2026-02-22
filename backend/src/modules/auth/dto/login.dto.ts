import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
    @ApiProperty({ example: 'admin@example.com' })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({ example: 'Admin@123' })
    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    password: string;

    @ApiProperty({ required: false, description: 'OTP for SUPER_ADMIN login verification' })
    @IsOptional()
    @IsString()
    otp?: string;

    @ApiProperty({ required: false, description: 'OTP session id for SUPER_ADMIN login verification' })
    @IsOptional()
    @IsString()
    otpSessionId?: string;
}
