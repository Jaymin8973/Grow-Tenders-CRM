import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { EmailService } from '../../email/email.service';
import { ScrapedTenderStatus } from '@prisma/client';

@Injectable()
export class TenderNotificationService {
    private readonly logger = new Logger(TenderNotificationService.name);

    constructor(
        private prisma: PrismaService,
        private emailService: EmailService,
    ) { }

    async sendNewTenderAlerts(): Promise<number> {
        this.logger.log('Starting tender notification process...');

        // Get all active subscriptions with customer details
        const subscriptions = await this.prisma.tenderSubscription.findMany({
            where: { isActive: true },
            include: {
                customer: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        company: true,
                    },
                },
            },
        });

        if (subscriptions.length === 0) {
            this.logger.log('No active subscriptions found');
            return 0;
        }

        // Get tenders created since the last scheduler run (approx 2 hours ago)
        // We use 2.5 hours to be safe against slight delays, duplicates are handled by not sending if already notified (logic below needs enhancement if strict dedupe needed)
        // Ideally we should track sent emails, but for now relying on creation window + unique constraints
        const lastRun = new Date(Date.now() - 150 * 60 * 1000); // 2.5 hours
        const newTenders = await this.prisma.scrapedTender.findMany({
            where: {
                status: ScrapedTenderStatus.ACTIVE,
                createdAt: { gte: lastRun },
            },
        });

        if (newTenders.length === 0) {
            this.logger.log('No new tenders to notify about');
            return 0;
        }

        let notificationsSent = 0;

        for (const subscription of subscriptions) {
            if (!subscription.customer.email) continue;

            // Filter tenders matching customer preferences
            const matchingTenders = newTenders.filter(tender => {
                // Check state match
                const stateMatch = subscription.states.length === 0 ||
                    (tender.state && subscription.states.some(s =>
                        tender.state!.toLowerCase().includes(s.toLowerCase())
                    ));

                // Check category/keyword match
                const categoryMatch = subscription.categories.length === 0 ||
                    subscription.categories.some(cat =>
                        tender.title?.toLowerCase().includes(cat.toLowerCase()) ||
                        tender.department?.toLowerCase().includes(cat.toLowerCase())
                    );

                return stateMatch && categoryMatch;
            });

            if (matchingTenders.length === 0) continue;

            try {
                await this.sendTenderEmail(
                    subscription.customer.email,
                    subscription.customer.firstName || 'Customer',
                    matchingTenders,
                );
                notificationsSent++;
                this.logger.log(`Sent ${matchingTenders.length} tenders to ${subscription.customer.email}`);
            } catch (error) {
                this.logger.error(`Failed to send email to ${subscription.customer.email}: ${error.message}`);
            }
        }

        this.logger.log(`Sent notifications to ${notificationsSent} customers`);
        return notificationsSent;
    }

    private async sendTenderEmail(
        email: string,
        name: string,
        tenders: any[],
    ): Promise<void> {
        const subject = `🔔 ${tenders.length} New Tender${tenders.length > 1 ? 's' : ''} Matching Your Preferences`;

        const tenderList = tenders.slice(0, 10).map(t => `
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">
                    <strong><a href="${t.sourceUrl || '#'}" style="color: #667eea; text-decoration: none;">${t.bidNo}</a></strong><br>
                    <span style="color: #666;">${t.title?.substring(0, 100)}${t.title?.length > 100 ? '...' : ''}</span>
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">
                    ${t.state || 'N/A'}
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">
                    ${t.endDate ? new Date(t.endDate).toLocaleDateString('en-IN') : 'N/A'}
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">
                    ${t.sourceUrl ? `
                    <a href="${t.sourceUrl}" style="background: #28a745; color: white; padding: 6px 12px; border-radius: 4px; text-decoration: none; font-size: 12px; white-space: nowrap;">
                        View on GeM
                    </a>` : '-'}
                </td>
            </tr>
        `).join('');

        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
                    <h1 style="color: white; margin: 0;">New Tenders Alert</h1>
                </div>
                
                <div style="padding: 20px; background: #f9f9f9;">
                    <p>Dear ${name},</p>
                    <p>We found <strong>${tenders.length} new tender${tenders.length > 1 ? 's' : ''}</strong> matching your preferences:</p>
                    
                    <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden;">
                        <thead>
                            <tr style="background: #f0f0f0;">
                                <th style="padding: 12px; text-align: left;">Tender Details</th>
                                <th style="padding: 12px; text-align: center;">State</th>
                                <th style="padding: 12px; text-align: center;">End Date</th>
                                <th style="padding: 12px; text-align: center;">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tenderList}
                        </tbody>
                    </table>
                    
                    ${tenders.length > 10 ? `<p style="color: #666; text-align: center;">...and ${tenders.length - 10} more tenders</p>` : ''}
                    
                    <div style="text-align: center; margin-top: 20px;">
                        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/scraped-tenders" 
                           style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                            View All Tenders
                        </a>
                    </div>
                </div>
                
                <div style="padding: 15px; text-align: center; color: #999; font-size: 12px;">
                    <p>This is an automated email from Grow Tenders. To update your preferences, please visit your profile.</p>
                </div>
            </div>
        `;

        await this.emailService.sendEmail({
            to: email,
            subject,
            html,
        });
    }
}
