import { IsNotEmpty, IsString, IsArray, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSubscriptionDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    customerId: string;

    @ApiProperty({ type: [String], description: 'Array of category keywords for matching' })
    @IsArray()
    @IsString({ each: true })
    categories: string[];

    @ApiProperty({ type: [String], description: 'Array of state names for matching' })
    @IsArray()
    @IsString({ each: true })
    states: string[];

    @ApiPropertyOptional({ default: true })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}

