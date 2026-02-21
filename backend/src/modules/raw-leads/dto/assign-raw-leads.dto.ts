import { IsString, IsNotEmpty, IsArray, ArrayMinSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignRawLeadsDto {
    @ApiProperty({ example: ['id1', 'id2'] })
    @IsArray()
    @ArrayMinSize(1)
    @IsString({ each: true })
    rawLeadIds: string[];

    @ApiProperty({ example: 'user-id-here' })
    @IsString()
    @IsNotEmpty()
    assigneeId: string;
}
