import {
    Controller,
    Get,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { JwtAuthGuard, RolesGuard } from '@/common/guards';
import { Roles } from '@/common/decorators';

@ApiTags('Audit Logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('audit')
export class AuditController {
    constructor(private auditService: AuditService) { }

    @Get()
    @Roles('SUPER_ADMIN')
    @ApiOperation({ summary: 'Get audit logs (Super Admin only)' })
    findAll(
        @Query('userId') userId?: string,
        @Query('module') module?: string,
        @Query('action') action?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('limit') limit?: string,
    ) {
        return this.auditService.findAll({
            userId,
            module,
            action,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            limit: limit ? parseInt(limit) : undefined,
        });
    }

    @Get('entity')
    @Roles('SUPER_ADMIN', 'MANAGER')
    @ApiOperation({ summary: 'Get audit logs by entity' })
    findByEntity(
        @Query('module') module: string,
        @Query('entityId') entityId: string,
    ) {
        return this.auditService.findByEntity(module, entityId);
    }
}
