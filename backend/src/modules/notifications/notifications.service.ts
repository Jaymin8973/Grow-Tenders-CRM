import { Injectable } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class NotificationsService {
    constructor(private prisma: PrismaService) { }

    async create(data: {
        userId: string;
        type: NotificationType;
        title: string;
        message: string;
        link?: string;
    }) {
        return this.prisma.notification.create({ data });
    }

    async findAll(userId: string, limit = 20) {
        return this.prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }

    async findUnread(userId: string) {
        return this.prisma.notification.findMany({
            where: { userId, isRead: false },
            orderBy: { createdAt: 'desc' },
        });
    }

    async countUnread(userId: string) {
        return this.prisma.notification.count({
            where: { userId, isRead: false },
        });
    }

    async markAsRead(id: string, userId: string) {
        return this.prisma.notification.updateMany({
            where: { id, userId },
            data: { isRead: true },
        });
    }

    async markAllAsRead(userId: string) {
        return this.prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true },
        });
    }

    async delete(id: string, userId: string) {
        return this.prisma.notification.deleteMany({
            where: { id, userId },
        });
    }

    // Helper methods for creating specific notifications
    async notifyLeadAssigned(userId: string, leadName: string, leadId: string) {
        return this.create({
            userId,
            type: NotificationType.LEAD_ASSIGNED,
            title: 'New Lead Assigned',
            message: `You have been assigned a new lead: ${leadName}`,
            link: `/leads/${leadId}`,
        });
    }

    async notifyDealUpdate(userId: string, dealTitle: string, dealId: string, stage: string) {
        return this.create({
            userId,
            type: NotificationType.DEAL_UPDATE,
            title: 'Deal Status Updated',
            message: `Deal "${dealTitle}" moved to ${stage}`,
            link: `/deals/${dealId}`,
        });
    }

    async notifyActivityReminder(userId: string, activityTitle: string, activityId: string) {
        return this.create({
            userId,
            type: NotificationType.ACTIVITY_REMINDER,
            title: 'Activity Reminder',
            message: `Upcoming activity: ${activityTitle}`,
            link: `/activities/${activityId}`,
        });
    }

    async notifyOverdueFollowUp(userId: string, count: number) {
        return this.create({
            userId,
            type: NotificationType.FOLLOW_UP_OVERDUE,
            title: 'Overdue Follow-ups',
            message: `You have ${count} overdue follow-up(s)`,
            link: '/activities?status=overdue',
        });
    }
}
