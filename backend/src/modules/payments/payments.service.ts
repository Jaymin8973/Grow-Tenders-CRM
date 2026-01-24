import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ReferenceType, GstType, PaymentMethod } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';

@Injectable()
export class PaymentsService {
    constructor(private prisma: PrismaService) { }

    private async generatePaymentNumber(): Promise<string> {
        const lastPayment = await this.prisma.payment.findFirst({
            orderBy: { createdAt: 'desc' },
            select: { paymentNumber: true },
        });

        let nextNumber = 1;
        if (lastPayment?.paymentNumber) {
            const match = lastPayment.paymentNumber.match(/PAY-(\d+)/);
            if (match) {
                nextNumber = parseInt(match[1], 10) + 1;
            }
        }

        return `PAY-${nextNumber.toString().padStart(4, '0')}`;
    }

    private calculateGstAmounts(amount: number, gstType: GstType, gstPercentage: number = 18) {
        let gstAmount = 0;
        let totalAmount = amount;

        if (gstType === GstType.WITH_GST) {
            gstAmount = (amount * gstPercentage) / 100;
            totalAmount = amount + gstAmount;
        }

        return { gstAmount, totalAmount, gstPercentage };
    }

    async create(createPaymentDto: CreatePaymentDto, userId: string) {
        // Validate: Internal reference requires customerId
        if (createPaymentDto.referenceType === ReferenceType.INTERNAL && !createPaymentDto.customerId) {
            throw new BadRequestException('Customer ID is required for internal reference type');
        }

        // Validate: External reference requires customerName
        if (createPaymentDto.referenceType === ReferenceType.EXTERNAL && !createPaymentDto.customerName) {
            throw new BadRequestException('Customer name is required for external reference type');
        }

        // If internal, verify customer exists
        if (createPaymentDto.customerId) {
            const customer = await this.prisma.customer.findUnique({
                where: { id: createPaymentDto.customerId },
            });
            if (!customer) {
                throw new NotFoundException('Customer not found');
            }
        }

        // If invoice ID provided, verify it exists
        if (createPaymentDto.invoiceId) {
            const invoice = await this.prisma.invoice.findUnique({
                where: { id: createPaymentDto.invoiceId },
            });
            if (!invoice) {
                throw new NotFoundException('Invoice not found');
            }
        }

        const paymentNumber = await this.generatePaymentNumber();
        const { gstAmount, totalAmount, gstPercentage } = this.calculateGstAmounts(
            createPaymentDto.amount,
            createPaymentDto.gstType,
            createPaymentDto.gstPercentage
        );

        return this.prisma.payment.create({
            data: {
                paymentNumber,
                referenceType: createPaymentDto.referenceType,
                customerId: createPaymentDto.customerId,
                customerName: createPaymentDto.customerName,
                companyName: createPaymentDto.companyName,
                phone: createPaymentDto.phone,
                amount: createPaymentDto.amount,
                gstType: createPaymentDto.gstType,
                gstPercentage,
                gstAmount,
                totalAmount,
                paymentDate: createPaymentDto.paymentDate ? new Date(createPaymentDto.paymentDate) : new Date(),
                paymentMethod: createPaymentDto.paymentMethod,
                referenceNumber: createPaymentDto.referenceNumber,
                notes: createPaymentDto.notes,
                invoiceId: createPaymentDto.invoiceId,
                createdById: userId,
            },
            include: {
                customer: true,
                invoice: true,
                createdBy: {
                    select: { id: true, firstName: true, lastName: true },
                },
            },
        });
    }

    async findAll(filters?: {
        customerId?: string;
        referenceType?: ReferenceType;
        paymentMethod?: PaymentMethod;
        startDate?: string;
        endDate?: string;
        search?: string;
    }) {
        const where: any = {};

        if (filters?.customerId) {
            where.customerId = filters.customerId;
        }

        if (filters?.referenceType) {
            where.referenceType = filters.referenceType;
        }

        if (filters?.paymentMethod) {
            where.paymentMethod = filters.paymentMethod;
        }

        if (filters?.startDate || filters?.endDate) {
            where.paymentDate = {};
            if (filters.startDate) {
                where.paymentDate.gte = new Date(filters.startDate);
            }
            if (filters.endDate) {
                where.paymentDate.lte = new Date(filters.endDate);
            }
        }

        if (filters?.search) {
            where.OR = [
                { paymentNumber: { contains: filters.search, mode: 'insensitive' } },
                { customerName: { contains: filters.search, mode: 'insensitive' } },
                { companyName: { contains: filters.search, mode: 'insensitive' } },
                { referenceNumber: { contains: filters.search, mode: 'insensitive' } },
            ];
        }

        return this.prisma.payment.findMany({
            where,
            include: {
                customer: {
                    select: { id: true, firstName: true, lastName: true, company: true, phone: true },
                },
                invoice: {
                    select: { id: true, invoiceNumber: true },
                },
                createdBy: {
                    select: { id: true, firstName: true, lastName: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: string) {
        const payment = await this.prisma.payment.findUnique({
            where: { id },
            include: {
                customer: true,
                invoice: true,
                createdBy: {
                    select: { id: true, firstName: true, lastName: true, email: true },
                },
            },
        });

        if (!payment) {
            throw new NotFoundException('Payment not found');
        }

        return payment;
    }

    async update(id: string, updatePaymentDto: UpdatePaymentDto) {
        const payment = await this.prisma.payment.findUnique({ where: { id } });
        if (!payment) {
            throw new NotFoundException('Payment not found');
        }

        // Recalculate GST if amount or GST type changed
        let gstData = {};
        if (updatePaymentDto.amount !== undefined || updatePaymentDto.gstType !== undefined) {
            const amount = updatePaymentDto.amount ?? payment.amount;
            const gstType = updatePaymentDto.gstType ?? payment.gstType;
            const gstPercentage = updatePaymentDto.gstPercentage ?? payment.gstPercentage;

            const calculated = this.calculateGstAmounts(amount, gstType, gstPercentage);
            gstData = {
                gstAmount: calculated.gstAmount,
                totalAmount: calculated.totalAmount,
                gstPercentage: calculated.gstPercentage,
            };
        }

        return this.prisma.payment.update({
            where: { id },
            data: {
                ...updatePaymentDto,
                ...gstData,
                paymentDate: updatePaymentDto.paymentDate ? new Date(updatePaymentDto.paymentDate) : undefined,
            },
            include: {
                customer: true,
                invoice: true,
                createdBy: {
                    select: { id: true, firstName: true, lastName: true },
                },
            },
        });
    }

    async delete(id: string) {
        const payment = await this.prisma.payment.findUnique({ where: { id } });
        if (!payment) {
            throw new NotFoundException('Payment not found');
        }

        return this.prisma.payment.delete({ where: { id } });
    }

    async getStats() {
        const [total, todayPayments, allPayments] = await Promise.all([
            this.prisma.payment.count(),
            this.prisma.payment.findMany({
                where: {
                    paymentDate: {
                        gte: new Date(new Date().setHours(0, 0, 0, 0)),
                        lte: new Date(new Date().setHours(23, 59, 59, 999)),
                    },
                },
            }),
            this.prisma.payment.findMany(),
        ]);

        const totalAmount = allPayments.reduce((sum, p) => sum + p.totalAmount, 0);
        const todayAmount = todayPayments.reduce((sum, p) => sum + p.totalAmount, 0);

        const methodStats = await this.prisma.payment.groupBy({
            by: ['paymentMethod'],
            _sum: { totalAmount: true },
            _count: true,
        });

        const gstStats = await this.prisma.payment.groupBy({
            by: ['gstType'],
            _sum: { totalAmount: true, gstAmount: true },
            _count: true,
        });

        return {
            totalPayments: total,
            totalAmount,
            todayPayments: todayPayments.length,
            todayAmount,
            byMethod: methodStats,
            byGstType: gstStats,
        };
    }
}
