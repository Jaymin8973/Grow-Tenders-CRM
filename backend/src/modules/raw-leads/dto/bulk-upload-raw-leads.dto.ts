import { IsString, IsNotEmpty, IsOptional, ValidateNested, IsArray, ArrayMinSize } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class BulkUploadRawLeadItemDto {
    @ApiProperty({ example: '+919876543210' })
    @IsString()
    @IsNotEmpty()
    phone: string;

    @ApiPropertyOptional({ example: 'Some note' })
    @IsString()
    @IsOptional()
    notes?: string;
}

export class BulkUploadRawLeadsDto {
    @ApiProperty({ type: [BulkUploadRawLeadItemDto] })
    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => BulkUploadRawLeadItemDto)
    leads: BulkUploadRawLeadItemDto[];

    @ApiPropertyOptional({ example: 'Campaign X Data' })
    @IsString()
    @IsOptional()
    batchName?: string;

    @ApiPropertyOptional({ example: 'Facebook Ads' })
    @IsString()
    @IsOptional()
    source?: string;

    @ApiPropertyOptional({ example: 'user-id-to-auto-assign' })
    @IsString()
    @IsOptional()
    assigneeId?: string;
}
