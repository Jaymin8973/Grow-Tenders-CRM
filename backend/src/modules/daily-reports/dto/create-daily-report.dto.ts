import { Type } from 'class-transformer';
import { IsString, IsOptional, IsArray, IsNumber, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PaymentDetailDto {
    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    customerId?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    leadId?: string;

    @ApiProperty({ required: false })
    @IsNumber()
    @IsOptional()
    amount?: number;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    notes?: string;
}

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
    @IsNumber()
    callCount?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    avgTalkTime?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    leadsGenerated?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsArray()
    paymentReceivedFromCustomerIds?: string[];

    @ApiProperty({ required: false })
    @IsOptional()
    @IsArray()
    leadIds?: string[];

    @ApiProperty({ required: false, type: [PaymentDetailDto] })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => PaymentDetailDto)
    paymentDetails?: PaymentDetailDto[];
}
