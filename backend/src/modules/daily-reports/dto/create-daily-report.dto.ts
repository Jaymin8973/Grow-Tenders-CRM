import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDailyReportDto {
    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    title?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    content?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    callCount?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    avgTalkTime?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    leadsGenerated?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    paymentReceivedFromCustomerIds?: string[];
}
