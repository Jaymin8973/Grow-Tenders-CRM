import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { TransferStatus, LeadStatus } from '@prisma/client';

@Injectable()
export class TransferRequestsService {
    constructor(private prisma: PrismaService) { }

    async createRequest(userId: string, leadId: string, reason?: string, targetUserId?: string) {
        const lead = await this.prisma.lead.findUnique({
            where: { id: leadId },
        });

        if (!lead) {
            throw new NotFoundException('Lead not found');
        }

        if (lead.assigneeId !== userId) {
            throw new ForbiddenException('You can only transfer leads assigned to you');
        }

        return this.prisma.leadTransferRequest.create({
            data: {
                leadId,
                requesterId: userId,
                targetUserId,
                reason,
                status: TransferStatus.PENDING,
            },
        });
    }

    async createClaimRequest(requesterId: string, leadId: string, reason?: string) {
        const lead = await this.prisma.lead.findUnique({
            where: { id: leadId },
        });

        if (!lead) {
            throw new NotFoundException('Lead not found');
        }

        // Check if already assigned to requester
        if (lead.assigneeId === requesterId) {
            throw new BadRequestException('Lead is already assigned to you');
        }

        // Check for existing pending request
        const existingRequest = await this.prisma.leadTransferRequest.findFirst({
            where: {
                leadId,
                requesterId,
                status: TransferStatus.PENDING,
            }
        });

        if (existingRequest) {
            throw new BadRequestException('You already have a pending request for this lead');
        }

        return this.prisma.leadTransferRequest.create({
            data: {
                leadId,
                requesterId,
                targetUserId: requesterId, // The requester wants to be the target
                reason,
                status: TransferStatus.PENDING,
            },
        });
    }

    async findAll(status?: TransferStatus) {
        return this.prisma.leadTransferRequest.findMany({
            where: status ? { status } : undefined,
            include: {
                lead: {
                    select: {
                        id: true,
                        title: true,
                        firstName: true,
                        lastName: true,
                        company: true,
                    }
                },
                requester: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    }
                },
                targetUser: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    }
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }

    async handleDecision(requestId: string, adminId: string, decision: 'APPROVE' | 'REJECT', notes?: string) {
        const request = await this.prisma.leadTransferRequest.findUnique({
            where: { id: requestId },
        });

        if (!request) {
            throw new NotFoundException('Transfer request not found');
        }

        if (request.status !== TransferStatus.PENDING) {
            throw new BadRequestException('Request is already processed');
        }

        const newStatus = decision === 'APPROVE' ? TransferStatus.APPROVED : TransferStatus.REJECTED;

        // Transaction to update request and optionally the lead
        return this.prisma.$transaction(async (tx) => {
            const updatedRequest = await tx.leadTransferRequest.update({
                where: { id: requestId },
                data: {
                    status: newStatus,
                    adminNotes: notes,
                },
            });

            if (decision === 'APPROVE') {
                // If there was a specific target user, assign to them.
                // Otherwise, the admin might need to assign manually, but for this basic flow let's assume...
                // Wait, if targetUserId is null, the lead becomes unassigned or Admin assigns it manually later.
                // Let's set assigneeId to targetUserId if present.
                if (request.targetUserId) {
                    await tx.lead.update({
                        where: { id: request.leadId },
                        data: {
                            assigneeId: request.targetUserId,
                        },
                    });
                } else {
                    // If no target user was suggested, maybe unassign it? 
                    // Or keep it assigned until Admin manually reassigns?
                    // Let's decide: If Approved but no target, unassign (return to pool)
                    await tx.lead.update({
                        where: { id: request.leadId },
                        data: {
                            assigneeId: null,
                            status: LeadStatus.COLD_LEAD, // Reset status
                        },
                    });
                }
            }

            return updatedRequest;
        });
    }
}
