import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TendersService } from './tenders.service';
import { TendersController } from './tenders.controller';
import { CategoriesController } from './categories.controller';
import { SubscriptionsController } from './subscriptions.controller';
import { ScrapedTendersController } from './scraped-tenders.controller';
import {
    GemScraperService,
    ScrapedTendersService,
    TenderSchedulerService,
    TenderNotificationService,
} from './services';
import { EmailModule } from '../email/email.module';

@Module({
    imports: [ScheduleModule.forRoot(), EmailModule],
    controllers: [
        TendersController,
        CategoriesController,
        SubscriptionsController,
        ScrapedTendersController,
    ],
    providers: [
        TendersService,
        GemScraperService,
        ScrapedTendersService,
        TenderSchedulerService,
        TenderNotificationService,
    ],
    exports: [TendersService, ScrapedTendersService],
})
export class TendersModule { }
