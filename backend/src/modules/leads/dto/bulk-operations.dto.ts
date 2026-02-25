import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString, ArrayMinSize } from 'class-validator';

export class BulkAssignLeadsDto {
    @ApiProperty({ description: 'Array of lead IDs to assign', type: [String] })
    @IsArray()
    @ArrayMinSize(1, { message: 'At least one lead ID is required' })
    @IsString({ each: true })
    leadIds: string[];

    @ApiProperty({ description: 'User ID to assign leads to' })
    @IsNotEmpty()
    @IsString()
    assigneeId: string;

    @ApiProperty({ description: 'If true, sets the next follow up to today', required: false })
    isDailyTask?: boolean;
}

export class BulkDeleteLeadsDto {
    @ApiProperty({ description: 'Array of lead IDs to delete', type: [String] })
    @IsArray()
    @ArrayMinSize(1, { message: 'At least one lead ID is required' })
    @IsString({ each: true })
    leadIds: string[];
}
