import { Module } from '@nestjs/common';
import { DailyReportsService } from './daily-reports.service';
import { DailyReportsController } from './daily-reports.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [DailyReportsController],
    providers: [DailyReportsService],
    exports: [DailyReportsService],
})
export class DailyReportsModule { }
