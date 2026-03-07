import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { LeadSource } from '@prisma/client';

export class BulkImportPhonesDto {
    @ApiProperty({ 
        example: ['9876543210', '9876543211', '9876543212'],
        description: 'Array of phone numbers (10 digits)'
    })
    @IsArray()
    @IsString({ each: true })
    @IsNotEmpty()
    phones: string[];

    @ApiPropertyOptional({ 
        enum: LeadSource, 
        default: LeadSource.COLD_CALL,
        description: 'Source of leads'
    })
    @IsEnum(LeadSource)
    @IsOptional()
    source?: LeadSource;

    @ApiPropertyOptional({ 
        example: 'Telecalling Campaign - March 2026',
        description: 'Description for all leads'
    })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiPropertyOptional({ 
        example: '507f1f77bcf86cd799439011',
        description: 'Assignee ID to assign all leads to'
    })
    @IsString()
    @IsOptional()
    assigneeId?: string;
}
