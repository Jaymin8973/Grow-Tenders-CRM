import { IsString, IsNotEmpty, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFollowUpDto {
    @ApiProperty({ description: 'Lead ID for the follow-up' })
    @IsString()
    @IsNotEmpty()
    leadId: string;

    @ApiProperty({ description: 'Description of the follow-up' })
    @IsString()
    @IsNotEmpty()
    description: string;

    @ApiProperty({ description: 'Scheduled date for the follow-up' })
    @IsDateString()
    @IsNotEmpty()
    scheduledAt: string;
}
