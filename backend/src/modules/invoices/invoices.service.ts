import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Role, InvoiceStatus, DealStage } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { PdfService } from './pdf.service';

@Injectable()
export class InvoicesService {
    constructor(
        private prisma: PrismaService,
        private pdfService: PdfService,
    ) { }

    private async generateInvoiceNumber(): Promise<string> {
        const count = await this.prisma.invoice.count();
        const year = new Date().getFullYear();
        return `INV-${year}-${String(count + 1).padStart(5, '0')}`;
    }

    async create(createInvoiceDto: CreateInvoiceDto, userId: string) {
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
                dealId: createInvoiceDto.dealId,
                subtotal,
                taxRate: createInvoiceDto.taxRate || 0,
                taxAmount,
                discount,
                discountType: createInvoiceDto.discountType,
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
                deal: {
                    select: { id: true, title: true, value: true },
                },
                lineItems: true,
                createdBy: {
                    select: { id: true, firstName: true, lastName: true },
                },
            },
        });

        return invoice;
    }

    async createFromDeal(dealId: string, invoiceData: CreateInvoiceDto, userId: string) {
        const deal = await this.prisma.deal.findUnique({
            where: { id: dealId },
            include: { customer: true },
        });

        if (!deal) {
            throw new NotFoundException('Deal not found');
        }

        if (deal.stage !== DealStage.CLOSED_WON) {
            throw new ForbiddenException('Can only create invoice for closed-won deals');
        }

        const data = {
            ...invoiceData,
            dealId,
            customerId: deal.customerId || invoiceData.customerId,
        };

        return this.create(data, userId);
    }

    async findAll(filters?: {
        status?: InvoiceStatus;
        customerId?: string;
        search?: string;
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

        return this.prisma.invoice.findMany({
            where,
            include: {
                customer: {
                    select: { id: true, firstName: true, lastName: true, email: true, company: true },
                },
                deal: {
                    select: { id: true, title: true },
                },
                createdBy: {
                    select: { id: true, firstName: true, lastName: true },
                },
                _count: {
                    select: { lineItems: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: string) {
        const invoice = await this.prisma.invoice.findUnique({
            where: { id },
            include: {
                customer: true,
                deal: true,
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

    async generatePdf(id: string): Promise<Buffer> {
        const invoice = await this.findOne(id);
        return this.pdfService.generateInvoicePdf(invoice);
    }

    async delete(id: string) {
        const invoice = await this.prisma.invoice.findUnique({ where: { id } });

        if (!invoice) {
            throw new NotFoundException('Invoice not found');
        }

        if (invoice.status !== InvoiceStatus.DRAFT) {
            throw new ForbiddenException('Can only delete draft invoices');
        }

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
