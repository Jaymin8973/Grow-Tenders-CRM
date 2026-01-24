import { IsString, IsNumber, IsOptional, IsEnum, IsDateString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod, GstType, ReferenceType } from '@prisma/client';

export class CreatePaymentDto {
    @ApiProperty({ enum: ReferenceType, description: 'INTERNAL for existing customer, EXTERNAL for outside client' })
    @IsEnum(ReferenceType)
    referenceType: ReferenceType;

    @ApiPropertyOptional({ description: 'Customer ID for internal reference' })
    @IsOptional()
    @IsString()
    customerId?: string;

    @ApiPropertyOptional({ description: 'Customer name for external reference' })
    @IsOptional()
    @IsString()
    customerName?: string;

    @ApiPropertyOptional({ description: 'Company name' })
    @IsOptional()
    @IsString()
    companyName?: string;

    @ApiPropertyOptional({ description: 'Contact phone number' })
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiProperty({ description: 'Payment amount (base amount before GST)' })
    @IsNumber()
    @Min(0)
    amount: number;

    @ApiProperty({ enum: GstType, description: 'WITH_GST or WITHOUT_GST' })
    @IsEnum(GstType)
    gstType: GstType;

    @ApiPropertyOptional({ description: 'GST percentage (default 18%)' })
    @IsOptional()
    @IsNumber()
    @Min(0)
    gstPercentage?: number;

    @ApiPropertyOptional({ description: 'Payment date' })
    @IsOptional()
    @IsDateString()
    paymentDate?: string;

    @ApiProperty({ enum: PaymentMethod, description: 'Payment method' })
    @IsEnum(PaymentMethod)
    paymentMethod: PaymentMethod;

    @ApiPropertyOptional({ description: 'Transaction/cheque reference number' })
    @IsOptional()
    @IsString()
    referenceNumber?: string;

    @ApiPropertyOptional({ description: 'Additional notes' })
    @IsOptional()
    @IsString()
    notes?: string;

    @ApiPropertyOptional({ description: 'Invoice ID if payment is linked to invoice' })
    @IsOptional()
    @IsString()
    invoiceId?: string;
}
