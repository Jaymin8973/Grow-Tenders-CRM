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

                // Build document download link
                const baseUrl = (process.env.WEBSITE_BASE_URL || 'https://grow-tender.com').replace(/\/$/, '');
                const documentLink = `${baseUrl}/tenders/${tender.id}/download-pdf`;
                const viewLink = `${baseUrl}/tender/${tender.id}`;

                // Build tender details HTML - Same design as test email
                const html = `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="utf-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <meta http-equiv="X-UA-Compatible" content="IE=edge">
                        <style>
                            @media only screen and (max-width: 600px) {
                                .container { width: 100% !important; padding: 12px !important; }
                                .btn { display: block !important; width: 100% !important; box-sizing: border-box !important; }
                                .btn + .btn { margin-top: 10px !important; }
                                .row { padding: 10px 12px !important; }
                                .h1 { font-size: 18px !important; }
                                .title { font-size: 16px !important; }
                            }
                        </style>
                    </head>
                    <body style="margin:0; padding:0; background:#f2f4f7; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                        <div class="container" style="max-width:600px; margin:0 auto; padding:16px;">
                            <div style="background:#ffffff; border:1px solid #e5e7eb; border-radius:14px; overflow:hidden;">
                                <div style="padding:16px 16px 12px 16px; background:#ffffff; border-bottom:1px solid #eef2f7;">
                                    <div class="h1" style="font-size:20px; font-weight:700; color:#0f172a; line-height:1.2;">New Tender Alert</div>
                                    <div style="margin-top:6px; font-size:12px; color:#64748b;">Grow Tender — Government Tender Updates</div>
                                </div>

                                <div style="padding:16px;">
                                    <div style="font-size:14px; color:#334155; line-height:1.5;">Hi <strong style="color:#0f172a;">${sub.customer.firstName}</strong>,</div>
                                    <div style="margin-top:6px; font-size:13px; color:#64748b; line-height:1.5;">A new tender matching your preferences has been published.</div>

                                    <div style="margin-top:14px; padding:14px; background:#f8fafc; border:1px solid #e5e7eb; border-radius:12px;">
                                        <div class="title" style="font-size:16px; font-weight:700; color:#0f172a; line-height:1.35;">${tender.title}</div>
                                        <div style="margin-top:8px; font-size:12px; color:#64748b;">Bid No: <strong style="color:#0f172a;">${tender.referenceId || 'Not specified'}</strong></div>
                                    </div>

                                    <div style="margin-top:14px; border:1px solid #e5e7eb; border-radius:12px; overflow:hidden;">
                                        <div class="row" style="padding:12px 14px; background:#ffffff; border-bottom:1px solid #eef2f7;">
                                            <div style="font-size:12px; color:#64748b;">Category</div>
                                            <div style="margin-top:3px; font-size:14px; color:#0f172a; font-weight:600;">${tender.categoryName || 'General'}</div>
                                        </div>
                                        <div class="row" style="padding:12px 14px; background:#ffffff; border-bottom:1px solid #eef2f7;">
                                            <div style="font-size:12px; color:#64748b;">Location</div>
                                            <div style="margin-top:3px; font-size:14px; color:#0f172a; font-weight:600;">${tender.state || 'India'}${tender.city ? ', ' + tender.city : ''}</div>
                                        </div>
                                        <div class="row" style="padding:12px 14px; background:#ffffff; border-bottom:1px solid #eef2f7;">
                                            <div style="font-size:12px; color:#64748b;">Published</div>
                                            <div style="margin-top:3px; font-size:14px; color:#0f172a; font-weight:600;">${formatDate(tender.publishDate)}</div>
                                        </div>
                                        <div class="row" style="padding:12px 14px; background:#ffffff; border-bottom:1px solid #eef2f7;">
                                            <div style="font-size:12px; color:#64748b;">Deadline</div>
                                            <div style="margin-top:3px; font-size:14px; color:#b91c1c; font-weight:700;">${formatDate(tender.closingDate)}</div>
                                        </div>
                                        <div class="row" style="padding:12px 14px; background:#ffffff;">
                                            <div style="font-size:12px; color:#64748b;">Department</div>
                                            <div style="margin-top:3px; font-size:14px; color:#0f172a; font-weight:600;">${tender.department || 'Not specified'}</div>
                                        </div>
                                    </div>

                                    ${tender.description ? `
                                    <div style="margin-top:14px; padding:14px; background:#ffffff; border:1px solid #e5e7eb; border-radius:12px;">
                                        <div style="font-size:12px; color:#64748b;">Description</div>
                                        <div style="margin-top:6px; font-size:13px; color:#0f172a; line-height:1.55;">
                                            ${tender.description.substring(0, 350)}${tender.description.length > 350 ? '...' : ''}
                                        </div>
                                    </div>
                                    ` : ''}

                                    <div style="margin-top:16px;">
                                        <div style="text-align:center;">
                                            <a class="btn" href="${viewLink}" style="display:block; width:100%; max-width:520px; margin:0 auto; text-align:center; background:#2563eb; color:#ffffff; padding:13px 14px; text-decoration:none; border-radius:12px; font-size:14px; font-weight:700;">View Details</a>
                                            <a class="btn" href="${documentLink}" style="display:block; width:100%; max-width:520px; margin:10px auto 0 auto; text-align:center; background:#059669; color:#ffffff; padding:13px 14px; text-decoration:none; border-radius:12px; font-size:14px; font-weight:700;">Download PDF</a>
                                        </div>
                                    </div>

                                    <div style="margin-top:14px; font-size:11px; color:#64748b; line-height:1.5;">
                                        Tip: Download the PDF to review complete requirements and submit your bid before the deadline.
                                    </div>
                                </div>

                                <div style="padding:12px 16px; background:#ffffff; border-top:1px solid #eef2f7; text-align:center;">
                                    <div style="font-size:11px; color:#94a3b8;">© 2026 Grow Tender • <a href="${baseUrl}" style="color:#2563eb; text-decoration:none;">grow-tender.com</a></div>
                                </div>
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
            subject: '🔔 Test Tender Alert - Grow Tender',
            html,
        });
        this.logger.log(`Test email sent successfully to ${to}`);
    }
}
