import { Controller, Get, Post, Body, Patch, Param, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { TransferRequestsService } from './transfer-requests.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role, TransferStatus } from '@prisma/client';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

function parseTransferStatus(input: unknown): TransferStatus {
  if (typeof input !== 'string') {
    throw new BadRequestException('Invalid status');
  }

  const normalized = input.trim().toUpperCase();
  if (normalized === 'APPROVE') return TransferStatus.APPROVED;
  if (normalized === 'REJECT') return TransferStatus.REJECTED;

  if (normalized in TransferStatus) {
    return TransferStatus[normalized as keyof typeof TransferStatus];
  }

  throw new BadRequestException(`Invalid status. Expected one of: ${Object.values(TransferStatus).join(', ')}`);
}

@ApiTags('Transfer Requests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('transfer-requests')
export class TransferRequestsController {
  constructor(private readonly transferRequestsService: TransferRequestsService) { }

  @Post()
  @ApiOperation({ summary: 'Create a lead transfer request' })
  create(@Request() req: any, @Body() data: { leadId: string; reason: string; targetUserId?: string }) {
    return this.transferRequestsService.create(req.user.id, data);
  }

  @Get()
  @ApiOperation({ summary: 'Get transfer requests' })
  findAll(@Request() req: any) {
    return this.transferRequestsService.findAll(req.user.id, req.user.role);
  }

  @Get('stats')
  @Roles(Role.SUPER_ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Get transfer requests stats' })
  getStats() {
    return this.transferRequestsService.getStats();
  }

  @Patch(':id/status')
  @Roles(Role.SUPER_ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Approve or reject a transfer request' })
  updateStatus(
    @Param('id') id: string,
    @Body() data: { status: TransferStatus | string; adminNotes?: string },
    @Request() req: any
  ) {
    const status = parseTransferStatus(data.status);
    return this.transferRequestsService.updateStatus(id, status, req.user.id, data.adminNotes);
  }
}
