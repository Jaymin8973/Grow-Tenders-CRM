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

    @Cron(CronExpression.EVERY_DAY_AT_10AM)
    async handleDailyTenderAlerts() {
        this.logger.log('Running daily tender alerts cron job...');

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
