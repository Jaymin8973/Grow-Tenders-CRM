import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DealStage } from '@prisma/client';

export class UpdateDealStageDto {
    @ApiProperty({ enum: DealStage })
    @IsEnum(DealStage)
    @IsNotEmpty()
    stage: DealStage;
}
