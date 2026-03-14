import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { EmailService } from '../../email/email.service';

@Injectable()
export class TenderNotificationService {
    private readonly logger = new Logger(TenderNotificationService.name);

    constructor(
        private prisma: PrismaService,
        private emailService: EmailService,
    ) { }

    async sendNewTenderAlerts(specificTenders?: any[]): Promise<number> {
        this.logger.log('Starting tender notification process...');

        // 1. Queue Generation
        await this.generateDispatchQueue(specificTenders);

        // 2. Queue Processing
        return await this.processDispatchQueue();
    }

    private async generateDispatchQueue(specificTenders?: any[]) {
        // Get all active subscriptions
        const subscriptions = await this.prisma.tenderSubscription.findMany({
            where: { isActive: true },
            include: {
                customer: { select: { id: true, subscriptionActive: true } },
            },
        });

        if (subscriptions.length === 0) return;

        let newTenders: any[] = [];

        if (specificTenders && specificTenders.length > 0) {
            newTenders = specificTenders;
            this.logger.log(`Processing ${newTenders.length} specific tenders for notifications.`);
        } else {
            // Fallback: Get recent PUBLISHED tenders (last 3 hours)
            const lastRun = new Date(Date.now() - 3 * 60 * 60 * 1000);
            newTenders = await this.prisma.tender.findMany({
                where: {
                    status: 'PUBLISHED',
                    createdAt: { gte: lastRun },
                    source: 'GEM',
                },
            });
        }

        if (newTenders.length === 0) return;

        const activeSubscriptions = subscriptions.filter(s => s.customer?.subscriptionActive);
        if (activeSubscriptions.length === 0) return;

        const tenderIds = newTenders.map(t => t.id).filter(Boolean);
        const customerIds = activeSubscriptions.map(s => s.customer.id);

        // Prefetch already queued pairs for this batch to avoid N*M queries
        const existingPairs = await this.prisma.tenderDispatchQueue.findMany({
            where: {
                tenderId: { in: tenderIds },
                customerId: { in: customerIds },
            },
            select: { tenderId: true, customerId: true },
        });
        const existingSet = new Set(existingPairs.map(p => `${p.tenderId}::${p.customerId}`));

        const toInsert: Array<{ tenderId: string; customerId: string; status: 'PENDING' }> = [];

        for (const subscription of activeSubscriptions) {
            const matchingTenders = newTenders.filter(tender => {
                const stateMatch = subscription.states.length === 0 ||
                    (tender.state && subscription.states.some(s =>
                        tender.state!.toLowerCase().includes(s.toLowerCase())
                    ));

                const categoryMatch = subscription.categories.length === 0 ||
                    subscription.categories.some(cat =>
                        tender.title?.toLowerCase().includes(cat.toLowerCase()) ||
                        tender.description?.toLowerCase().includes(cat.toLowerCase()) ||
                        tender.categoryName?.toLowerCase().includes(cat.toLowerCase())
                    );

                return stateMatch && categoryMatch;
            });

            for (const tender of matchingTenders) {
                const key = `${tender.id}::${subscription.customer.id}`;
                if (existingSet.has(key)) continue;
                existingSet.add(key);
                toInsert.push({
                    tenderId: tender.id,
                    customerId: subscription.customer.id,
                    status: 'PENDING',
                });
            }
        }

        if (toInsert.length === 0) {
            this.logger.log('No new dispatch items to queue.');
            return;
        }

        // Batch insert; unique constraint (tenderId, customerId) prevents duplicates
        const result = await this.prisma.tenderDispatchQueue.createMany({
            data: toInsert,
            ...(process.env.PRISMA_SKIP_DUPLICATES === 'false' ? {} : ({ skipDuplicates: true } as any)),
        } as any);

        this.logger.log(`Queued ${result.count} new dispatch items.`);
    }

    private async processDispatchQueue(): Promise<number> {
        const pendingItems = await this.prisma.tenderDispatchQueue.findMany({
            where: { status: 'PENDING' },
            take: 50, // Batch size
            include: {
                tender: true,
                customer: { select: { id: true, email: true, firstName: true } },
            },
        });

        if (pendingItems.length === 0) return 0;

        let sentCount = 0;

        // Group by customer to send 1 email with multiple tenders
        const customerBatches = new Map<string, typeof pendingItems>();

        for (const item of pendingItems) {
            customerBatches.set(item.customerId, (customerBatches.get(item.customerId) || []).concat(item));
        }

        for (const items of customerBatches.values()) {
            const customer = items[0].customer; // All items have same customer
            if (!customer || !customer.email) {
                // Mark as failed
                await this.prisma.tenderDispatchQueue.updateMany({
                    where: { id: { in: items.map(i => i.id) } },
                    data: { status: 'FAILED', errorMessage: 'No email found' }
                });
                continue;
            }

            const tenders = items.map(i => i.tender);

            try {
                await this.sendTenderEmail(customer.email, customer.firstName || 'Customer', tenders);

                // Mark as SENT
                await this.prisma.tenderDispatchQueue.updateMany({
                    where: { id: { in: items.map(i => i.id) } },
                    data: { status: 'SENT', lastAttemptAt: new Date() }
                });
                sentCount += items.length;
            } catch (error) {
                this.logger.error(`Failed to send email to ${customer.email}: ${error.message}`);
                // Mark as FAILED or retry logic (increment retry count)
                await this.prisma.tenderDispatchQueue.updateMany({
                    where: { id: { in: items.map(i => i.id) } },
                    data: {
                        status: 'FAILED',
                        errorMessage: error.message,
                        lastAttemptAt: new Date(),
                        retryCount: { increment: 1 }
                    }
                });
            }
        }

        return sentCount;
    }

    private async sendTenderEmail(
        email: string,
        name: string,
        tenders: any[],
    ): Promise<void> {
        const subject = `🔔 ${tenders.length} New Tender${tenders.length > 1 ? 's' : ''} Matching Your Preferences`;

        const distinctStates = new Set(
            (tenders || [])
                .map((t) => (t?.state ? String(t.state).trim() : ''))
                .filter(Boolean),
        );
        const stateForRouting = distinctStates.size === 1 ? Array.from(distinctStates)[0] : undefined;

        const tenderList = tenders.slice(0, 10).map(t => `
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">
                    <strong><a href="${t.tenderUrl || '#'}" style="color: #667eea; text-decoration: none;">${t.referenceId || 'View'}</a></strong><br>
                    <span style="color: #666;">${t.title?.substring(0, 100)}${t.title?.length > 100 ? '...' : ''}</span>
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">
                    ${t.state || 'N/A'}
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">
                    ${t.closingDate ? new Date(t.closingDate).toLocaleDateString('en-IN') : 'N/A'}
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">
                    ${t.tenderUrl ? `
                    <a href="${t.tenderUrl}" style="background: #28a745; color: white; padding: 6px 12px; border-radius: 4px; text-decoration: none; font-size: 12px; white-space: nowrap;">
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
                        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/gem-tenders" 
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
            purpose: 'AUTO',
            state: stateForRouting,
        });
    }
}
