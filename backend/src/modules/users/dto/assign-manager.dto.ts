import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignManagerDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    managerId: string;
}
