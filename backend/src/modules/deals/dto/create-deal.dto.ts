import {
    IsNotEmpty,
    IsString,
    IsEnum,
    IsOptional,
    IsNumber,
    IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DealStage } from '@prisma/client';

export class CreateDealDto {
    @ApiProperty({ example: 'Enterprise Software Deal' })
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiProperty({ example: 50000 })
    @IsNumber()
    @IsNotEmpty()
    value: number;

    @ApiPropertyOptional({ enum: DealStage, default: DealStage.QUALIFICATION })
    @IsEnum(DealStage)
    @IsOptional()
    stage?: DealStage;

    @ApiPropertyOptional({ example: 25 })
    @IsNumber()
    @IsOptional()
    probability?: number;

    @ApiPropertyOptional({ example: '2024-03-15' })
    @IsDateString()
    @IsOptional()
    expectedCloseDate?: string;

    @ApiPropertyOptional({ example: 'High-value enterprise deal for software license' })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    leadId?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    customerId?: string;
}
