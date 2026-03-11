import { Controller, Get, Post, Put, Delete, Body, UseGuards, Request, Query, Param, ForbiddenException } from '@nestjs/common';
import { DailyReportsService } from './daily-reports.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CreateDailyReportDto } from './dto/create-daily-report.dto';

@ApiTags('Daily Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('daily-reports')
export class DailyReportsController {
    constructor(private readonly dailyReportsService: DailyReportsService) { }

    @Post()
    @ApiOperation({ summary: 'Create a daily report (Employee only)' })
    async create(@Request() req: any, @Body() createDailyReportDto: CreateDailyReportDto) {
        if (req.user.role !== 'EMPLOYEE') {
            throw new ForbiddenException('Only employees can create daily reports');
        }
        return this.dailyReportsService.create(req.user.id, createDailyReportDto);
    }

    @Get('metrics/today')
    @ApiOperation({ summary: 'Get auto-calculated metrics for today' })
    getTodayMetrics(@Request() req: any) {
        return this.dailyReportsService.getTodayMetrics(req.user.id);
    }

    @Get()
    @ApiOperation({ summary: 'Get daily reports' })
    findAll(@Request() req: any, @Query() query: any) {
        return this.dailyReportsService.findAll(req.user.id, req.user.role, query);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a daily report by id' })
    findOne(@Request() req: any, @Param('id') id: string) {
        return this.dailyReportsService.findOne(id, req.user.id, req.user.role);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Update a daily report (Employee only, own reports)' })
    async update(@Request() req: any, @Param('id') id: string, @Body() updateDto: CreateDailyReportDto) {
        if (req.user.role !== 'EMPLOYEE') {
            throw new ForbiddenException('Only employees can edit daily reports');
        }
        return this.dailyReportsService.update(id, req.user.id, req.user.role, updateDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a daily report (Employee only, own reports)' })
    async remove(@Request() req: any, @Param('id') id: string) {
        if (req.user.role !== 'EMPLOYEE') {
            throw new ForbiddenException('Only employees can delete daily reports');
        }
        return this.dailyReportsService.remove(id, req.user.id, req.user.role);
    }
}
