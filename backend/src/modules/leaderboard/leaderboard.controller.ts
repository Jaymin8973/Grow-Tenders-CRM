import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { LeaderboardService } from './leaderboard.service';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { Roles, CurrentUser } from '../../common/decorators';

@ApiTags('Leaderboard')
@Controller('leaderboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class LeaderboardController {
    constructor(private readonly leaderboardService: LeaderboardService) { }

    @Get('managers')
    @ApiOperation({ summary: 'Get managers leaderboard' })
    @ApiQuery({ name: 'startDate', required: false })
    @ApiQuery({ name: 'endDate', required: false })
    getManagersLeaderboard(
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        const period = startDate && endDate
            ? { startDate: new Date(startDate), endDate: new Date(endDate) }
            : undefined;
        return this.leaderboardService.getManagersLeaderboard(period);
    }

    @Get('global')
    @Roles(Role.SUPER_ADMIN, Role.MANAGER)
    @ApiOperation({ summary: 'Get global leaderboard' })
    @ApiQuery({ name: 'startDate', required: false })
    @ApiQuery({ name: 'endDate', required: false })
    getGlobalLeaderboard(
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        const period = startDate && endDate
            ? { startDate: new Date(startDate), endDate: new Date(endDate) }
            : undefined;
        return this.leaderboardService.getGlobalLeaderboard(period);
    }

    @Get('team')
    @Roles(Role.MANAGER)
    @ApiOperation({ summary: 'Get team leaderboard (Manager only)' })
    @ApiQuery({ name: 'startDate', required: false })
    @ApiQuery({ name: 'endDate', required: false })
    getTeamLeaderboard(
        @CurrentUser('id') managerId: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        const period = startDate && endDate
            ? { startDate: new Date(startDate), endDate: new Date(endDate) }
            : undefined;
        return this.leaderboardService.getTeamLeaderboard(managerId, period);
    }

    @Get('self')
    @ApiOperation({ summary: 'Get self stats' })
    @ApiQuery({ name: 'startDate', required: false })
    @ApiQuery({ name: 'endDate', required: false })
    getSelfStats(
        @CurrentUser('id') userId: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        const period = startDate && endDate
            ? { startDate: new Date(startDate), endDate: new Date(endDate) }
            : undefined;
        return this.leaderboardService.getSelfStats(userId, period);
    }

    @Get('monthly')
    @ApiOperation({ summary: 'Get current month stats' })
    getMonthlyStats(@CurrentUser('id') userId: string) {
        return this.leaderboardService.getMonthlyStats(userId);
    }
}
