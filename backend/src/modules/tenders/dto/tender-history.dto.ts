import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, MaxLength } from 'class-validator';

export enum TenderHistoryAction {
    VIEWED = 'viewed',
    SAVED = 'saved',
    UNSAVED = 'unsaved',
    BID_SUBMITTED = 'bid_submitted',
    STATUS_CHANGED = 'status_changed',
    NOTE_ADDED = 'note_added',
}

export class CreateTenderHistoryDto {
    @ApiProperty({ example: 'viewed', enum: TenderHistoryAction })
    @IsEnum(TenderHistoryAction)
    action: TenderHistoryAction;

    @ApiProperty({ example: 'Previous status', required: false })
    @IsOptional()
    @IsString()
    oldValue?: string;

    @ApiProperty({ example: 'New status', required: false })
    @IsOptional()
    @IsString()
    newValue?: string;

    @ApiProperty({ example: 'Additional notes', required: false })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    notes?: string;
}
