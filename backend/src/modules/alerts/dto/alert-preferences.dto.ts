import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, IsBoolean, IsOptional } from 'class-validator';

export class UpdateAlertPreferencesDto {
    @ApiProperty({ example: ['Maharashtra', 'Delhi', 'Karnataka'], required: false })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    statePreferences?: string[];

    @ApiProperty({ example: ['IT Services', 'Construction', 'Medical Equipment'], required: false })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    categoryPreferences?: string[];

    @ApiProperty({ example: ['user@company.com', 'manager@company.com'], required: false })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    emailRecipients?: string[];

    @ApiProperty({ example: true, required: false })
    @IsOptional()
    @IsBoolean()
    alertsEnabled?: boolean;
}
