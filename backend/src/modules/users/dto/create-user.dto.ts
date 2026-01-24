import { IsEmail, IsNotEmpty, IsString, IsEnum, IsOptional, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class CreateUserDto {
    @ApiProperty({ example: 'john@example.com' })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({ example: 'Password@123' })
    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    password: string;

    @ApiProperty({ example: 'John' })
    @IsString()
    @IsNotEmpty()
    firstName: string;

    @ApiProperty({ example: 'Doe' })
    @IsString()
    @IsNotEmpty()
    lastName: string;

    @ApiPropertyOptional({ enum: Role, default: Role.EMPLOYEE })
    @IsEnum(Role)
    @IsOptional()
    role?: Role;

    @ApiPropertyOptional({ example: '+1234567890' })
    @IsString()
    @IsOptional()
    phone?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    managerId?: string;
}
