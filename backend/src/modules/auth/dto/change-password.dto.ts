import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength } from 'class-validator';

export class ChangePasswordDto {
    @ApiProperty({ example: 'currentPassword123' })
    @IsString()
    currentPassword: string;

    @ApiProperty({ example: 'newPassword456' })
    @IsString()
    @MinLength(8, { message: 'Password must be at least 8 characters' })
    @MaxLength(50, { message: 'Password must not exceed 50 characters' })
    newPassword: string;
}
