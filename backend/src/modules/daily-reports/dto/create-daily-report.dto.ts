import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDailyReportDto {
    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    title?: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    content: string;

    @ApiProperty({ required: false })
    @IsOptional()
    callCount?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    avgTalkTime?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    paymentReceivedFromCustomerIds?: string[];
}
