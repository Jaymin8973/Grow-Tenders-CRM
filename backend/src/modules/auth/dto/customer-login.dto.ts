import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CustomerLoginDto {
    @ApiProperty({ example: 'john@example.com' })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({ example: 'Password@123' })
    @IsString()
    @IsNotEmpty()
    password: string;
}
