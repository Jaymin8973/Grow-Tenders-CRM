import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { RawLeadsService } from './raw-leads.service';
import { RawLeadsController } from './raw-leads.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { RawLeadsSchedulerService } from './raw-leads-scheduler.service';

@Module({
  imports: [PrismaModule, ScheduleModule.forRoot()],
  controllers: [RawLeadsController],
  providers: [RawLeadsService, RawLeadsSchedulerService],
  exports: [RawLeadsService]
})
export class RawLeadsModule { }
