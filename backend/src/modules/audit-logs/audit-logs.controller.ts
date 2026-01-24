import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { AuditLogsService } from './audit-logs.service';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { Roles } from '../../common/decorators';

@ApiTags('Audit Logs')
@Controller('audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
@ApiBearerAuth('JWT-auth')
export class AuditLogsController {
    constructor(private readonly auditLogsService: AuditLogsService) { }

    @Get()
    @ApiOperation({ summary: 'Get audit logs (Admin only)' })
    @ApiQuery({ name: 'userId', required: false })
    @ApiQuery({ name: 'action', required: false })
    @ApiQuery({ name: 'module', required: false })
    @ApiQuery({ name: 'startDate', required: false })
    @ApiQuery({ name: 'endDate', required: false })
    @ApiQuery({ name: 'page', required: false })
    @ApiQuery({ name: 'limit', required: false })
    findAll(
        @Query('userId') userId?: string,
        @Query('action') action?: string,
        @Query('module') module?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.auditLogsService.findAll(
            {
                userId,
                action,
                module,
                startDate: startDate ? new Date(startDate) : undefined,
                endDate: endDate ? new Date(endDate) : undefined,
            },
            page ? parseInt(page) : 1,
            limit ? parseInt(limit) : 50,
        );
    }

    @Get('entity/:module/:entityId')
    @ApiOperation({ summary: 'Get audit logs for specific entity' })
    findByEntity(
        @Query('module') module: string,
        @Query('entityId') entityId: string,
    ) {
        return this.auditLogsService.findByEntity(module, entityId);
    }
}
