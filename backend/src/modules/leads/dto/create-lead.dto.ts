import {
    IsEmail,
    IsNotEmpty,
    IsString,
    IsEnum,
    IsOptional,
    IsNumber,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LeadStatus, LeadSource, LeadType } from '@prisma/client';

export class CreateLeadDto {
    @ApiProperty({ example: 'New Business Opportunity', required: false })
    @IsString()
    @IsOptional()
    title?: string;

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

    @ApiPropertyOptional({ enum: LeadType, default: LeadType.COLD })
    @IsEnum(LeadType)
    @IsOptional()
    type?: LeadType;



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



    @ApiPropertyOptional({ example: 'https://acmecorp.com' })
    @IsString()
    @IsOptional()
    website?: string;

    @ApiPropertyOptional({ example: 'Some key notes about the lead' })
    @IsString()
    @IsOptional()
    notes?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    assigneeId?: string;

    @ApiPropertyOptional({ example: 'Mr.' })
    @IsString()
    @IsOptional()
    salutation?: string;

    @ApiPropertyOptional({ example: '+1234567890' })
    @IsString()
    @IsOptional()
    mobile?: string;

    @ApiPropertyOptional({ example: '+1234567890' })
    @IsString()
    @IsOptional()
    fax?: string;

    @ApiPropertyOptional({ example: 'Sales' })
    @IsString()
    @IsOptional()
    department?: string;

    @ApiPropertyOptional({ example: '12345' })
    @IsString()
    @IsOptional()
    postalCode?: string;

    @ApiPropertyOptional({ example: 'Technology' })
    @IsString()
    @IsOptional()
    industry?: string;
}
