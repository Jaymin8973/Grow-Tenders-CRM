import { IsString, IsNotEmpty, IsOptional, IsEnum, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RawLeadStatus } from '@prisma/client';

export class CreateRawLeadDto {
    @ApiProperty({ example: '+919876543210' })
    @IsString()
    @IsNotEmpty()
    phone: string;

    @ApiPropertyOptional({ example: 'CSV Upload 2023-10' })
    @IsString()
    @IsOptional()
    batchName?: string;

    @ApiPropertyOptional({ example: 'Website Signup' })
    @IsString()
    @IsOptional()
    source?: string;

    @ApiPropertyOptional({ example: 'Some early notes' })
    @IsString()
    @IsOptional()
    notes?: string;

    @ApiPropertyOptional({ enum: RawLeadStatus, default: RawLeadStatus.UNTOUCHED })
    @IsEnum(RawLeadStatus)
    @IsOptional()
    status?: RawLeadStatus;
}
