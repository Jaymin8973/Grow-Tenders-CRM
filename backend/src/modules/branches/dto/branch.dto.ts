import { IsString, IsOptional, IsBoolean, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBranchDto {
    @ApiProperty({ example: 'Head Office' })
    @IsString()
    name: string;

    @ApiProperty({ example: 'HO' })
    @IsString()
    code: string;

    @ApiPropertyOptional({ example: '123 Main Street, City' })
    @IsOptional()
    @IsString()
    address?: string;

    @ApiPropertyOptional({ example: '+919876543210' })
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiPropertyOptional({ example: 'headoffice@company.com' })
    @IsOptional()
    @IsEmail()
    email?: string;
}

export class UpdateBranchDto {
    @ApiPropertyOptional({ example: 'Head Office Updated' })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiPropertyOptional({ example: 'HO1' })
    @IsOptional()
    @IsString()
    code?: string;

    @ApiPropertyOptional({ example: '456 New Street, City' })
    @IsOptional()
    @IsString()
    address?: string;

    @ApiPropertyOptional({ example: '+919876543211' })
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiPropertyOptional({ example: 'newoffice@company.com' })
    @IsOptional()
    @IsEmail()
    email?: string;

    @ApiPropertyOptional({ example: true })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
