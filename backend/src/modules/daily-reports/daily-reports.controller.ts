import { Controller, Get, Post, Body, UseGuards, Request, Query, Param } from '@nestjs/common';
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
    @ApiOperation({ summary: 'Create a daily report' })
    create(@Request() req: any, @Body() createDailyReportDto: CreateDailyReportDto) {
        return this.dailyReportsService.create(req.user.id, createDailyReportDto);
    }

    @Get()
    @ApiOperation({ summary: 'Get daily reports' })
    findAll(@Request() req: any, @Query() query: any) {
        return this.dailyReportsService.findAll(req.user.id, req.user.role, query);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a daily report by id' })
    findOne(@Param('id') id: string) {
        return this.dailyReportsService.findOne(id);
    }
}
