import { Controller, Post, UseGuards } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Scheduler')
@ApiBearerAuth()
@Controller('scheduler')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SchedulerController {
    constructor(private readonly schedulerService: SchedulerService) { }

    @Post('trigger-daily-alerts')
    @Roles(Role.SUPER_ADMIN)
    @ApiOperation({ summary: 'Manually trigger daily tender alerts email (Super Admin only)' })
    async triggerDailyAlerts() {
        await this.schedulerService.handleDailyTenderAlerts();
        return { message: 'Daily tender alerts triggered successfully' };
    }
}
