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
            // Get all customers with alert preferences (exclude free trial users - they can only view tenders, no auto alerts)
            const customers = await this.prisma.customer.findMany({
                where: {
                    subscriptionActive: true,
                    freeTrialActive: false, // Exclude free trial users
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
            // Create alert record
            await this.prisma.tenderAlert.create({
                data: {
                    customerId: match.customerId,
                    tenderId: match.tenderId,
                },
            });

            // Get full tender details
            const tender = await this.prisma.tender.findUnique({
                where: { id: match.tenderId },
                include: { category: { select: { name: true } } },
            });

            if (!tender) {
                this.logger.error(`Tender ${match.tenderId} not found`);
                return;
            }

            // Get customer's additional email recipients
            const customer = await this.prisma.customer.findUnique({
                where: { id: match.customerId },
                select: { emailRecipients: true, firstName: true },
            });

            const recipients = [match.customerEmail, ...(customer?.emailRecipients || [])];

            // Format date
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

            // Build tender details HTML - Mobile First, Professional Design (same as scheduler.service.ts)
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
                            <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 600;">🔔 New Tender Alert</h1>
                            <p style="color: #e0e7ff; margin: 8px 0 0 0; font-size: 13px;">Grow Tender - Your Gateway to Government Contracts</p>
                        </div>
                        
                        <!-- Main Content -->
                        <div style="background: #ffffff; padding: 20px; border: 1px solid #e2e8f0; border-top: none;">
                            <p style="margin: 0 0 15px 0; color: #64748b; font-size: 14px;">
                                Hi ${customer?.firstName || match.customerName},
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
                                    <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #1e293b;">${tender.category?.name || tender.categoryName || 'General'}</td>
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
                                    <td style="padding: 10px 0; color: #64748b;">Department</td>
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
                            
                            <!-- Matched Preferences Info -->
                            ${(match.matchedStates.length > 0 || match.matchedCategories.length > 0) ? `
                            <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 12px; margin-bottom: 15px;">
                                <p style="margin: 0 0 8px 0; color: #1e40af; font-size: 12px; font-weight: 600;">Matched by your preferences:</p>
                                ${match.matchedStates.length > 0 ? `<p style="margin: 0 0 4px 0; color: #1e40af; font-size: 12px;"><strong>States:</strong> ${match.matchedStates.join(', ')}</p>` : ''}
                                ${match.matchedCategories.length > 0 ? `<p style="margin: 0; color: #1e40af; font-size: 12px;"><strong>Categories:</strong> ${match.matchedCategories.join(', ')}</p>` : ''}
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
                                You're receiving this because your alert preferences match this tender.
                            </p>
                            <p style="margin: 0; color: #94a3b8; font-size: 10px;">
                                © 2026 Grow Tender | <a href="https://grow-tender.com" style="color: #2563eb; text-decoration: none;">grow-tender.com</a>
                            </p>
                        </div>
                    </div>
                </body>
                </html>
            `;

            for (const recipient of recipients) {
                await this.emailService.sendEmail({
                    to: recipient,
                    subject: `🔔 New Tender: ${tender.title.substring(0, 50)}${tender.title.length > 50 ? '...' : ''}`,
                    html,
                    customerId: match.customerId,
                    tenderId: match.tenderId,
                    purpose: 'AUTO',
                    state: match.tenderState || undefined,
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
