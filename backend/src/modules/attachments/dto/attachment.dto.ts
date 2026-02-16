import { IsOptional, IsString, IsMongoId } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UploadAttachmentDto {
    @ApiPropertyOptional({ description: 'Lead ID' })
    @IsMongoId()
    @IsOptional()
    leadId?: string;

    @ApiPropertyOptional({ description: 'Customer ID' })
    @IsMongoId()
    @IsOptional()
    customerId?: string;



    @ApiPropertyOptional({ description: 'Tender ID' })
    @IsMongoId()
    @IsOptional()
    tenderId?: string;
}
