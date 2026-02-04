import { IsString, IsOptional, IsDateString, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateFollowUpDto {
    @ApiPropertyOptional({ description: 'Description of the follow-up' })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiPropertyOptional({ description: 'Scheduled date for the follow-up' })
    @IsDateString()
    @IsOptional()
    scheduledAt?: string;

    @ApiPropertyOptional({ description: 'Status of the follow-up', enum: ['SCHEDULED', 'COMPLETED', 'CANCELLED'] })
    @IsString()
    @IsOptional()
    @IsIn(['SCHEDULED', 'COMPLETED', 'CANCELLED'])
    status?: string;

    @ApiPropertyOptional({ description: 'Completed date' })
    @IsDateString()
    @IsOptional()
    completedAt?: string;
}
