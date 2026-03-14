import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InvoiceStatus, InvoiceType, LeadStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { PdfService } from './pdf.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class InvoicesService {
    constructor(
        private prisma: PrismaService,
        private pdfService: PdfService,
        private emailService: EmailService,
    ) { }

    private async generateInvoiceNumber(): Promise<string> {
        const count = await this.prisma.invoice.count();
        const year = new Date().getFullYear();
        return `INV-${year}-${String(count + 1).padStart(5, '0')}`;
    }

    async create(createInvoiceDto: CreateInvoiceDto, userId: string) {
        // Validate lead status for lead-based invoices
        if (createInvoiceDto.leadId) {
            const lead = await this.prisma.lead.findUnique({
                where: { id: createInvoiceDto.leadId },
            });

            if (!lead) {
                throw new NotFoundException('Lead not found');
            }

            const invoiceType = createInvoiceDto.invoiceType || InvoiceType.REGULAR;

            // PERFORMA invoice only allowed for PROPOSAL_LEAD
            if (invoiceType === InvoiceType.PERFORMA && lead.status !== LeadStatus.PROPOSAL_LEAD) {
                throw new ForbiddenException('Performa invoice can only be created for leads with PROPOSAL status');
            }

            // REGULAR invoice only allowed for HOT_LEAD
            if (invoiceType === InvoiceType.REGULAR && lead.status !== LeadStatus.HOT_LEAD) {
                throw new ForbiddenException('Regular invoice can only be created for leads with HOT status');
            }
        }

        const invoiceNumber = await this.generateInvoiceNumber();

        // Calculate totals
        let subtotal = 0;
        if (createInvoiceDto.lineItems) {
            subtotal = createInvoiceDto.lineItems.reduce(
                (sum, item) => sum + item.quantity * item.unitPrice,
                0,
            );
        }

        const taxAmount = subtotal * (createInvoiceDto.taxRate || 0) / 100;
        let discount = 0;
        if (createInvoiceDto.discount) {
            if (createInvoiceDto.discountType === 'percentage') {
                discount = subtotal * createInvoiceDto.discount / 100;
            } else {
                discount = createInvoiceDto.discount;
            }
        }
        const total = subtotal + taxAmount - discount;

        const invoice = await this.prisma.invoice.create({
            data: {
                invoiceNumber,
                companyName: createInvoiceDto.companyName,
                companyAddress: createInvoiceDto.companyAddress,
                companyPhone: createInvoiceDto.companyPhone,
                companyEmail: createInvoiceDto.companyEmail,
                companyLogo: createInvoiceDto.companyLogo,
                customerId: createInvoiceDto.customerId,
                leadId: createInvoiceDto.leadId,
                invoiceType: createInvoiceDto.invoiceType || InvoiceType.REGULAR,

                subtotal,
                taxRate: createInvoiceDto.taxRate || 0,
                taxAmount,
                discount,
                discountType: createInvoiceDto.discountType,
                status: InvoiceStatus.DRAFT,
                total,
                paymentTerms: createInvoiceDto.paymentTerms,
                dueDate: createInvoiceDto.dueDate ? new Date(createInvoiceDto.dueDate) : null,
                notes: createInvoiceDto.notes,
                termsConditions: createInvoiceDto.termsConditions,
                createdById: userId,
                lineItems: {
                    create: createInvoiceDto.lineItems?.map(item => ({
                        description: item.description,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        total: item.quantity * item.unitPrice,
                    })),
                },
            },
            include: {
                customer: {
                    select: { id: true, firstName: true, lastName: true, email: true, company: true },
                },
                lead: {
                    select: { id: true, firstName: true, lastName: true, email: true, company: true, status: true },
                },
                lineItems: true,
                createdBy: {
                    select: { id: true, firstName: true, lastName: true },
                },
            },
        });

        return invoice;
    }



    async findAll(filters?: {
        status?: InvoiceStatus;
        customerId?: string;
        search?: string;
        page?: number;
        pageSize?: number;
    }) {
        let where: any = {};

        if (filters?.status) {
            where.status = filters.status;
        }
        if (filters?.customerId) {
            where.customerId = filters.customerId;
        }
        if (filters?.search) {
            where.OR = [
                { invoiceNumber: { contains: filters.search, mode: 'insensitive' } },
                { customer: { company: { contains: filters.search, mode: 'insensitive' } } },
            ];
        }

        const pageSize = Math.min(Math.max(filters?.pageSize ?? 25, 1), 100);
        const page = Math.max(filters?.page ?? 1, 1);

        const [items, total] = await Promise.all([
            this.prisma.invoice.findMany({
                where,
                skip: (page - 1) * pageSize,
                take: pageSize,
                include: {
                    customer: {
                        select: { id: true, firstName: true, lastName: true, email: true, company: true },
                    },
                    lead: {
                        select: { id: true, firstName: true, lastName: true, email: true, company: true, status: true },
                    },
                    createdBy: {
                        select: { id: true, firstName: true, lastName: true },
                    },
                    _count: {
                        select: { lineItems: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.invoice.count({ where }),
        ]);

        return { items, page, pageSize, total };
    }

    async findOne(id: string) {
        const invoice = await this.prisma.invoice.findUnique({
            where: { id },
            include: {
                customer: true,
                lead: true,
                lineItems: true,
                createdBy: {
                    select: { id: true, firstName: true, lastName: true },
                },
                emailLogs: {
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                },
            },
        });

        if (!invoice) {
            throw new NotFoundException('Invoice not found');
        }

        return invoice;
    }

    async update(id: string, updateInvoiceDto: UpdateInvoiceDto) {
        const invoice = await this.prisma.invoice.findUnique({ where: { id } });

        if (!invoice) {
            throw new NotFoundException('Invoice not found');
        }

        if (invoice.status !== InvoiceStatus.DRAFT) {
            throw new ForbiddenException('Can only update draft invoices');
        }

        // Recalculate totals if line items are provided
        let data: any = { ...updateInvoiceDto };

        if (updateInvoiceDto.lineItems) {
            const subtotal = updateInvoiceDto.lineItems.reduce(
                (sum, item) => sum + item.quantity * item.unitPrice,
                0,
            );
            const taxAmount = subtotal * (updateInvoiceDto.taxRate || invoice.taxRate) / 100;
            let discount = 0;
            if (updateInvoiceDto.discount || invoice.discount) {
                const discountValue = updateInvoiceDto.discount || invoice.discount;
                const discountType = updateInvoiceDto.discountType || invoice.discountType;
                if (discountType === 'percentage') {
                    discount = subtotal * discountValue / 100;
                } else {
                    discount = discountValue;
                }
            }
            data.subtotal = subtotal;
            data.taxAmount = taxAmount;
            data.discount = discount;
            data.total = subtotal + taxAmount - discount;

            // Delete existing line items and create new ones
            await this.prisma.invoiceLineItem.deleteMany({ where: { invoiceId: id } });
            await this.prisma.invoiceLineItem.createMany({
                data: updateInvoiceDto.lineItems.map(item => ({
                    invoiceId: id,
                    description: item.description,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    total: item.quantity * item.unitPrice,
                })),
            });
            delete data.lineItems;
        }

        if (updateInvoiceDto.dueDate) {
            data.dueDate = new Date(updateInvoiceDto.dueDate);
        }

        return this.prisma.invoice.update({
            where: { id },
            data,
            include: {
                customer: true,
                lineItems: true,
            },
        });
    }

    async updateStatus(id: string, status: InvoiceStatus) {
        const invoice = await this.prisma.invoice.findUnique({ where: { id } });

        if (!invoice) {
            throw new NotFoundException('Invoice not found');
        }

        const data: any = { status };
        if (status === InvoiceStatus.PAID) {
            data.paidDate = new Date();
        }

        return this.prisma.invoice.update({
            where: { id },
            data,
        });
    }

    async generatePdf(id: string): Promise<{ pdf: Buffer; companyName: string; invoiceNumber: string }> {
        const invoice = await this.findOne(id);
        const pdf = await this.pdfService.generateInvoicePdf(invoice);
        // Get company name from lead or customer
        const companyName = invoice.lead?.company || invoice.customer?.company || invoice.companyName || 'Invoice';
        return { pdf, companyName, invoiceNumber: invoice.invoiceNumber };
    }

    async sendInvoiceEmail(id: string, to?: string) {
        const invoice = await this.findOne(id);

        const recipient = to || invoice.customer?.email;
        if (!recipient) {
            throw new BadRequestException('Recipient email is required');
        }

        const pdfBuffer = await this.pdfService.generateInvoicePdf(invoice);
        // Get company name for filename
        const companyName = invoice.lead?.company || invoice.customer?.company || invoice.companyName || 'Invoice';
        const safeCompanyName = companyName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
        const filename = `${safeCompanyName}_${invoice.invoiceNumber}.pdf`;
        
        const sent = await this.emailService.sendInvoiceEmail(
            invoice.id,
            recipient,
            invoice.customer?.id || '',
            pdfBuffer,
            invoice.invoiceNumber,
            filename,
        );

        if (sent && invoice.status === InvoiceStatus.DRAFT) {
            await this.updateStatus(invoice.id, InvoiceStatus.SENT);
        }

        return { success: sent };
    }

    async delete(id: string) {
        const invoice = await this.prisma.invoice.findUnique({ where: { id } });

        if (!invoice) {
            throw new NotFoundException('Invoice not found');
        }

        if (invoice.status !== InvoiceStatus.DRAFT) {
            throw new ForbiddenException('Can only delete draft invoices');
        }

        // Delete related notifications that link to this invoice
        await this.prisma.notification.deleteMany({
            where: {
                link: { contains: `/invoices/${id}` }
            }
        });

        await this.prisma.invoice.delete({ where: { id } });
        return { message: 'Invoice deleted successfully' };
    }

    async getInvoiceStats() {
        const [total, byStatus, totalRevenue, paidRevenue] = await Promise.all([
            this.prisma.invoice.count(),
            this.prisma.invoice.groupBy({
                by: ['status'],
                _count: true,
                _sum: { total: true },
            }),
            this.prisma.invoice.aggregate({
                _sum: { total: true },
            }),
            this.prisma.invoice.aggregate({
                where: { status: InvoiceStatus.PAID },
                _sum: { total: true },
            }),
        ]);

        return {
            total,
            totalRevenue: totalRevenue._sum.total || 0,
            paidRevenue: paidRevenue._sum.total || 0,
            byStatus: byStatus.reduce((acc, item) => {
                acc[item.status] = {
                    count: item._count,
                    value: item._sum.total || 0,
                };
                return acc;
            }, {} as Record<InvoiceStatus, { count: number; value: number }>),
        };
    }
}
