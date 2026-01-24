import { IsNotEmpty, IsString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { LeadStatus } from '@prisma/client';

export class AssignLeadDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    assigneeId: string;
}

export class UpdateLeadStatusDto {
    @ApiProperty({ enum: LeadStatus })
    @IsEnum(LeadStatus)
    @IsNotEmpty()
    status: LeadStatus;
}
