import { IsNotEmpty, IsString, IsOptional, IsNumber, IsDateString, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TenderStatus } from '@prisma/client';

export class CreateTenderDto {
    @ApiProperty({ example: 'IT Infrastructure Upgrade Tender' })
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiProperty({ example: 'Complete infrastructure upgrade including servers, networking...' })
    @IsString()
    @IsNotEmpty()
    description: string;

    @ApiPropertyOptional({ enum: TenderStatus, default: TenderStatus.DRAFT })
    @IsEnum(TenderStatus)
    @IsOptional()
    status?: TenderStatus;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    categoryId: string;

    @ApiProperty({ example: '2024-02-01' })
    @IsDateString()
    @IsNotEmpty()
    openDate: string;

    @ApiProperty({ example: '2024-03-01' })
    @IsDateString()
    @IsNotEmpty()
    closeDate: string;

    @ApiPropertyOptional({ example: 500000 })
    @IsNumber()
    @IsOptional()
    value?: number;

    @ApiPropertyOptional({ example: 'Must have 5+ years experience...' })
    @IsString()
    @IsOptional()
    requirements?: string;
}
