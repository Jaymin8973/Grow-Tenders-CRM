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

    // Run every 2 hours
    @Cron(CronExpression.EVERY_2_HOURS)
    async handleCron() {
        if (this.isRunning) {
            this.logger.warn('Scraper already running, skipping...');
            return;
        }

        this.isRunning = true;
        this.logger.log('Starting scheduled tender scraping...');

        try {
            // Scrape all active tenders (todayOnly=true to fetch only latest daily uploads)
            const result = await this.gemScraperService.scrapeTenders(5, true);
            this.logger.log(`Scraping complete: ${result.added} added, ${result.skipped} duplicates, ${result.skippedOld} old tenders skipped`);

            // Update expired tenders
            const expired = await this.gemScraperService.updateExpiredTenders();
            this.logger.log(`Marked ${expired} tenders as expired`);

            // Send notifications for new tenders
            if (result.added > 0) {
                await this.notificationService.sendNewTenderAlerts();
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
            const result = await this.gemScraperService.scrapeTenders(pages, todayOnly);
            await this.gemScraperService.updateExpiredTenders();

            // Send notifications if any new tenders found
            if (result.added > 0) {
                await this.notificationService.sendNewTenderAlerts();
            }

            return result;
        } finally {
            this.isRunning = false;
        }
    }
}
