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

    // Run every hour to send individual tender alerts
    @Cron(CronExpression.EVERY_HOUR)
    async handleHourlyTenderAlerts() {
        this.logger.log('Running hourly tender alerts cron job...');

        // Ensure expired subscriptions are inactive before sending any emails.
        await this.deactivateExpiredTenderSubscriptions();

        // 1. Get tenders published in the last hour
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

        const newTenders = await this.prisma.tender.findMany({
            where: {
                publishDate: {
                    gte: oneHourAgo,
                },
            },
            include: {
                attachments: true,
            },
        });

        if (newTenders.length === 0) {
            this.logger.log('No new tenders published in the last hour.');
            return;
        }

        this.logger.log(`Found ${newTenders.length} new tenders in the last hour.`);

        // 2. Get active subscriptions
        const activeSubscriptions = await this.prisma.tenderSubscription.findMany({
            where: { isActive: true },
            include: { customer: true },
        });

        if (activeSubscriptions.length === 0) {
            this.logger.log('No active subscriptions found.');
            return;
        }

        let emailsSent = 0;

        // 3. For each tender, find matching subscribers and send individual emails
        for (const tender of newTenders) {
            for (const sub of activeSubscriptions) {
                // Check if tender matches subscription preferences
                const categoryMatch = sub.categories.length === 0 || (tender.categoryName && sub.categories.includes(tender.categoryName));
                const stateMatch = sub.states.length === 0 || (tender.state && sub.states.includes(tender.state));

                if (!categoryMatch || !stateMatch) {
                    continue;
                }

                // Format dates
                const formatDate = (date: Date | null | undefined) => {
                    if (!date) return 'Not specified';
                    return new Date(date).toLocaleDateString('en-IN', { 
                        day: '2-digit', 
                        month: 'short', 
                        year: 'numeric' 
                    });
                };

                // Build document download link - use direct GEM URL if available
                const baseUrl = (process.env.WEBSITE_BASE_URL || 'https://grow-tender.com').replace(/\/$/, '');
                const documentLink = tender.tenderUrl || `${baseUrl}/tenders/${tender.id}`;
                const viewLink = `${baseUrl}/tender/${tender.id}`;

                // Build tender details HTML - Mobile First, Professional Design
                const html = `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="utf-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <meta http-equiv="X-UA-Compatible" content="IE=edge">
                        <style>
                            @media only screen and (max-width: 600px) {
                                .email-container { width: 100% !important; padding: 10px !important; }
                                .button-container { display: block !important; text-align: center !important; }
                                .button { display: block !important; width: 100% !important; margin: 10px 0 !important; box-sizing: border-box !important; }
                                .details-table td { display: block !important; width: 100% !important; padding: 8px 0 !important; border-bottom: 1px solid #e2e8f0 !important; }
                            }
                        </style>
                    </head>
                    <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                        <div class="email-container" style="max-width: 600px; margin: 0 auto; padding: 15px;">
                            <!-- Header -->
                            <div style="background: linear-gradient(135deg, #1a4f72 0%, #2563eb 100%); padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
                                <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 600;"> New Tender Alert</h1>
                                <p style="color: #e0e7ff; margin: 8px 0 0 0; font-size: 13px;">Grow Tender - Your Gateway to Government Contracts</p>
                            </div>
                            
                            <!-- Main Content -->
                            <div style="background: #ffffff; padding: 20px; border: 1px solid #e2e8f0; border-top: none;">
                                <p style="margin: 0 0 15px 0; color: #64748b; font-size: 14px;">
                                    Hi ${sub.customer.firstName},
                                </p>
                                <p style="margin: 0 0 20px 0; color: #334155; font-size: 15px;">
                                    A new tender matching your preferences has been published:
                                </p>
                                
                                <!-- Tender Title -->
                                <div style="background: #f1f5f9; border-left: 4px solid #2563eb; padding: 12px 15px; margin-bottom: 20px; border-radius: 0 8px 8px 0;">
                                    <h2 style="margin: 0; color: #1e293b; font-size: 16px; line-height: 1.4; font-weight: 600;">${tender.title}</h2>
                                </div>
                                
                                <!-- Tender Details -->
                                <table class="details-table" style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
                                    <tr>
                                        <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; width: 40%;">Bid Number</td>
                                        <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #1e293b; font-weight: 500;">${tender.referenceId || 'Not specified'}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;">Category</td>
                                        <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #1e293b;">${tender.categoryName || 'General'}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;">Location</td>
                                        <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #1e293b;">${tender.state || 'India'}${tender.city ? ', ' + tender.city : ''}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;">Published</td>
                                        <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #1e293b;">${formatDate(tender.publishDate)}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;">Deadline</td>
                                        <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #dc2626; font-weight: 600;">${formatDate(tender.closingDate)}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 10px 0; color: #64748b;"> Department</td>
                                        <td style="padding: 10px 0; color: #1e293b;">${tender.department || 'Not specified'}</td>
                                    </tr>
                                </table>
                                
                                ${tender.description ? `
                                <!-- Description -->
                                <div style="margin-bottom: 20px;">
                                    <h3 style="margin: 0 0 8px 0; color: #1e293b; font-size: 14px; font-weight: 600;">Description</h3>
                                    <p style="margin: 0; color: #64748b; font-size: 13px; line-height: 1.5; background: #f8fafc; padding: 12px; border-radius: 8px;">
                                        ${tender.description.substring(0, 400)}${tender.description.length > 400 ? '...' : ''}
                                    </p>
                                </div>
                                ` : ''}
                                
                                <!-- Action Buttons -->
                                <div class="button-container" style="text-align: center; margin: 25px 0;">
                                    <a href="${viewLink}" class="button" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 14px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; margin: 5px; box-sizing: border-box;">
                                        View On Website
                                    </a>
                                    <a href="${documentLink}" class="button" style="display: inline-block; background-color: #059669; color: #ffffff; padding: 14px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; margin: 5px; box-sizing: border-box;">
                                        View On Gem
                                    </a>
                                </div>
                                
                                <!-- Quick Tip -->
                                <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 12px; margin-top: 20px;">
                                    <p style="margin: 0; color: #1e40af; font-size: 12px;">
                                        <strong>Tip:</strong> Download the PDF document to review complete tender requirements and submit your bid before the deadline.
                                    </p>
                                </div>
                            </div>
                            
                            <!-- Footer -->
                            <div style="background: #f8fafc; padding: 15px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none; text-align: center;">
                                <p style="margin: 0 0 8px 0; color: #64748b; font-size: 11px;">
                                    You're receiving this because you have an active subscription.
                                </p>
                                <p style="margin: 0; color: #94a3b8; font-size: 10px;">
                                    ┬⌐ 2026 Grow Tender | <a href="https://grow-tender.com" style="color: #2563eb; text-decoration: none;">grow-tender.com</a>
                                </p>
                            </div>
                        </div>
                    </body>
                    </html>
                `;

                try {
                    await this.emailService.sendEmail({
                        to: sub.customer.email,
                        subject: `New Tender: ${tender.title.substring(0, 50)}${tender.title.length > 50 ? '...' : ''}`,
                        html: html,
                        customerId: sub.customerId,
                        purpose: 'AUTO',
                        state: tender.state || undefined,
                    });
                    emailsSent++;
                    this.logger.log(`Sent tender alert to ${sub.customer.email} for tender ${tender.referenceId}`);
                } catch (error) {
                    this.logger.error(`Failed to send tender alert to ${sub.customer.email}:`, error);
                }

                // Add small delay between emails to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        this.logger.log(`Hourly tender alerts completed. Sent ${emailsSent} individual emails.`);
    }

    // Keep the old daily alerts as backup (can be removed later)
    @Cron(CronExpression.EVERY_DAY_AT_10AM)
    async handleDailyTenderAlerts() {
        // Now using hourly alerts instead
        this.logger.log('Daily alerts cron triggered, but using hourly alerts instead.');
    }

    // Send test email for testing email template
    async sendTestEmail(to: string, html: string) {
        this.logger.log(`Sending test email to ${to}`);
        await this.emailService.sendEmail({
            to,
            subject: 'Test Tender Alert - Grow Tender',
            html,
        });
        this.logger.log(`Test email sent successfully to ${to}`);
    }
}
