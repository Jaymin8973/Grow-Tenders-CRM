import {
    IsEmail,
    IsNotEmpty,
    IsString,
    IsEnum,
    IsOptional,
    IsNumber,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LeadStatus, LeadSource } from '@prisma/client';

export class CreateLeadDto {
    @ApiProperty({ example: 'New Business Opportunity' })
    @IsString()
    @IsNotEmpty()
    title: string;

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

    @ApiPropertyOptional({ enum: LeadStatus, default: LeadStatus.NEW })
    @IsEnum(LeadStatus)
    @IsOptional()
    status?: LeadStatus;

    @ApiPropertyOptional({ enum: LeadSource, default: LeadSource.OTHER })
    @IsEnum(LeadSource)
    @IsOptional()
    source?: LeadSource;

    @ApiPropertyOptional({ example: 50000 })
    @IsNumber()
    @IsOptional()
    value?: number;

    @ApiPropertyOptional({ example: 'Interested in our enterprise solution' })
    @IsString()
    @IsOptional()
    description?: string;

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

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    assigneeId?: string;
}
