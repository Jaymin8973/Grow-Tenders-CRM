import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateInquiryDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty()
    @IsEmail()
    email: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    type?: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    subject: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    message: string;
}
