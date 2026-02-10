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
import { LeadStatus, LeadSource } from '@prisma/client';
import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { AssignLeadDto, UpdateLeadStatusDto } from './dto/assign-lead.dto';
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

    @Get()
    @ApiOperation({ summary: 'Get all leads (role-based)' })
    @ApiQuery({ name: 'status', required: false, enum: LeadStatus })
    @ApiQuery({ name: 'source', required: false, enum: LeadSource })
    @ApiQuery({ name: 'assigneeId', required: false })
    @ApiQuery({ name: 'search', required: false })
    @ApiQuery({ name: 'excludeAssigneeId', required: false })
    findAll(
        @CurrentUser() user: any,
        @Query('status') status?: LeadStatus,
        @Query('source') source?: LeadSource,
        @Query('assigneeId') assigneeId?: string,
        @Query('search') search?: string,
        @Query('excludeAssigneeId') excludeAssigneeId?: string,
    ) {
        return this.leadsService.findAll(user, { status, source, assigneeId, search, excludeAssigneeId });
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
}
