import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../../prisma/prisma.service';

interface SendEmailOptions {
    to: string;
    cc?: string;
    bcc?: string;
    subject: string;
    html: string;
    attachments?: Array<{
        filename: string;
        content: Buffer | string;
        contentType?: string;
    }>;
    // For logging
    customerId?: string;
    leadId?: string;
    invoiceId?: string;
    tenderId?: string;
}

@Injectable()
export class EmailService {
    private readonly logger = new Logger(EmailService.name);
    private transporter: nodemailer.Transporter;

    constructor(
        private configService: ConfigService,
        private prisma: PrismaService,
    ) {
        this.initTransporter();
    }

    private initTransporter() {
        const useSendGrid = this.configService.get<string>('USE_SENDGRID') === 'true';

        if (useSendGrid) {
            // SendGrid configuration
            this.transporter = nodemailer.createTransport({
                host: 'smtp.sendgrid.net',
                port: 587,
                auth: {
                    user: 'apikey',
                    pass: this.configService.get<string>('SENDGRID_API_KEY'),
                },
            });
        } else {
            // Gmail SMTP configuration
            this.transporter = nodemailer.createTransport({
                host: this.configService.get<string>('SMTP_HOST', 'smtp.gmail.com'),
                port: parseInt(this.configService.get<string>('SMTP_PORT') || '587'),
                secure: this.configService.get<string>('SMTP_SECURE') === 'true',
                auth: {
                    user: this.configService.get<string>('SMTP_USER'),
                    pass: this.configService.get<string>('SMTP_PASS'),
                },
            });
        }
    }

    async sendEmail(options: SendEmailOptions): Promise<boolean> {
        try {
            const mailOptions = {
                from: this.configService.get<string>('EMAIL_FROM') || 'noreply@salescrm.com',
                to: options.to,
                cc: options.cc,
                bcc: options.bcc,
                subject: options.subject,
                html: options.html,
                attachments: options.attachments,
            };

            await this.transporter.sendMail(mailOptions);

            // Log the email
            await this.logEmail({
                ...options,
                status: 'sent',
            });

            this.logger.log(`Email sent successfully to ${options.to}`);
            return true;
        } catch (error) {
            this.logger.error(`Failed to send email to ${options.to}`, error);

            // Log the failure
            await this.logEmail({
                ...options,
                status: 'failed',
                error: error.message,
            });

            return false;
        }
    }

    private async logEmail(data: SendEmailOptions & { status: string; error?: string }) {
        try {
            await this.prisma.emailLog.create({
                data: {
                    to: data.to,
                    cc: data.cc,
                    bcc: data.bcc,
                    subject: data.subject,
                    body: data.html,
                    status: data.status,
                    error: data.error,
                    customerId: data.customerId,
                    leadId: data.leadId,
                    invoiceId: data.invoiceId,
                    tenderId: data.tenderId,
                },
            });
        } catch (error) {
            this.logger.error('Failed to log email', error);
        }
    }

    // Send email using template
    async sendEmailWithTemplate(
        templateName: string,
        to: string,
        variables: Record<string, string>,
        options?: {
            leadId?: string;
            customerId?: string;
            invoiceId?: string;
            tenderId?: string;
            attachments?: Array<{
                filename: string;
                content: Buffer | string;
                contentType?: string;
            }>;
        },
    ) {
        const template = await this.prisma.emailTemplate.findUnique({
            where: { name: templateName },
        });

        if (!template) {
            throw new Error(`Template "${templateName}" not found`);
        }

        let subject = template.subject;
        let body = template.body;

        // Replace variables in subject and body
        for (const [key, value] of Object.entries(variables)) {
            const regex = new RegExp(`{{${key}}}`, 'g');
            subject = subject.replace(regex, value);
            body = body.replace(regex, value);
        }

        return this.sendEmail({
            to,
            subject,
            html: body,
            ...options,
        });
    }

    // Email Templates CRUD
    async createTemplate(data: {
        name: string;
        subject: string;
        body: string;
        type: string;
        variables?: string[];
    }) {
        return this.prisma.emailTemplate.create({
            data: {
                name: data.name,
                subject: data.subject,
                body: data.body,
                type: data.type,
                variables: data.variables || [],
            },
        });
    }

    async getTemplates(type?: string) {
        return this.prisma.emailTemplate.findMany({
            where: type ? { type, isActive: true } : { isActive: true },
            orderBy: { name: 'asc' },
        });
    }

    async getTemplate(id: string) {
        return this.prisma.emailTemplate.findUnique({
            where: { id },
        });
    }

    async getTemplateByName(name: string) {
        return this.prisma.emailTemplate.findUnique({
            where: { name },
        });
    }

    async updateTemplate(id: string, data: Partial<{
        name: string;
        subject: string;
        body: string;
        type: string;
        variables: string[];
        isActive: boolean;
    }>) {
        return this.prisma.emailTemplate.update({
            where: { id },
            data,
        });
    }

    async deleteTemplate(id: string) {
        return this.prisma.emailTemplate.update({
            where: { id },
            data: { isActive: false },
        });
    }

    // Email Logs
    async getEmailLogs(filters?: {
        customerId?: string;
        leadId?: string;
        invoiceId?: string;
        tenderId?: string;
        limit?: number;
    }) {
        return this.prisma.emailLog.findMany({
            where: {
                customerId: filters?.customerId,
                leadId: filters?.leadId,
                invoiceId: filters?.invoiceId,
                tenderId: filters?.tenderId,
            },
            orderBy: { createdAt: 'desc' },
            take: filters?.limit || 100,
        });
    }

    async getEmailLogsByEntity(entityType: string, entityId: string) {
        const where: any = {};
        if (entityType === 'lead') where.leadId = entityId;
        if (entityType === 'customer') where.customerId = entityId;
        if (entityType === 'invoice') where.invoiceId = entityId;
        if (entityType === 'tender') where.tenderId = entityId;

        return this.prisma.emailLog.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });
    }

    async sendInvoiceEmail(invoiceId: string, to: string, customerId: string, pdfBuffer: Buffer, invoiceNumber: string) {
        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Invoice ${invoiceNumber}</h2>
        <p>Dear Customer,</p>
        <p>Please find attached your invoice ${invoiceNumber}.</p>
        <p>If you have any questions regarding this invoice, please don't hesitate to contact us.</p>
        <p>Thank you for your business!</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #6b7280; font-size: 12px;">This is an automated email from Sales CRM.</p>
      </div>
    `;

        return this.sendEmail({
            to,
            subject: `Invoice ${invoiceNumber}`,
            html,
            attachments: [
                {
                    filename: `invoice-${invoiceNumber}.pdf`,
                    content: pdfBuffer,
                    contentType: 'application/pdf',
                },
            ],
            invoiceId,
            customerId,
        });
    }

    async sendTenderNotification(tenderId: string, to: string, customerId: string, tenderTitle: string, tenderSummary: string) {
        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">New Tender Opportunity</h2>
        <p>Dear Customer,</p>
        <p>A new tender matching your subscription has been published:</p>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0;">${tenderTitle}</h3>
          <p style="margin: 0; color: #4b5563;">${tenderSummary}</p>
        </div>
        <p>Log in to your account to view the full details and submit your bid.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #6b7280; font-size: 12px;">You received this email because you are subscribed to tender notifications.</p>
      </div>
    `;

        return this.sendEmail({
            to,
            subject: `New Tender: ${tenderTitle}`,
            html,
            tenderId,
            customerId,
        });
    }

    // Send bulk tender emails to subscribers
    async sendTenderEmailsToSubscribers(tenderId: string, categoryId: string) {
        const tender = await this.prisma.tender.findUnique({
            where: { id: tenderId },
            include: { category: true },
        });

        if (!tender) {
            throw new Error('Tender not found');
        }

        // Find all active subscriptions for this category
        const subscriptions = await this.prisma.tenderSubscription.findMany({
            where: {
                categories: { has: categoryId },
                isActive: true,
            },
            include: {
                customer: true,
            },
        });

        const results = await Promise.all(
            subscriptions.map(async (subscription) => {
                return this.sendTenderNotification(
                    tender.id,
                    subscription.customer.email,
                    subscription.customerId,
                    tender.title,
                    tender.description || '',
                );
            }),
        );

        return {
            total: subscriptions.length,
            sent: results.filter((r) => r).length,
            failed: results.filter((r) => !r).length,
        };
    }
}

