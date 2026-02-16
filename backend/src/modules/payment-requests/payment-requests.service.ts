
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

            if (status === PaymentRequestStatus.APPROVED) {
                // Create actual Payment record
                const payment = await prisma.payment.create({
                    data: {
                        paymentNumber: `PAY-${Date.now()}`, // Simple generation
                        amount: request.amount,
                        totalAmount: request.amount, // Assuming no GST logic for requests yet
                        paymentDate: new Date(),
                        paymentMethod: PaymentMethod.OTHER, // Or ask in request
                        referenceType: ReferenceType.INTERNAL,
                        customerId: request.customerId,
                        notes: `Approved from Request #${id}. Notes: ${request.notes}`,
                        createdById: request.requesterId, // Attribute to the requester!
                    },
                });
                paymentId = payment.id;
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
