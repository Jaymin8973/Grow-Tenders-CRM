import { IsOptional, IsString, IsMongoId } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateNoteDto {
    @ApiProperty({ description: 'Note content' })
    @IsString()
    content: string;

    @ApiPropertyOptional({ description: 'Lead ID' })
    @IsMongoId()
    @IsOptional()
    leadId?: string;

    @ApiPropertyOptional({ description: 'Customer ID' })
    @IsMongoId()
    @IsOptional()
    customerId?: string;

    @ApiPropertyOptional({ description: 'Deal ID' })
    @IsMongoId()
    @IsOptional()
    dealId?: string;
}

export class UpdateNoteDto {
    @ApiProperty({ description: 'Note content' })
    @IsString()
    content: string;
}
