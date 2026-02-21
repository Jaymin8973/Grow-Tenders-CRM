import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { GemScraperService } from './gem-scraper.service';
import { TenderNotificationService } from './tender-notification.service';

@Injectable()
export class TenderSchedulerService {
    private readonly logger = new Logger(TenderSchedulerService.name);
    private isRunning = false;

    constructor(
        private gemScraperService: GemScraperService,
        private notificationService: TenderNotificationService,
    ) { }

    // Run every hour
    @Cron(CronExpression.EVERY_10_HOURS)
    async handleCron() {
        if (this.isRunning) {
            this.logger.warn('Scraper already running, skipping...');
            return;
        }

        this.isRunning = true;
        this.logger.log('Starting scheduled tender scraping...');

        try {
            // Scrape from start of today
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const result = await this.gemScraperService.scrapeTenders(0, today);
            this.logger.log(`Scraping complete: ${result.added} added, ${result.skipped} duplicates, ${result.skippedOld} old skipped, ${result.pagesScraped} pages scraped`);

            // Update expired tenders
            const expired = await this.gemScraperService.updateExpiredTenders();
            this.logger.log(`Marked ${expired} tenders as expired`);

            // Send notifications for new tenders
            if (result.added > 0 && result.newTenders.length > 0) {
                await this.notificationService.sendNewTenderAlerts(result.newTenders);
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
            await this.gemScraperService.updateExpiredTenders();

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
