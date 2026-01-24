import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CustomerLifecycle } from '@prisma/client';

export class UpdateLifecycleDto {
    @ApiProperty({ enum: CustomerLifecycle })
    @IsEnum(CustomerLifecycle)
    @IsNotEmpty()
    lifecycle: CustomerLifecycle;
}
