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
    UseInterceptors,
    UploadedFile,
    UnauthorizedException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { LeadStatus, LeadSource } from '@prisma/client';
import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { AssignLeadDto, UpdateLeadStatusDto } from './dto/assign-lead.dto';
import { BulkAssignLeadsDto, BulkDeleteLeadsDto } from './dto/bulk-operations.dto';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { CurrentUser } from '../../common/decorators';

@ApiTags('Leads')
@Controller('leads')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class LeadsController {
    constructor(private readonly leadsService: LeadsService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new lead' })
    @ApiResponse({ status: 201, description: 'Lead created successfully' })
    create(@Body() createLeadDto: CreateLeadDto, @CurrentUser('id') userId: string) {
        return this.leadsService.create(createLeadDto, userId);
    }

    @Post('bulk-import')
    @ApiOperation({ summary: 'Bulk import leads via CSV/XLSX upload' })
    @ApiResponse({ status: 200, description: 'Leads imported successfully' })
    @UseInterceptors(FileInterceptor('file'))
    bulkImport(
        @UploadedFile() file: Express.Multer.File,
        @CurrentUser() user: any,
    ) {
        if (user?.role === 'EMPLOYEE') {
            throw new UnauthorizedException('Employees cannot bulk import leads');
        }
        return this.leadsService.bulkImportFromFile(file, user);
    }

    @Get()
    @ApiOperation({ summary: 'Get all leads (role-based)' })
    @ApiQuery({ name: 'status', required: false, enum: LeadStatus })
    @ApiQuery({ name: 'source', required: false, enum: LeadSource })
    @ApiQuery({ name: 'assigneeId', required: false })
    @ApiQuery({ name: 'search', required: false })
    @ApiQuery({ name: 'excludeAssigneeId', required: false })
    @ApiQuery({ name: 'page', required: false, type: Number, description: '1-based page number (default: 1). Prefer cursor for large datasets.' })
    @ApiQuery({ name: 'pageSize', required: false, type: Number, description: 'Page size (default: 25, max: 100)' })
    @ApiQuery({ name: 'cursor', required: false, type: String, description: 'Cursor lead id for keyset pagination' })
    @ApiQuery({ name: 'sortBy', required: false, type: String, description: 'Field to sort by (default: createdAt)' })
    @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'], description: 'Sort order (default: desc)' })
    findAll(
        @CurrentUser() user: any,
        @Query('status') status?: LeadStatus,
        @Query('source') source?: LeadSource,
        @Query('assigneeId') assigneeId?: string,
        @Query('search') search?: string,
        @Query('excludeAssigneeId') excludeAssigneeId?: string,
        @Query('page') page?: string,
        @Query('pageSize') pageSize?: string,
        @Query('cursor') cursor?: string,
        @Query('sortBy') sortBy?: string,
        @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    ) {
        return this.leadsService.findAll(user, {
            status,
            source,
            assigneeId,
            search,
            excludeAssigneeId,
            page: page ? Number(page) : undefined,
            pageSize: pageSize ? Number(pageSize) : undefined,
            cursor,
            sortBy,
            sortOrder,
        });
    }

    @Get('stats')
    @ApiOperation({ summary: 'Get lead statistics' })
    getStats(@CurrentUser() user: any) {
        return this.leadsService.getLeadStats(user);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get lead by ID' })
    findOne(@Param('id') id: string, @CurrentUser() user: any) {
        return this.leadsService.findOne(id, user);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update lead' })
    update(
        @Param('id') id: string,
        @Body() updateLeadDto: UpdateLeadDto,
        @CurrentUser() user: any,
    ) {
        return this.leadsService.update(id, updateLeadDto, user);
    }

    @Patch(':id/assign')
    @ApiOperation({ summary: 'Assign lead to user' })
    assignLead(
        @Param('id') id: string,
        @Body() assignLeadDto: AssignLeadDto,
        @CurrentUser() user: any,
    ) {
        return this.leadsService.assignLead(id, assignLeadDto.assigneeId, user);
    }

    @Patch(':id/status')
    @ApiOperation({ summary: 'Update lead status' })
    updateStatus(
        @Param('id') id: string,
        @Body() dto: UpdateLeadStatusDto,
        @CurrentUser() user: any,
    ) {
        return this.leadsService.updateStatus(id, dto.status, user);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete lead' })
    delete(@Param('id') id: string, @CurrentUser() user: any) {
        return this.leadsService.delete(id, user);
    }

    @Post('bulk-assign')
    @ApiOperation({ summary: 'Bulk assign leads to a user' })
    @ApiResponse({ status: 200, description: 'Leads assigned successfully' })
    bulkAssign(@Body() dto: BulkAssignLeadsDto, @CurrentUser() user: any) {
        return this.leadsService.bulkAssignLeads(dto.leadIds, dto.assigneeId, user);
    }

    @Post('bulk-delete')
    @ApiOperation({ summary: 'Bulk delete leads' })
    @ApiResponse({ status: 200, description: 'Leads deleted successfully' })
    bulkDelete(@Body() dto: BulkDeleteLeadsDto, @CurrentUser() user: any) {
        return this.leadsService.bulkDeleteLeads(dto.leadIds, user);
    }
}
