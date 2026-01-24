import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { InvoiceStatus } from '@prisma/client';

export class UpdateInvoiceStatusDto {
    @ApiProperty({ enum: InvoiceStatus })
    @IsEnum(InvoiceStatus)
    @IsNotEmpty()
    status: InvoiceStatus;
}
