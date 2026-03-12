import { Module, forwardRef } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TendersService } from './tenders.service';
import { TendersController } from './tenders.controller';
import { PublicTendersController } from './public-tenders.controller';
import { CategoriesController } from './categories.controller';
import { SubscriptionsController } from './subscriptions.controller';
import { ScrapedTendersController } from './scraped-tenders.controller';
import {
    GemScraperService,
    ScrapedTendersService,
    TenderSchedulerService,
    TenderNotificationService,
    GeMCategoriesService,
} from './services';
import { EmailModule } from '../email/email.module';
import { AlertsModule } from '../alerts/alerts.module';

@Module({
    imports: [ScheduleModule.forRoot(), EmailModule, forwardRef(() => AlertsModule)],
    controllers: [
        TendersController,
        PublicTendersController,
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
        GeMCategoriesService,
    ],
    exports: [TendersService, ScrapedTendersService, GeMCategoriesService],
})
export class TendersModule { }
