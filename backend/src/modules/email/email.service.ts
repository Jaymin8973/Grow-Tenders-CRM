import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as dns from 'node:dns';
import * as nodemailer from 'nodemailer';
import * as SMTPTransport from 'nodemailer/lib/smtp-transport';
import { PrismaService } from '../../prisma/prisma.service';
import { decryptSecret, encryptSecret } from '@/common/crypto/secret-crypto';

type EmailPurpose = 'OTP' | 'AUTO';

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

    purpose?: EmailPurpose;
    state?: string;
}

@Injectable()
export class EmailService {
    private readonly logger = new Logger(EmailService.name);
    private cachedTransporter: nodemailer.Transporter | null = null;
    private cachedTransporterKey: string | null = null;
    private cachedFromEmail: string | null = null;

    private cachedTransportersById = new Map<string, nodemailer.Transporter>();

    constructor(
        private configService: ConfigService,
        private prisma: PrismaService,
    ) {
        this.initDnsPreference();
    }

    private initDnsPreference() {
        const preferIpv4 =
            this.configService.get<string>('SMTP_PREFER_IPV4') === 'true' ||
            Boolean(process.env.RENDER) ||
            Boolean(process.env.RENDER_SERVICE_ID);

        if (preferIpv4) {
            try {
                dns.setDefaultResultOrder('ipv4first');
            } catch {
                // ignore
            }
        }
    }

    private buildTransporterFromEnv(): { transporter: nodemailer.Transporter; fromEmail: string; mode: string } {
        const useSendGrid = this.configService.get<string>('USE_SENDGRID') === 'true';
        if (useSendGrid) {
            const transportOptions: SMTPTransport.Options = {
                host: 'smtp.sendgrid.net',
                port: 587,
                auth: {
                    user: 'apikey',
                    pass: this.configService.get<string>('SENDGRID_API_KEY'),
                },
            };
            return {
                transporter: nodemailer.createTransport(transportOptions),
                fromEmail: this.configService.get<string>('EMAIL_FROM') || 'noreply@salescrm.com',
                mode: 'sendgrid',
            };
        }

        const host = this.configService.get<string>('SMTP_HOST', 'smtp.gmail.com');
        const transportOptions: SMTPTransport.Options = {
            host,
            port: parseInt(this.configService.get<string>('SMTP_PORT') || '587'),
            secure: this.configService.get<string>('SMTP_SECURE') === 'true',
            auth: {
                user: this.configService.get<string>('SMTP_USER'),
                pass: this.configService.get<string>('SMTP_PASS'),
            },
        };
        return {
            transporter: nodemailer.createTransport(transportOptions),
            fromEmail: this.configService.get<string>('EMAIL_FROM') || 'noreply@salescrm.com',
            mode: 'smtp',
        };
    }

    private buildTransporterFromDbConfig(config: {
        host: string;
        port: number;
        secure: boolean;
        username: string;
        passwordEnc: string;
    }): nodemailer.Transporter {
        const pass = decryptSecret(config.passwordEnc);
        const transportOptions: SMTPTransport.Options = {
            host: config.host,
            port: config.port,
            secure: config.secure,
            auth: {
                user: config.username,
                pass,
            },
        };
        return nodemailer.createTransport(transportOptions);
    }

    private normalizeState(value?: string | null): string | null {
        if (!value) return null;
        const s = String(value).trim();
        if (!s) return null;
        return s.toLowerCase();
    }

    private async getTransporter(params?: {
        purpose?: EmailPurpose;
        state?: string;
    }): Promise<{ transporter: nodemailer.Transporter; fromEmail: string; source: string; smtpConfigId?: string } > {
        const purpose: EmailPurpose = params?.purpose || 'AUTO';
        const desiredState = this.normalizeState(params?.state);

        const enabledConfigs = await (this.prisma as any).smtpConfig.findMany({
            where: { isEnabled: true, purpose },
            orderBy: { updatedAt: 'desc' },
        });

        const pickConfig = () => {
            if (enabledConfigs.length === 0) return null;

            if (purpose === 'AUTO' && desiredState) {
                const stateMatch = enabledConfigs.find((c: any) =>
                    Array.isArray(c.states) && c.states.some((st: string) => this.normalizeState(st) === desiredState),
                );
                if (stateMatch) return stateMatch;
            }

            const active = enabledConfigs.find((c: any) => c.isActive);
            return active || enabledConfigs[0];
        };

        const chosen = pickConfig();

        if (chosen) {
            const key = `${chosen.id}:${chosen.updatedAt?.getTime?.() ?? chosen.updatedAt}`;
            const cached = this.cachedTransportersById.get(key);
            if (cached) {
                return { transporter: cached, fromEmail: chosen.fromEmail, source: 'db', smtpConfigId: chosen.id };
            }

            const transporter = this.buildTransporterFromDbConfig(chosen);
            try {
                await transporter.verify();
                this.logger.log(
                    `SMTP transporter verified (source=db name=${chosen.name} purpose=${purpose}${desiredState ? ` state=${desiredState}` : ''})`,
                );
            } catch (err: any) {
                this.logger.error(
                    `SMTP transporter verification failed (source=db name=${chosen.name} purpose=${purpose}): ${err?.message || err}`,
                    err?.stack,
                );

                // Fallback to env-based transporter so critical flows (e.g. SUPER_ADMIN OTP) don't get blocked.
                const envTransport = this.buildTransporterFromEnv();
                try {
                    await envTransport.transporter.verify();
                    this.logger.warn(`Falling back to env SMTP (db SMTP invalid). mode=${envTransport.mode}`);
                    return { transporter: envTransport.transporter, fromEmail: envTransport.fromEmail, source: 'env' };
                } catch (envErr: any) {
                    this.logger.error(
                        `SMTP transporter verification failed (source=env fallback mode=${envTransport.mode}): ${envErr?.message || envErr}`,
                        envErr?.stack,
                    );
                    throw new BadRequestException('SMTP configuration is invalid and env SMTP is also unavailable.');
                }
            }

            this.cachedTransportersById.set(key, transporter);
            return { transporter, fromEmail: chosen.fromEmail, source: 'db', smtpConfigId: chosen.id };
        }

        const envTransport = this.buildTransporterFromEnv();
        try {
            await envTransport.transporter.verify();
            this.logger.log(`SMTP transporter verified (source=env mode=${envTransport.mode})`);
        } catch (err: any) {
            this.logger.error(
                `SMTP transporter verification failed (source=env mode=${envTransport.mode}): ${err?.message || err}`,
                err?.stack,
            );
        }
        return { transporter: envTransport.transporter, fromEmail: envTransport.fromEmail, source: 'env' };
    }

    async sendEmail(options: SendEmailOptions): Promise<boolean> {
        try {
            const { transporter, fromEmail } = await this.getTransporter({
                purpose: options.purpose,
                state: options.state,
            });
            const mailOptions = {
                from: fromEmail,
                to: options.to,
                cc: options.cc,
                bcc: options.bcc,
                subject: options.subject,
                html: options.html,
                attachments: options.attachments,
            };

            await transporter.sendMail(mailOptions);

            // Log the email
            await this.logEmail({
                ...options,
                status: 'sent',
            });

            this.logger.log(`Email sent successfully to ${options.to}`);
            return true;
        } catch (error) {
            const err: any = error;
            this.logger.error(
                `Failed to send email to ${options.to}: ${err?.message || err} (code=${err?.code || 'n/a'} response=${err?.response || 'n/a'})`,
                err?.stack,
            );

            // Log the failure
            await this.logEmail({
                ...options,
                status: 'failed',
                error: err?.message || String(err),
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

    async sendInvoiceEmail(invoiceId: string, to: string, customerId: string, pdfBuffer: Buffer, invoiceNumber: string, filename?: string) {
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
                    filename: filename || `invoice-${invoiceNumber}.pdf`,
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

    // SMTP Configs (Super Admin)
    async listSmtpConfigs() {
        return (this.prisma as any).smtpConfig.findMany({
            orderBy: [{ isActive: 'desc' }, { updatedAt: 'desc' }],
            select: {
                id: true,
                name: true,
                host: true,
                port: true,
                secure: true,
                username: true,
                fromEmail: true,
                purpose: true,
                states: true,
                isActive: true,
                isEnabled: true,
                createdAt: true,
                updatedAt: true,
            },
        });
    }

    async createSmtpConfig(data: {
        name: string;
        host: string;
        port: number;
        secure?: boolean;
        username: string;
        password: string;
        fromEmail: string;
        purpose?: string;
        states?: string[];
        isEnabled?: boolean;
        activate?: boolean;
    }) {
        const passwordEnc = encryptSecret(data.password);

        const created = await (this.prisma as any).smtpConfig.create({
            data: {
                name: data.name,
                host: data.host,
                port: data.port,
                secure: data.secure ?? false,
                username: data.username,
                passwordEnc,
                fromEmail: data.fromEmail,
                purpose: (data.purpose || 'AUTO').toUpperCase(),
                states: data.states || [],
                isEnabled: data.isEnabled ?? true,
                isActive: false,
            },
        });

        if (data.activate) {
            await this.activateSmtpConfig(created.id);
        }

        return created;
    }

    async updateSmtpConfig(id: string, data: Partial<{
        name: string;
        host: string;
        port: number;
        secure: boolean;
        username: string;
        password: string;
        fromEmail: string;
        purpose: string;
        states: string[];
        isEnabled: boolean;
    }>) {
        const existing = await (this.prisma as any).smtpConfig.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException('SMTP config not found');

        return (this.prisma as any).smtpConfig.update({
            where: { id },
            data: {
                name: data.name,
                host: data.host,
                port: data.port,
                secure: data.secure,
                username: data.username,
                fromEmail: data.fromEmail,
                purpose: data.purpose ? data.purpose.toUpperCase() : undefined,
                states: data.states,
                isEnabled: data.isEnabled,
                passwordEnc: data.password ? encryptSecret(data.password) : undefined,
            },
        });
    }

    async deleteSmtpConfig(id: string) {
        const existing = await (this.prisma as any).smtpConfig.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException('SMTP config not found');

        if (existing.isActive) {
            throw new BadRequestException('Cannot delete the active SMTP config. Activate another first.');
        }

        await (this.prisma as any).smtpConfig.delete({ where: { id } });
        return { success: true };
    }

    async activateSmtpConfig(id: string) {
        const existing = await (this.prisma as any).smtpConfig.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException('SMTP config not found');
        if (!existing.isEnabled) throw new BadRequestException('Cannot activate a disabled SMTP config');

        const purpose = (existing.purpose || 'AUTO') as string;

        await this.prisma.$transaction([
            (this.prisma as any).smtpConfig.updateMany({
                where: { isActive: true, purpose },
                data: { isActive: false },
            }),
            (this.prisma as any).smtpConfig.update({
                where: { id },
                data: { isActive: true },
            }),
        ]);

        // Bust cache
        this.cachedTransporter = null;
        this.cachedTransporterKey = null;
        this.cachedFromEmail = null;
        this.cachedTransportersById.clear();

        return { success: true };
    }

    async testSmtpConfig(id: string, options?: { to?: string }) {
        const existing = await (this.prisma as any).smtpConfig.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException('SMTP config not found');
        if (!existing.isEnabled) throw new BadRequestException('SMTP config is disabled');

        const transporter = this.buildTransporterFromDbConfig(existing);
        await transporter.verify();

        if (options?.to) {
            await transporter.sendMail({
                from: existing.fromEmail,
                to: options.to,
                subject: `SMTP Test: ${existing.name}`,
                html: '<p>SMTP configuration test successful.</p>',
            });
        }

        return { success: true };
    }
}

