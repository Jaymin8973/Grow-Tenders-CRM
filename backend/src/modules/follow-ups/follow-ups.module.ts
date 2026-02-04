import { Module } from '@nestjs/common';
import { FollowUpsService } from './follow-ups.service';
import { FollowUpsController } from './follow-ups.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [FollowUpsController],
    providers: [FollowUpsService],
    exports: [FollowUpsService],
})
export class FollowUpsModule { }
