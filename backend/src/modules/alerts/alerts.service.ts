import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateAlertPreferencesDto } from './dto/alert-preferences.dto';

@Injectable()
export class AlertsService {
    constructor(private readonly prisma: PrismaService) {}

    async getAlertPreferences(customerId: string) {
        const customer = await this.prisma.customer.findUnique({
            where: { id: customerId },
            select: {
                statePreferences: true,
                categoryPreferences: true,
                emailRecipients: true,
            },
        });

        return {
            statePreferences: customer?.statePreferences || [],
            categoryPreferences: customer?.categoryPreferences || [],
            emailRecipients: customer?.emailRecipients || [],
        };
    }

    async updateAlertPreferences(customerId: string, dto: UpdateAlertPreferencesDto) {
        const updateData: any = {};

        if (dto.statePreferences !== undefined) {
            updateData.statePreferences = dto.statePreferences;
        }
        if (dto.categoryPreferences !== undefined) {
            updateData.categoryPreferences = dto.categoryPreferences;
        }
        if (dto.emailRecipients !== undefined) {
            updateData.emailRecipients = dto.emailRecipients;
        }

        const customer = await this.prisma.customer.update({
            where: { id: customerId },
            data: updateData,
            select: {
                id: true,
                statePreferences: true,
                categoryPreferences: true,
                emailRecipients: true,
            },
        });

        return customer;
    }

    async getAlertHistory(customerId: string, limit: number = 20, offset: number = 0) {
        const [alerts, total] = await Promise.all([
            this.prisma.tenderAlert.findMany({
                where: { customerId },
                include: {
                    tender: {
                        select: {
                            id: true,
                            title: true,
                            status: true,
                            value: true,
                            closingDate: true,
                            state: true,
                            category: {
                                select: { id: true, name: true },
                            },
                        },
                    },
                },
                orderBy: { sentAt: 'desc' },
                take: limit,
                skip: offset,
            }),
            this.prisma.tenderAlert.count({ where: { customerId } }),
        ]);

        return {
            data: alerts,
            pagination: {
                total,
                limit,
                offset,
                hasMore: offset + limit < total,
            },
        };
    }

    async markAlertAsOpened(customerId: string, alertId: string) {
        const alert = await this.prisma.tenderAlert.update({
            where: { id: alertId },
            data: { openedAt: new Date() },
        });

        return alert;
    }
}
