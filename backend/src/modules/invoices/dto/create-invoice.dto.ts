import {
    IsNotEmpty,
    IsString,
    IsOptional,
    IsNumber,
    IsArray,
    ValidateNested,
    IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class LineItemDto {
    @ApiProperty({ example: 'Web Development Services' })
    @IsString()
    @IsNotEmpty()
    description: string;

    @ApiProperty({ example: 10 })
    @IsNumber()
    @IsNotEmpty()
    quantity: number;

    @ApiProperty({ example: 1500 })
    @IsNumber()
    @IsNotEmpty()
    unitPrice: number;
}

export class CreateInvoiceDto {
    @ApiProperty({ example: 'Acme Corporation' })
    @IsString()
    @IsNotEmpty()
    companyName: string;

    @ApiPropertyOptional({ example: '123 Business St, City, State 12345' })
    @IsString()
    @IsOptional()
    companyAddress?: string;

    @ApiPropertyOptional({ example: '+1 555-123-4567' })
    @IsString()
    @IsOptional()
    companyPhone?: string;

    @ApiPropertyOptional({ example: 'billing@acme.com' })
    @IsString()
    @IsOptional()
    companyEmail?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    companyLogo?: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    customerId: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    dealId?: string;

    @ApiPropertyOptional({ example: 10 })
    @IsNumber()
    @IsOptional()
    taxRate?: number;

    @ApiPropertyOptional({ example: 500 })
    @IsNumber()
    @IsOptional()
    discount?: number;

    @ApiPropertyOptional({ example: 'fixed' })
    @IsString()
    @IsOptional()
    discountType?: string;

    @ApiPropertyOptional({ example: 'Net 30' })
    @IsString()
    @IsOptional()
    paymentTerms?: string;

    @ApiPropertyOptional({ example: '2024-03-15' })
    @IsDateString()
    @IsOptional()
    dueDate?: string;

    @ApiPropertyOptional({ example: 'Thank you for your business!' })
    @IsString()
    @IsOptional()
    notes?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    termsConditions?: string;

    @ApiProperty({ type: [LineItemDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => LineItemDto)
    lineItems: LineItemDto[];
}
