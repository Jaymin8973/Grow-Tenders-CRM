
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentRequestStatus, ReferenceType, PaymentMethod } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

// Helper to generate unique filename
const generateFilename = (originalname: string) => {
    const ext = path.extname(originalname);
    const name = path.basename(originalname, ext);
    return `${name}-${Date.now()}${ext}`;
};

@Injectable()
export class PaymentRequestsService {
    constructor(private prisma: PrismaService) { }

    async create(userId: string, data: any, file?: Express.Multer.File) {
        let screenshotUrl = null;

        if (file) {
            // Ensure upload directory exists
            const uploadDir = path.join(process.cwd(), 'uploads/payment_requests');
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            const filename = generateFilename(file.originalname);
            const filePath = path.join(uploadDir, filename);

            fs.writeFileSync(filePath, file.buffer);
            // Construct URL (assuming static serve setup or similar)
            screenshotUrl = `/uploads/payment_requests/${filename}`;
        }

        return this.prisma.paymentRequest.create({
            data: {
                amount: parseFloat(data.amount),
                notes: data.notes,
                leadId: data.leadId,
                customerId: data.customerId,
                screenshotUrl,
                requesterId: userId,
                status: PaymentRequestStatus.PENDING,
            },
        });
    }

    async findAll() {
        return this.prisma.paymentRequest.findMany({
            include: {
                requester: {
                    select: { id: true, firstName: true, lastName: true, email: true },
                },
                lead: {
                    select: { id: true, title: true, firstName: true, lastName: true },
                },
                customer: {
                    select: { id: true, firstName: true, lastName: true, company: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findMyRequests(userId: string) {
        return this.prisma.paymentRequest.findMany({
            where: { requesterId: userId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async updateStatus(id: string, status: PaymentRequestStatus, adminId: string, rejectionReason?: string) {
        const request = await this.prisma.paymentRequest.findUnique({
            where: { id },
        });

        if (!request) throw new NotFoundException('Payment request not found');
        if (request.status !== PaymentRequestStatus.PENDING) {
            throw new BadRequestException('Request is already processed');
        }

        // Use transaction to ensure consistency
        return this.prisma.$transaction(async (prisma) => {
            let paymentId = undefined;
            let finalCustomerId = request.customerId;

            if (status === PaymentRequestStatus.APPROVED) {
                // Automate Customer Conversion if it's a lead
                if (request.leadId && !request.customerId) {
                    const lead = await prisma.lead.findUnique({ where: { id: request.leadId } });
                    if (lead && !lead.convertedToCustomerId) {
                        const customer = await prisma.customer.create({
                            data: {
                                firstName: lead.firstName,
                                lastName: lead.lastName,
                                email: lead.email,
                                phone: lead.mobile,
                                company: lead.company,
                                assigneeId: lead.assigneeId || request.requesterId,
                                leadId: lead.id,
                            }
                        });
                        await prisma.lead.update({
                            where: { id: lead.id },
                            data: {
                                convertedToCustomerId: customer.id,
                                status: 'CLOSED_LEAD'
                            }
                        });
                        finalCustomerId = customer.id;
                    } else if (lead && lead.convertedToCustomerId) {
                        finalCustomerId = lead.convertedToCustomerId;
                    }
                }

                // Create actual Payment record
                const payment = await prisma.payment.create({
                    data: {
                        paymentNumber: `PAY-${Date.now()}`, // Simple generation
                        amount: request.amount,
                        totalAmount: request.amount, // Assuming no GST logic for requests yet
                        paymentDate: new Date(),
                        paymentMethod: PaymentMethod.OTHER, // Or ask in request
                        referenceType: ReferenceType.INTERNAL,
                        customerId: finalCustomerId,
                        notes: `Approved from Request #${id}. Notes: ${request.notes}`,
                        createdById: request.requesterId, // Attribute to the requester!
                    },
                });
                paymentId = payment.id;

                if (finalCustomerId) {
                    // Activate subscription
                    await prisma.customer.update({
                        where: { id: finalCustomerId },
                        data: {
                            subscriptionActive: true,
                            subscriptionEndDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)), // 1 year from now
                        }
                    });

                    // Create/Ensure TenderSubscription
                    await prisma.tenderSubscription.upsert({
                        where: { customerId: finalCustomerId },
                        update: {
                            isActive: true,
                            startDate: new Date(),
                            durationMonths: 12,
                            endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
                        },
                        create: {
                            customerId: finalCustomerId,
                            isActive: true,
                            categories: [],
                            states: [],
                            startDate: new Date(),
                            durationMonths: 12,
                            endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
                        }
                    });
                }

                // Automate Invoice Generation (Draft)
                if (finalCustomerId) {
                    const count = await prisma.invoice.count();
                    const year = new Date().getFullYear();
                    const invoiceNumber = `INV-${year}-${String(count + 1).padStart(5, '0')}`;
                    const customer = await prisma.customer.findUnique({ where: { id: finalCustomerId } });

                    await prisma.invoice.create({
                        data: {
                            invoiceNumber,
                            customerId: finalCustomerId,
                            companyName: customer?.company || 'Unknown Company',
                            subtotal: request.amount,
                            taxRate: 0,
                            taxAmount: 0,
                            discount: 0,
                            status: 'DRAFT',
                            total: request.amount,
                            notes: request.notes,
                            createdById: adminId,
                            lineItems: {
                                create: [{
                                    description: 'Payment against Request',
                                    quantity: 1,
                                    unitPrice: request.amount,
                                    total: request.amount
                                }]
                            }
                        }
                    });
                }
            }

            // Update Request
            return prisma.paymentRequest.update({
                where: { id },
                data: {
                    status,
                    approverId: adminId,
                    rejectionReason,
                    paymentId,
                },
            });
        });
    }
}
