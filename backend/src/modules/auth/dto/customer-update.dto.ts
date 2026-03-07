import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEmail, IsPhoneNumber, MinLength, MaxLength } from 'class-validator';

export class CustomerUpdateDto {
    @ApiProperty({ example: 'John', required: false })
    @IsOptional()
    @IsString()
    @MaxLength(50)
    firstName?: string;

    @ApiProperty({ example: 'Doe', required: false })
    @IsOptional()
    @IsString()
    @MaxLength(50)
    lastName?: string;

    @ApiProperty({ example: '+91-9876543210', required: false })
    @IsOptional()
    @IsString()
    @MaxLength(20)
    phone?: string;

    @ApiProperty({ example: 'Acme Corp', required: false })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    company?: string;

    @ApiProperty({ example: 'Manager', required: false })
    @IsOptional()
    @IsString()
    @MaxLength(50)
    position?: string;

    @ApiProperty({ example: '123 Main St', required: false })
    @IsOptional()
    @IsString()
    @MaxLength(200)
    address?: string;

    @ApiProperty({ example: 'Mumbai', required: false })
    @IsOptional()
    @IsString()
    @MaxLength(50)
    city?: string;

    @ApiProperty({ example: 'Maharashtra', required: false })
    @IsOptional()
    @IsString()
    @MaxLength(50)
    state?: string;
}
