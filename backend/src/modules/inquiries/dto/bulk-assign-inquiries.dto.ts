import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsNotEmpty, IsString } from 'class-validator';

export class BulkAssignInquiriesDto {
    @ApiProperty({ description: 'Array of inquiry IDs to assign', type: [String] })
    @IsArray()
    @ArrayMinSize(1, { message: 'At least one inquiry ID is required' })
    @IsString({ each: true })
    inquiryIds: string[];

    @ApiProperty({ description: 'Employee user ID to assign inquiries to' })
    @IsNotEmpty()
    @IsString()
    assigneeId: string;
}
