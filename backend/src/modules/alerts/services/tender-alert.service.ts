import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../../prisma/prisma.service';
import { EmailService } from '../../email/email.service';

interface TenderMatch {
    tenderId: string;
    customerId: string;
    customerEmail: string;
    customerName: string;
    tenderTitle: string;
    tenderValue: number | null;
    tenderState: string | null;
    tenderCategory: string | null;
    tenderClosingDate: Date | null;
    matchedStates: string[];
    matchedCategories: string[];
}

@Injectable()
export class TenderAlertService {
    private readonly logger = new Logger(TenderAlertService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly emailService: EmailService,
    ) {}

    // Run every hour to check for new tenders
    @Cron(CronExpression.EVERY_HOUR)
    async checkNewTendersAndSendAlerts() {
        this.logger.log('Starting tender alert check...');

        try {
            // Get all customers with alert preferences
            const customers = await this.prisma.customer.findMany({
                where: {
                    subscriptionActive: true,
                    OR: [
                        { statePreferences: { isEmpty: false } },
                        { categoryPreferences: { isEmpty: false } },
                    ],
                },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    statePreferences: true,
                    categoryPreferences: true,
                    emailRecipients: true,
                },
            });

            this.logger.log(`Found ${customers.length} customers with alert preferences`);

            // Get tenders created in the last hour
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
            const newTenders = await this.prisma.tender.findMany({
                where: {
                    createdAt: { gte: oneHourAgo },
                    status: 'PUBLISHED',
                },
                include: {
                    category: { select: { id: true, name: true } },
                },
            });

            this.logger.log(`Found ${newTenders.length} new tenders in the last hour`);

            if (newTenders.length === 0) {
                return;
            }

            // Match tenders to customers
            const matches: TenderMatch[] = [];

            for (const customer of customers) {
                for (const tender of newTenders) {
                    const matchedStates = customer.statePreferences.filter(
                        (state: string) => tender.state?.toLowerCase().includes(state.toLowerCase())
                    );
                    const matchedCategories = customer.categoryPreferences.filter(
                        (cat: string) => tender.category?.name?.toLowerCase().includes(cat.toLowerCase()) ||
                               tender.categoryName?.toLowerCase().includes(cat.toLowerCase())
                    );

                    if (matchedStates.length > 0 || matchedCategories.length > 0) {
                        // Check if alert already sent
                        const existingAlert = await this.prisma.tenderAlert.findUnique({
                            where: {
                                customerId_tenderId: {
                                    customerId: customer.id,
                                    tenderId: tender.id,
                                },
                            },
                        });

                        if (!existingAlert) {
                            matches.push({
                                tenderId: tender.id,
                                customerId: customer.id,
                                customerEmail: customer.email,
                                customerName: `${customer.firstName} ${customer.lastName}`,
                                tenderTitle: tender.title,
                                tenderValue: tender.value,
                                tenderState: tender.state,
                                tenderCategory: tender.category?.name || tender.categoryName,
                                tenderClosingDate: tender.closingDate,
                                matchedStates,
                                matchedCategories,
                            });
                        }
                    }
                }
            }

            this.logger.log(`Found ${matches.length} new tender-customer matches`);

            // Send alerts
            for (const match of matches) {
                await this.sendTenderAlert(match);
            }

            this.logger.log('Tender alert check completed');
        } catch (error) {
            this.logger.error('Error in tender alert check', error);
        }
    }

    private async sendTenderAlert(match: TenderMatch) {
        try {
            const websiteUrl = process.env.WEBSITE_FRONTEND_URL || 'http://localhost:5173';

            // Create alert record
            await this.prisma.tenderAlert.create({
                data: {
                    customerId: match.customerId,
                    tenderId: match.tenderId,
                },
            });

            // Get customer's additional email recipients
            const customer = await this.prisma.customer.findUnique({
                where: { id: match.customerId },
                select: { emailRecipients: true },
            });

            const recipients = [match.customerEmail, ...(customer?.emailRecipients || [])];

            // Format value
            const formatValue = (val: number | null) => {
                if (!val) return 'Not specified';
                if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
                if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
                return `₹${val.toLocaleString()}`;
            };

            // Format date
            const formatDate = (date: Date | null) => {
                if (!date) return 'Not specified';
                return new Date(date).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                });
            };

            // Send email
            const html = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: #1a4f72; padding: 20px; text-align: center;">
                        <h1 style="color: white; margin: 0;">🔔 New Tender Alert</h1>
                    </div>
                    <div style="padding: 20px; background: #f8fafc;">
                        <p style="font-size: 16px;">Dear ${match.customerName},</p>
                        <p style="font-size: 16px;">A new tender matching your preferences has been published:</p>
                        
                        <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb;">
                            <h2 style="color: #1a4f72; margin-top: 0;">${match.tenderTitle}</h2>
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 8px 0; color: #6b7280;">Value:</td>
                                    <td style="padding: 8px 0; font-weight: bold; color: #f5820d;">${formatValue(match.tenderValue)}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #6b7280;">State:</td>
                                    <td style="padding: 8px 0;">${match.tenderState || 'Not specified'}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #6b7280;">Category:</td>
                                    <td style="padding: 8px 0;">${match.tenderCategory || 'Not specified'}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #6b7280;">Closing Date:</td>
                                    <td style="padding: 8px 0;">${formatDate(match.tenderClosingDate)}</td>
                                </tr>
                            </table>
                            
                            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
                                <p style="margin: 0; font-size: 14px; color: #6b7280;">Matched by:</p>
                                ${match.matchedStates.length > 0 ? `<p style="margin: 5px 0; font-size: 14px;"><strong>States:</strong> ${match.matchedStates.join(', ')}</p>` : ''}
                                ${match.matchedCategories.length > 0 ? `<p style="margin: 5px 0; font-size: 14px;"><strong>Categories:</strong> ${match.matchedCategories.join(', ')}</p>` : ''}
                            </div>
                        </div>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${websiteUrl}/tender/${match.tenderId}" 
                               style="background: #f5820d; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                                View Tender Details
                            </a>
                        </div>
                        
                        <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
                            You received this email because your alert preferences match this tender.
                            <br>
                            <a href="${websiteUrl}/alert-settings">Manage your alert preferences</a>
                        </p>
                    </div>
                    <div style="background: #1a4f72; padding: 15px; text-align: center;">
                        <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                            © ${new Date().getFullYear()} Grow Tenders. All rights reserved.
                        </p>
                    </div>
                </div>
            `;

            for (const recipient of recipients) {
                await this.emailService.sendEmail({
                    to: recipient,
                    subject: `🔔 New Tender Alert: ${match.tenderTitle.substring(0, 50)}...`,
                    html,
                    customerId: match.customerId,
                    tenderId: match.tenderId,
                });
            }

            this.logger.log(`Alert sent to ${match.customerEmail} for tender ${match.tenderId}`);
        } catch (error) {
            this.logger.error(`Failed to send alert for tender ${match.tenderId}`, error);
        }
    }

    // Manual trigger for testing
    async triggerAlertCheck() {
        await this.checkNewTendersAndSendAlerts();
        return { message: 'Alert check triggered' };
    }
}
