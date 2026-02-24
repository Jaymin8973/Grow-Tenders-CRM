import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RawLeadsService } from './raw-leads.service';

@Injectable()
export class RawLeadsSchedulerService {
    private readonly logger = new Logger(RawLeadsSchedulerService.name);
    private isRunning = false;

    constructor(private readonly rawLeadsService: RawLeadsService) { }

    // Runs daily at 01:00 AM server time
    @Cron(CronExpression.EVERY_DAY_AT_1AM)
    async autoReturnStalePending() {
        if (this.isRunning) {
            this.logger.warn('Auto-return already running, skipping...');
            return;
        }

        this.isRunning = true;
        try {
            const result = await this.rawLeadsService.autoReturnStalePendingToPool(2);
            this.logger.log(
                `Auto-return stale raw leads completed: returnedCount=${result.returnedCount} cutoff=${result.cutoff.toISOString()}`,
            );
        } catch (err: any) {
            this.logger.error(`Auto-return stale raw leads failed: ${err?.message || err}`);
        } finally {
            this.isRunning = false;
        }
    }
}
