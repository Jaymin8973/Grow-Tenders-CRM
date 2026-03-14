import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { GemScraperService } from './gem-scraper.service';
import { GeMCategoriesService } from './gem-categories.service';
import { TenderNotificationService } from './tender-notification.service';
import { TenderAlertService } from '../../alerts/services/tender-alert.service';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class TenderSchedulerService {
    private readonly logger = new Logger(TenderSchedulerService.name);
    private isRunning = false;

    private async withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
        let timeoutId: NodeJS.Timeout | undefined;
        const timeoutPromise = new Promise<never>((_, reject) => {
            timeoutId = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
        });
        try {
            return await Promise.race([promise, timeoutPromise]);
        } finally {
            if (timeoutId) clearTimeout(timeoutId);
        }
    }

    constructor(
        private gemScraperService: GemScraperService,
        private gemCategoriesService: GeMCategoriesService,
        private notificationService: TenderNotificationService,
        private tenderAlertService: TenderAlertService,
        private prisma: PrismaService,
    ) { }

    // Run every 4 hours
    @Cron(CronExpression.EVERY_4_HOURS)
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

            const lastCompletedJob = await this.prisma.tenderScrapeJob.findFirst({
                where: {
                    status: 'COMPLETED',
                    endTime: { not: null },
                },
                orderBy: { endTime: 'desc' },
                select: { endTime: true },
            });

            const fromDate = lastCompletedJob?.endTime ?? null;
            if (fromDate) {
                this.logger.log(`Incremental scrape enabled (fromDate=${fromDate.toISOString()})`);
            } else {
                this.logger.log('No previous completed scrape job found. Running full scrape (ALL active tenders).');
            }

            // Scrape tenders from GeM
            const timeoutMs = Number(process.env.TENDER_SCRAPE_TIMEOUT_MS || 30 * 60 * 1000);
            const result = await this.withTimeout(
                this.gemScraperService.scrapeTenders(0, fromDate),
                timeoutMs,
                'Tender scraping',
            );
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
