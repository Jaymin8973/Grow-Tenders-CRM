import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from '@prisma/client';

export type ScreenKey =
    | 'today'
    | 'dashboard'
    | 'leads'
    | 'customers'
    | 'teams'
    | 'dailyReports'
    | 'scrapedTenders'
    | 'leaderboard'
    | 'payments'
    | 'invoices'
    | 'transferRequests'
    | 'users'
    | 'targets'
    | 'scraperLogs'
    | 'activities'
    | 'settings';

export type ScreenAccessMap = Record<ScreenKey, boolean>;

function buildDefaultManagerScreens(): ScreenAccessMap {
    return {
        today: true,
        dashboard: true,
        leads: true,
        customers: true,
        teams: true,
        dailyReports: true,
        scrapedTenders: true,
        leaderboard: true,
        payments: true,
        invoices: true,
        transferRequests: true,
        users: true,
        targets: true,
        scraperLogs: true,
        activities: true,
        settings: true,
    };
}

function buildDefaultEmployeeScreens(): ScreenAccessMap {
    return {
        today: true,
        dashboard: true,
        leads: true,
        customers: true,
        teams: false,
        dailyReports: true,
        scrapedTenders: true,
        leaderboard: true,
        payments: false,
        invoices: false,
        transferRequests: false,
        users: false,
        targets: false,
        scraperLogs: false,
        activities: false,
        settings: true,
    };
}

@Injectable()
export class PermissionsService {
    constructor(private prisma: PrismaService) {}

    private getDefaultsForRole(role: Role): ScreenAccessMap {
        if (role === Role.MANAGER) return buildDefaultManagerScreens();
        return buildDefaultEmployeeScreens();
    }

    async getRoleScreenAccess(role: Role) {
        if (role === Role.SUPER_ADMIN) {
            return {
                role,
                screens: buildDefaultManagerScreens(),
            };
        }

        const existing = await this.prisma.roleScreenAccess.findUnique({
            where: { role },
        });

        if (existing) {
            return existing;
        }

        const created = await this.prisma.roleScreenAccess.create({
            data: {
                role,
                screens: this.getDefaultsForRole(role),
            },
        });

        return created;
    }

    async getAllRoleScreenAccess() {
        const [manager, employee] = await Promise.all([
            this.getRoleScreenAccess(Role.MANAGER),
            this.getRoleScreenAccess(Role.EMPLOYEE),
        ]);

        return {
            manager,
            employee,
        };
    }

    async updateRoleScreenAccess(role: Role, screens: ScreenAccessMap) {
        if (role === Role.SUPER_ADMIN) {
            return {
                role,
                screens,
            };
        }

        return this.prisma.roleScreenAccess.upsert({
            where: { role },
            update: { screens },
            create: { role, screens },
        });
    }
}
