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
    @IsNotEmpty()
    email: string;

    @ApiPropertyOptional({ example: 'Acme Corp' })
    @IsString()
    @IsOptional()
    company?: string;

    @ApiPropertyOptional({ example: '24XXXXX1234X1Z5' })
    @IsString()
    @IsOptional()
    gstin?: string;



    @ApiPropertyOptional({ enum: LeadStatus, default: LeadStatus.COLD_LEAD })
    @IsEnum(LeadStatus)
    @IsOptional()
    status?: LeadStatus;

    @ApiPropertyOptional({ enum: LeadSource, default: LeadSource.OTHER })
    @IsEnum(LeadSource)
    @IsOptional()
    source?: LeadSource;



    @ApiPropertyOptional({ example: 'Interested in our enterprise solution' })
    @IsString()
    @IsOptional()
    description?: string;



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



    @ApiPropertyOptional({ example: 'Technology' })
    @IsString()
    @IsOptional()
    industry?: string;

    @ApiPropertyOptional({ example: '2023-12-31T23:59:59Z' })
    @IsOptional()
    nextFollowUp?: Date;
}
