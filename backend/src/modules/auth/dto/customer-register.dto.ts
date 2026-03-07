import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional, IsPhoneNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CustomerRegisterDto {
    @ApiProperty({ example: 'John' })
    @IsString()
    @IsNotEmpty()
    firstName: string;

    @ApiProperty({ example: 'Doe' })
    @IsString()
    @IsNotEmpty()
    lastName: string;

    @ApiProperty({ example: 'john@example.com' })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({ example: 'Password@123', minLength: 8 })
    @IsString()
    @IsNotEmpty()
    @MinLength(8)
    password: string;

    @ApiProperty({ example: '+91 9876543210', required: false })
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiProperty({ example: 'ABC Corp', required: false })
    @IsOptional()
    @IsString()
    company?: string;
}
