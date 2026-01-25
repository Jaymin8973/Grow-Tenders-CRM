import { Controller, Get, Post, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { TransferRequestsService } from './transfer-requests.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role, TransferStatus } from '@prisma/client';

@Controller('lead-transfer-requests')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TransferRequestsController {
    constructor(private readonly transferService: TransferRequestsService) { }

    @Post()
    @Roles(Role.EMPLOYEE, Role.MANAGER, Role.SUPER_ADMIN)
    create(@Request() req: any, @Body() body: { leadId: string; reason?: string; targetUserId?: string }) {
        return this.transferService.createRequest(req.user.id, body.leadId, body.reason, body.targetUserId);
    }

    @Get()
    @Roles(Role.MANAGER, Role.SUPER_ADMIN)
    findAll(@Query('status') status?: TransferStatus) {
        return this.transferService.findAll(status);
    }

    @Post(':id/decision')
    @Roles(Role.MANAGER, Role.SUPER_ADMIN)
    decide(
        @Request() req: any,
        @Param('id') id: string,
        @Body() body: { decision: 'APPROVE' | 'REJECT'; notes?: string }
    ) {
        return this.transferService.handleDecision(id, req.user.id, body.decision, body.notes);
    }
}
