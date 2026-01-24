import { IsNotEmpty, IsString, IsDateString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CompleteActivityDto {
    @ApiPropertyOptional({ example: 'Successfully discussed pricing, follow-up scheduled' })
    @IsString()
    @IsOptional()
    outcome?: string;
}

export class RescheduleActivityDto {
    @ApiProperty({ example: '2024-02-20T10:00:00Z' })
    @IsDateString()
    @IsNotEmpty()
    scheduledAt: string;
}
