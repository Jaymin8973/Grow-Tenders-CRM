import {
    IsNotEmpty,
    IsString,
    IsEnum,
    IsOptional,
    IsNumber,
    IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ActivityType, ActivityStatus } from '@prisma/client';

export class CreateActivityDto {
    @ApiProperty({ example: 'Follow-up call with client' })
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiProperty({ enum: ActivityType })
    @IsEnum(ActivityType)
    @IsNotEmpty()
    type: ActivityType;

    @ApiPropertyOptional({ enum: ActivityStatus, default: ActivityStatus.SCHEDULED })
    @IsEnum(ActivityStatus)
    @IsOptional()
    status?: ActivityStatus;

    @ApiPropertyOptional({ example: 'Discuss pricing and contract terms' })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({ example: '2024-02-15T10:00:00Z' })
    @IsDateString()
    @IsNotEmpty()
    scheduledAt: string;

    @ApiPropertyOptional({ example: 30 })
    @IsNumber()
    @IsOptional()
    duration?: number;

    @ApiPropertyOptional({ example: 'Zoom Meeting' })
    @IsString()
    @IsOptional()
    location?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    assigneeId?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    leadId?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    customerId?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    dealId?: string;
}
