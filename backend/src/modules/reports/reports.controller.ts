import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { ReportsService } from './reports.service';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { Roles, CurrentUser } from '../../common/decorators';

@ApiTags('Reports')
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) { }

    @Get('dashboard')
    @ApiOperation({ summary: 'Get dashboard stats' })
    getDashboardStats(@CurrentUser() user: any) {
        return this.reportsService.getDashboardStats(user.id, user.role);
    }

    @Get('sales-performance')
    @ApiOperation({ summary: 'Get sales performance report' })
    @ApiQuery({ name: 'startDate', required: false })
    @ApiQuery({ name: 'endDate', required: false })
    getSalesPerformance(
        @CurrentUser() user: any,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        const dateRange = startDate && endDate
            ? { startDate: new Date(startDate), endDate: new Date(endDate) }
            : undefined;
        return this.reportsService.getSalesPerformance(user.id, user.role, dateRange);
    }

    @Get('pipeline')
    @ApiOperation({ summary: 'Get pipeline breakdown' })
    getPipelineBreakdown(@CurrentUser() user: any) {
        return this.reportsService.getPipelineBreakdown(user.id, user.role);
    }

    @Get('employee-productivity')
    @Roles(Role.SUPER_ADMIN, Role.MANAGER)
    @ApiOperation({ summary: 'Get employee productivity report' })
    @ApiQuery({ name: 'startDate', required: false })
    @ApiQuery({ name: 'endDate', required: false })
    getEmployeeProductivity(
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        const dateRange = startDate && endDate
            ? { startDate: new Date(startDate), endDate: new Date(endDate) }
            : undefined;
        return this.reportsService.getEmployeeProductivity(dateRange);
    }

    @Get('overdue-followups')
    @Roles(Role.SUPER_ADMIN, Role.MANAGER)
    @ApiOperation({ summary: 'Get overdue follow-ups report' })
    getOverdueFollowups() {
        return this.reportsService.getFollowUpOverdueReport();
    }

    @Get('lead-sources')
    @Roles(Role.SUPER_ADMIN, Role.MANAGER)
    @ApiOperation({ summary: 'Get lead source analysis' })
    @ApiQuery({ name: 'startDate', required: false })
    @ApiQuery({ name: 'endDate', required: false })
    getLeadSourceAnalysis(
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        const dateRange = startDate && endDate
            ? { startDate: new Date(startDate), endDate: new Date(endDate) }
            : undefined;
        return this.reportsService.getLeadSourceAnalysis(dateRange);
    }
}
