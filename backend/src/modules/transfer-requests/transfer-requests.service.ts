import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TransferStatus } from '@prisma/client';

@Injectable()
export class TransferRequestsService {
  constructor(private readonly prisma: PrismaService) { }

  async create(userId: string, data: { leadId: string; reason: string; targetUserId?: string }) {
    // Check if lead exists
    const lead = await this.prisma.lead.findUnique({ where: { id: data.leadId } });
    if (!lead) throw new NotFoundException('Lead not found');

    // Check if there's already a pending request for this lead
    const existing = await this.prisma.leadTransferRequest.findFirst({
      where: { leadId: data.leadId, status: TransferStatus.PENDING },
    });

    if (existing) {
      throw new BadRequestException('A pending transfer request already exists for this lead');
    }

    return this.prisma.leadTransferRequest.create({
      data: {
        leadId: data.leadId,
        requesterId: userId,
        targetUserId: data.targetUserId,
        reason: data.reason,
        status: TransferStatus.PENDING,
      },
    });
  }

  async findAll(userId: string, role: string) {
    if (role === 'SUPER_ADMIN' || role === 'MANAGER') {
      return this.prisma.leadTransferRequest.findMany({
        include: {
          lead: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              company: true,
              assignee: { select: { id: true, firstName: true, lastName: true, email: true } },
            },
          },
          requester: { select: { id: true, firstName: true, lastName: true, email: true } },
          targetUser: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    return this.prisma.leadTransferRequest.findMany({
      where: { requesterId: userId },
      include: {
        lead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            company: true,
            assignee: { select: { id: true, firstName: true, lastName: true, email: true } },
          },
        },
        targetUser: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getStats() {
    const total = await this.prisma.leadTransferRequest.count();
    const pending = await this.prisma.leadTransferRequest.count({ where: { status: TransferStatus.PENDING } });
    const approved = await this.prisma.leadTransferRequest.count({ where: { status: TransferStatus.APPROVED } });
    const rejected = await this.prisma.leadTransferRequest.count({ where: { status: TransferStatus.REJECTED } });

    return { total, pending, approved, rejected };
  }

  async updateStatus(id: string, status: TransferStatus, adminId: string, adminNotes?: string) {
    const request = await this.prisma.leadTransferRequest.findUnique({
      where: { id },
      include: { lead: true }
    });

    if (!request) {
      throw new NotFoundException('Transfer request not found');
    }

    if (request.status !== TransferStatus.PENDING) {
      throw new BadRequestException('This request has already been processed');
    }

    return this.prisma.$transaction(async (prisma) => {
      // Update the request
      const updatedRequest = await prisma.leadTransferRequest.update({
        where: { id },
        data: {
          status,
          adminNotes,
        },
      });

      // If approved, update the lead's assignee
      if (status === TransferStatus.APPROVED) {
        // If targetUserId is provided, assign to them. Otherwise, unassign (pool) or keep it if we had complex pool logic.
        // Assuming targetUserId wants to claim it, or requester is releasing it.
        // Let's set assigneeId to targetUserId (which might be null, making it unassigned)

        await prisma.lead.update({
          where: { id: request.leadId },
          data: { assigneeId: request.targetUserId },
        });

        // Create a notification for the requester
        await prisma.notification.create({
          data: {
            userId: request.requesterId,
            title: 'Transfer Request Approved',
            message: `Your transfer request for ${request.lead.firstName} ${request.lead.lastName} has been approved.`,
            type: 'LEAD_TRANSFER_APPROVED',
            link: `/leads/${request.leadId}`,
          }
        });

        // Notifying the target user if they exist
        if (request.targetUserId) {
          await prisma.notification.create({
            data: {
              userId: request.targetUserId,
              title: 'New Lead Assigned',
              message: `You have been assigned the lead ${request.lead.firstName} ${request.lead.lastName} via transfer.`,
              type: 'LEAD_ASSIGNED',
              link: `/leads/${request.leadId}`,
            }
          });
        }
      } else if (status === TransferStatus.REJECTED) {
        // Create a notification for the requester
        await prisma.notification.create({
          data: {
            userId: request.requesterId,
            title: 'Transfer Request Rejected',
            message: `Your transfer request for ${request.lead.firstName} ${request.lead.lastName} was rejected. Reason: ${adminNotes || 'No reason provided.'}`,
            type: 'LEAD_TRANSFER_REJECTED',
            link: `/leads/${request.leadId}`,
          }
        });
      }

      return updatedRequest;
    });
  }
}
