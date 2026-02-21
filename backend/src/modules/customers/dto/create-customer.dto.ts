import {
    IsEmail,
    IsNotEmpty,
    IsString,
    IsOptional,
    IsNumber,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCustomerDto {
    @ApiProperty({ example: 'John' })
    @IsString()
    @IsNotEmpty()
    firstName: string;

    @ApiProperty({ example: 'Doe' })
    @IsString()
    @IsNotEmpty()
    lastName: string;

    @ApiProperty({ example: 'john.doe@company.com' })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiPropertyOptional({ example: '+1234567890' })
    @IsString()
    @IsOptional()
    phone?: string;

    @ApiPropertyOptional({ example: 'Acme Corp' })
    @IsString()
    @IsOptional()
    company?: string;

    @ApiPropertyOptional({ example: 'CEO' })
    @IsString()
    @IsOptional()
    position?: string;

    @ApiPropertyOptional({ example: '123 Main St' })
    @IsString()
    @IsOptional()
    address?: string;

    @ApiPropertyOptional({ example: 'New York' })
    @IsString()
    @IsOptional()
    city?: string;

    @ApiPropertyOptional({ example: 'NY' })
    @IsString()
    @IsOptional()
    state?: string;

    @ApiPropertyOptional({ example: 'USA' })
    @IsString()
    @IsOptional()
    country?: string;

    @ApiPropertyOptional({ example: 'https://acmecorp.com' })
    @IsString()
    @IsOptional()
    website?: string;

    @ApiPropertyOptional({ example: 'Technology' })
    @IsString()
    @IsOptional()
    industry?: string;

    @ApiPropertyOptional({ example: 5000000 })
    @IsNumber()
    @IsOptional()
    annualRevenue?: number;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    notes?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    assigneeId?: string;
}
