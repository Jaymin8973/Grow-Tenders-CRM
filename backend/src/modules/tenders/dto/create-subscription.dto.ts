import { IsNotEmpty, IsString, IsArray, IsOptional, IsBoolean, IsInt, Min, IsDateString } from 'class-validator';
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

    @ApiPropertyOptional({ type: [String], description: 'Array of city names for matching' })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    cities?: string[];

    @ApiPropertyOptional({ default: true })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @ApiPropertyOptional({ description: 'Subscription duration in calendar months', default: 1 })
    @IsOptional()
    @IsInt()
    @Min(1)
    durationMonths?: number;

    @ApiPropertyOptional({ description: 'Subscription start date (ISO). Defaults to now.' })
    @IsOptional()
    @IsDateString()
    startDate?: string;
}

