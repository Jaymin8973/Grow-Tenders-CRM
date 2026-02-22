import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ActivityType, ActivityStatus } from '@prisma/client';
import { ActivitiesService } from './activities.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { CompleteActivityDto, RescheduleActivityDto } from './dto/activity-actions.dto';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { CurrentUser } from '../../common/decorators';

@ApiTags('Activities')
@Controller('activities')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class ActivitiesController {
    constructor(private readonly activitiesService: ActivitiesService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new activity' })
    @ApiResponse({ status: 201, description: 'Activity created successfully' })
    create(@Body() createActivityDto: CreateActivityDto, @CurrentUser('id') userId: string) {
        return this.activitiesService.create(createActivityDto, userId);
    }

    @Get()
    @ApiOperation({ summary: 'Get all activities (role-based)' })
    @ApiQuery({ name: 'type', required: false, enum: ActivityType })
    @ApiQuery({ name: 'status', required: false, enum: ActivityStatus })
    @ApiQuery({ name: 'assigneeId', required: false })
    @ApiQuery({ name: 'search', required: false, type: String, description: 'Search in title/description' })
    @ApiQuery({ name: 'startDate', required: false })
    @ApiQuery({ name: 'endDate', required: false })
    @ApiQuery({ name: 'page', required: false, type: Number, description: '1-based page number (default: 1)' })
    @ApiQuery({ name: 'pageSize', required: false, type: Number, description: 'Page size (default: 25, max: 100)' })
    @ApiQuery({ name: 'cursor', required: false, type: String, description: 'Cursor activity id for keyset pagination' })
    @ApiQuery({ name: 'sortBy', required: false, type: String, description: 'Field to sort by (default: scheduledAt)' })
    @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'], description: 'Sort order (default: asc)' })
    findAll(
        @CurrentUser() user: any,
        @Query('type') type?: ActivityType,
        @Query('status') status?: ActivityStatus,
        @Query('assigneeId') assigneeId?: string,
        @Query('search') search?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('page') page?: string,
        @Query('pageSize') pageSize?: string,
        @Query('cursor') cursor?: string,
        @Query('sortBy') sortBy?: string,
        @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    ) {
        return this.activitiesService.findAll(user, {
            type,
            status,
            assigneeId,
            search,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            page: page ? Number(page) : undefined,
            pageSize: pageSize ? Number(pageSize) : undefined,
            cursor,
            sortBy,
            sortOrder,
        });
    }

    @Get('today')
    @ApiOperation({ summary: 'Get today\'s activities' })
    findToday(@CurrentUser() user: any) {
        return this.activitiesService.findToday(user);
    }

    @Get('overdue')
    @ApiOperation({ summary: 'Get overdue activities' })
    findOverdue(@CurrentUser() user: any) {
        return this.activitiesService.findOverdue(user);
    }

    @Get('stats')
    @ApiOperation({ summary: 'Get activity statistics' })
    getStats(@CurrentUser() user: any) {
        return this.activitiesService.getActivityStats(user);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get activity by ID' })
    findOne(@Param('id') id: string, @CurrentUser() user: any) {
        return this.activitiesService.findOne(id, user);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update activity' })
    update(
        @Param('id') id: string,
        @Body() updateActivityDto: UpdateActivityDto,
        @CurrentUser() user: any,
    ) {
        return this.activitiesService.update(id, updateActivityDto, user);
    }

    @Patch(':id/complete')
    @ApiOperation({ summary: 'Mark activity as complete' })
    markComplete(
        @Param('id') id: string,
        @Body() dto: CompleteActivityDto,
        @CurrentUser() user: any,
    ) {
        return this.activitiesService.markComplete(id, dto.outcome || '', user);
    }

    @Patch(':id/reschedule')
    @ApiOperation({ summary: 'Reschedule activity' })
    reschedule(
        @Param('id') id: string,
        @Body() dto: RescheduleActivityDto,
        @CurrentUser() user: any,
    ) {
        return this.activitiesService.reschedule(id, new Date(dto.scheduledAt), user);
    }

    @Patch(':id/cancel')
    @ApiOperation({ summary: 'Cancel activity' })
    cancel(@Param('id') id: string, @CurrentUser() user: any) {
        return this.activitiesService.cancel(id, user);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete activity' })
    delete(@Param('id') id: string, @CurrentUser() user: any) {
        return this.activitiesService.delete(id, user);
    }
}
