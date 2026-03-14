import {
    Controller,
    Get,
    Post,
    Patch,
    Param,
    Query,
    UseGuards,
    Body,
    NotFoundException,
    Delete,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { CurrentUser, Roles } from '../../common/decorators';
import { InquiriesService } from './inquiries.service';
import { AssignInquiryDto } from './dto/assign-inquiry.dto';
import { BulkAssignInquiriesDto } from './dto/bulk-assign-inquiries.dto';

@ApiTags('Inquiries')
@Controller('inquiries')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class InquiriesController {
    constructor(private readonly inquiriesService: InquiriesService) {}

    @Get()
    @Roles(Role.SUPER_ADMIN, Role.EMPLOYEE)
    @ApiOperation({ summary: 'List website inquiries (Super Admin: all, Employee: assigned only)' })
    @ApiQuery({ name: 'page', required: false, type: Number, description: '1-based page number (default: 1)' })
    @ApiQuery({ name: 'pageSize', required: false, type: Number, description: 'Page size (default: 25, max: 100)' })
    @ApiQuery({ name: 'search', required: false })
    findAll(
        @CurrentUser() user: any,
        @Query('page') page?: string,
        @Query('pageSize') pageSize?: string,
        @Query('search') search?: string,
    ) {
        return this.inquiriesService.findAll({
            page: page ? Number(page) : undefined,
            pageSize: pageSize ? Number(pageSize) : undefined,
            search,
            assigneeId: user?.role === Role.EMPLOYEE ? user?.id : undefined,
        });
    }

    @Post('bulk-assign')
    @Roles(Role.SUPER_ADMIN)
    @ApiOperation({ summary: 'Super Admin: Bulk assign inquiries to employee' })
    async bulkAssign(@Body() dto: BulkAssignInquiriesDto) {
        return this.inquiriesService.bulkAssignInquiries(dto.inquiryIds, dto.assigneeId);
    }

    @Post(':id/convert-to-lead')
    @Roles(Role.SUPER_ADMIN)
    @ApiOperation({ summary: 'Super Admin: Convert inquiry to lead (deletes inquiry after conversion)' })
    async convertToLead(
        @Param('id') id: string,
        @Body() body: { assigneeId?: string },
    ) {
        const lead = await this.inquiriesService.convertToLead(id, body.assigneeId);
        if (!lead) {
            throw new NotFoundException('Inquiry not found');
        }
        return lead;
    }

    @Delete(':id')
    @Roles(Role.SUPER_ADMIN, Role.EMPLOYEE)
    @ApiOperation({ summary: 'Delete inquiry (Employee can only delete assigned to them)' })
    async delete(
        @Param('id') id: string,
        @CurrentUser() user: any,
    ) {
        const deleted = await this.inquiriesService.deleteInquiry(id, user);
        if (!deleted) {
            throw new NotFoundException('Inquiry not found or not authorized');
        }
        return { message: 'Inquiry deleted successfully' };
    }

    @Patch(':id/assign')
    @Roles(Role.SUPER_ADMIN)
    @ApiOperation({ summary: 'Super Admin: Assign inquiry to user' })
    async assign(
        @Param('id') id: string,
        @Body() dto: AssignInquiryDto,
    ) {
        const updated = await this.inquiriesService.assignInquiry(id, dto.assigneeId);
        if (!updated) {
            throw new NotFoundException('Inquiry or assignee not found');
        }
        return updated;
    }
}
