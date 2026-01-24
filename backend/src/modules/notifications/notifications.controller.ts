import { Controller, Get, Patch, Delete, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../../common/guards';
import { CurrentUser } from '../../common/decorators';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    @Get()
    @ApiOperation({ summary: 'Get all notifications' })
    findAll(@CurrentUser('id') userId: string) {
        return this.notificationsService.findAll(userId);
    }

    @Get('unread')
    @ApiOperation({ summary: 'Get unread notifications' })
    findUnread(@CurrentUser('id') userId: string) {
        return this.notificationsService.findUnread(userId);
    }

    @Get('count')
    @ApiOperation({ summary: 'Get unread count' })
    countUnread(@CurrentUser('id') userId: string) {
        return this.notificationsService.countUnread(userId);
    }

    @Get('unread-count')
    @ApiOperation({ summary: 'Get unread count (alias)' })
    getUnreadCount(@CurrentUser('id') userId: string) {
        return this.notificationsService.countUnread(userId);
    }

    @Patch(':id/read')
    @ApiOperation({ summary: 'Mark notification as read' })
    markAsRead(@Param('id') id: string, @CurrentUser('id') userId: string) {
        return this.notificationsService.markAsRead(id, userId);
    }

    @Patch('read-all')
    @ApiOperation({ summary: 'Mark all notifications as read' })
    markAllAsRead(@CurrentUser('id') userId: string) {
        return this.notificationsService.markAllAsRead(userId);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete notification' })
    delete(@Param('id') id: string, @CurrentUser('id') userId: string) {
        return this.notificationsService.delete(id, userId);
    }
}
