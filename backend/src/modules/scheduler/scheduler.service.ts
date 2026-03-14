import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class SchedulerService {
    private readonly logger = new Logger(SchedulerService.name);

    constructor(
        private prisma: PrismaService,
        private emailService: EmailService,
    ) { }

    private addMonths(date: Date, months: number) {
        const d = new Date(date);
        d.setMonth(d.getMonth() + months);
        return d;
    }

    @Cron(CronExpression.EVERY_DAY_AT_1AM)
    async deactivateExpiredTenderSubscriptions() {
        this.logger.log('Running tender subscription expiry cron job...');

        const now = new Date();
        const activeSubs = await this.prisma.tenderSubscription.findMany({
            where: { isActive: true },
            select: { id: true, endDate: true, startDate: true, durationMonths: true, createdAt: true },
        });

        if (activeSubs.length === 0) {
            return;
        }

        const expiredIds: string[] = [];
        for (const s of activeSubs) {
            const safeStartDate = s.startDate ? new Date(s.startDate) : new Date(s.createdAt);
            const safeDurationMonths = typeof s.durationMonths === 'number' && s.durationMonths > 0 ? s.durationMonths : 1;
            const computedEndDate = s.endDate || this.addMonths(safeStartDate, safeDurationMonths);
            if (computedEndDate < now) {
                expiredIds.push(s.id);
            }
        }

        if (expiredIds.length === 0) {
            return;
        }

        const result = await this.prisma.tenderSubscription.updateMany({
            where: { id: { in: expiredIds } },
            data: { isActive: false },
        });

        this.logger.log(`Marked ${result.count} tender subscriptions inactive (expired).`);
    }

    @Cron(CronExpression.EVERY_HOUR)
    async deactivateExpiredFreeTrials() {
        this.logger.log('Running free trial expiry cron job...');

        const now = new Date();

        // Find customers with active free trials that have expired
        const expiredTrials = await this.prisma.customer.findMany({
            where: {
                freeTrialActive: true,
                freeTrialEndDate: { lt: now },
            },
            select: { id: true, firstName: true, email: true },
        });

        if (expiredTrials.length === 0) {
            this.logger.log('No expired free trials found.');
            return;
        }

        // Deactivate all expired trials
        const result = await this.prisma.customer.updateMany({
            where: {
                id: { in: expiredTrials.map(c => c.id) },
            },
            data: {
                freeTrialActive: false,
                subscriptionActive: false,
                planType: null,
            },
        });

        this.logger.log(`Deactivated ${result.count} expired free trials.`);

        // Send notification emails to customers whose trial expired
        for (const customer of expiredTrials) {
            try {
                await this.emailService.sendEmail({
                    to: customer.email,
                    subject: 'Your Free Trial Has Ended - Upgrade Now',
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
                            <h2 style="color: #2563eb; text-align: center;">Your Free Trial Has Ended</h2>
                            <p>Hi ${customer.firstName},</p>
                            <p>Your 3-day free trial of Grow Tenders has ended. We hope you enjoyed exploring our tender matching services!</p>
                            <p>To continue receiving tender alerts and accessing all features, please upgrade to one of our subscription plans.</p>
                            <div style="text-align: center; margin-top: 30px;">
                                <a href="https://growtenders.com/pricing" style="background-color: #f5820d; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View Pricing Plans</a>
                            </div>
                            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                            <p style="color: #94a3b8; font-size: 12px; text-align: center;">Grow Tenders - Your Gateway to Government Tenders</p>
                        </div>
                    `,
                });
            } catch (error) {
                this.logger.error(`Failed to send trial expiry email to ${customer.email}:`, error);
            }
        }

        this.logger.log(`Sent ${expiredTrials.length} trial expiry notification emails.`);
    }

    @Cron(CronExpression.EVERY_DAY_AT_10AM)
    async handleDailyTenderAlerts() {
        this.logger.log('Running daily tender alerts cron job...');

        // Ensure expired subscriptions are inactive before sending any emails.
        await this.deactivateExpiredTenderSubscriptions();

        // 1. Get tenders published in the last 24 hours
        // If testing, we might want to just get recent ones if none were published exactly today
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        const newTenders = await this.prisma.tender.findMany({
            where: {
                publishDate: {
                    gte: yesterday,
                },
            },
        });

        if (newTenders.length === 0) {
            this.logger.log('No new tenders published in the last 24 hours.');
            return;
        }

        // 2. Get active subscriptions
        const activeSubscriptions = await this.prisma.tenderSubscription.findMany({
            where: { isActive: true },
            include: { customer: true },
        });

        let emailsSent = 0;

        // 3. Match and send
        for (const sub of activeSubscriptions) {
            const matchedTenders = newTenders.filter(t => {
                const categoryMatch = sub.categories.length === 0 || (t.categoryName && sub.categories.includes(t.categoryName));
                const stateMatch = sub.states.length === 0 || (t.state && sub.states.includes(t.state));
                return categoryMatch && stateMatch;
            });

            if (matchedTenders.length > 0) {
                const html = `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
                        <h2 style="color: #2563eb; text-align: center;">Your Daily Tender Matches</h2>
                        <p>Hi ${sub.customer.firstName},</p>
                        <p>We found <strong>${matchedTenders.length}</strong> new tenders matching your preferences today.</p>
                        
                        <div style="margin: 20px 0;">
                            ${matchedTenders.map(t => `
                                <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                                    <h3 style="margin: 0 0 10px 0; color: #1e293b; font-size: 16px;">${t.title}</h3>
                                    <div style="color: #64748b; font-size: 14px; margin-bottom: 5px;">📍 ${t.state || 'India'} | 🏢 ${t.categoryName || 'General'}</div>
                                    <div style="color: #64748b; font-size: 14px;">📅 Deadline: ${t.closingDate?.toLocaleDateString() || 'Not specified'}</div>
                                </div>
                            `).join('')}
                        </div>
                        
                        <div style="text-align: center; margin-top: 30px;">
                            <a href="https://growtenders.com/portal" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View These Tenders on Portal</a>
                        </div>
                        
                        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                        <p style="color: #94a3b8; font-size: 12px; text-align: center;">You are receiving this because you are an active subscriber to Grow Tenders.</p>
                    </div>
                `;

                try {
                    await this.emailService.sendEmail({
                        to: sub.customer.email,
                        subject: `🔥 ${matchedTenders.length} New Tenders Matched For You`,
                        html: html,
                        customerId: sub.customerId,
                    });
                    emailsSent++;
                } catch (error) {
                    this.logger.error(`Failed to send daily alert to ${sub.customer.email}:`, error);
                }
            }
        }

        this.logger.log(`Daily tender alerts completed. Sent ${emailsSent} emails.`);
    }
}
