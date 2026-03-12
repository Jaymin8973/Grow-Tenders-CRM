import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { GemScraperService } from './gem-scraper.service';
import { GeMCategoriesService } from './gem-categories.service';
import { TenderNotificationService } from './tender-notification.service';
import { TenderAlertService } from '../../alerts/services/tender-alert.service';

@Injectable()
export class TenderSchedulerService {
    private readonly logger = new Logger(TenderSchedulerService.name);
    private isRunning = false;

    constructor(
        private gemScraperService: GemScraperService,
        private gemCategoriesService: GeMCategoriesService,
        private notificationService: TenderNotificationService,
        private tenderAlertService: TenderAlertService,
    ) { }

    // Run every 4 hours
    @Cron(CronExpression.EVERY_MINUTE)
    async handleCron() {
        if (this.isRunning) {
            this.logger.warn('Scraper already running, skipping...');
            return;
        }

        this.isRunning = true;
        this.logger.log('Starting scheduled tender scraping...');

        try {
            // First, sync categories from GeM portal
            this.logger.log('Syncing GeM categories...');
            const categoryResult = await this.gemCategoriesService.syncCategories();
            this.logger.log(`Categories sync: ${categoryResult.added} added, ${categoryResult.updated} updated, ${categoryResult.total} total`);

            // Then, delete expired tenders from database
            const deleted = await this.gemScraperService.deleteExpiredTenders();
            this.logger.log(`Deleted ${deleted} expired tenders`);

            // Scrape ALL active tenders from GeM (no date filter)
            const result = await this.gemScraperService.scrapeTenders(0, null);
            this.logger.log(`Scraping complete: ${result.added} added, ${result.skipped} duplicates, ${result.pagesScraped} pages scraped`);

            // Send notifications for new tenders
            if (result.added > 0 && result.newTenders.length > 0) {
                await this.notificationService.sendNewTenderAlerts(result.newTenders);

                // Send customer alerts based on preferences
                this.logger.log('Checking customer alert preferences...');
                await this.tenderAlertService.checkNewTendersAndSendAlerts();
            }
        } catch (error) {
            this.logger.error(`Scheduled scraping failed: ${error.message}`);
        } finally {
            this.isRunning = false;
        }
    }

    /**
     * Manual trigger method
     * @param pages Number of pages to scrape
     * @param todayOnly If true, only fetch tenders published today (default: false - fetches all active)
     */
    async runManually(pages: number = 3, todayOnly: boolean = false): Promise<{ added: number; skipped: number; skippedOld: number }> {
        if (this.isRunning) {
            throw new Error('Scraper is already running');
        }

        this.isRunning = true;
        try {
            let fromDate: Date | undefined;
            if (todayOnly) {
                fromDate = new Date();
                fromDate.setHours(0, 0, 0, 0);
            }

            const result = await this.gemScraperService.scrapeTenders(pages, fromDate);
            await this.gemScraperService.deleteExpiredTenders();

            // Send notifications if any new tenders found
            if (result.added > 0 && result.newTenders.length > 0) {
                await this.notificationService.sendNewTenderAlerts(result.newTenders);
            }

            return result;
        } finally {
            this.isRunning = false;
        }
    }
}
