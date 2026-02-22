import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, UnauthorizedException } from '@nestjs/common';
import { RawLeadsService } from './raw-leads.service';
import { CreateRawLeadDto } from './dto/create-raw-lead.dto';
import { UpdateRawLeadDto } from './dto/update-raw-lead.dto';
import { BulkUploadRawLeadsDto } from './dto/bulk-upload-raw-leads.dto';
import { AssignRawLeadsDto } from './dto/assign-raw-leads.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User, RawLeadStatus } from '@prisma/client';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Raw Leads (Telecalling)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('raw-leads')
export class RawLeadsController {
    constructor(private readonly rawLeadsService: RawLeadsService) { }

    @Get('stats')
    @ApiOperation({ summary: 'Raw leads stats (date range) for managers/admins' })
    stats(
        @Query('from') from?: string,
        @Query('to') to?: string,
        @CurrentUser() user?: User,
    ) {
        if (user?.role === 'EMPLOYEE') {
            throw new UnauthorizedException('Employees cannot view raw lead stats.');
        }

        const fromDate = from ? new Date(from) : undefined;
        const toDate = to ? new Date(to) : undefined;

        const safeFrom = fromDate && !Number.isNaN(fromDate.getTime()) ? fromDate : undefined;
        const safeTo = toDate && !Number.isNaN(toDate.getTime()) ? toDate : undefined;

        return this.rawLeadsService.getStats({ from: safeFrom, to: safeTo });
    }

    @Post()
    @ApiOperation({ summary: 'Create a single raw lead manually' })
    create(@Body() createRawLeadDto: CreateRawLeadDto) {
        return this.rawLeadsService.create(createRawLeadDto);
    }

    @Post('bulk-upload')
    @ApiOperation({ summary: 'Bulk upload phone numbers via API' })
    bulkUpload(@Body() bulkUploadDto: BulkUploadRawLeadsDto, @CurrentUser() user: User) {
        if (user.role === 'EMPLOYEE') {
            throw new UnauthorizedException('Employees cannot bulk upload raw leads.');
        }
        return this.rawLeadsService.bulkUpload(bulkUploadDto);
    }

    @Patch('assign')
    @ApiOperation({ summary: 'Bulk assign raw leads to an employee' })
    assignBulk(@Body() assignDto: AssignRawLeadsDto, @CurrentUser() user: User) {
        if (user.role === 'EMPLOYEE') {
            throw new UnauthorizedException('Employees cannot assign leads.');
        }
        return this.rawLeadsService.assignBulk(assignDto);
    }

    @Get()
    @ApiOperation({ summary: 'List raw leads (paginated)' })
    findAll(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('assigneeId') assigneeId?: string,
        @Query('status') status?: RawLeadStatus,
        @CurrentUser() user?: User
    ) {
        const pageNumber = page ? parseInt(page, 10) : 1;
        const limitNumber = limit ? parseInt(limit, 10) : 50;
        const skip = (pageNumber - 1) * limitNumber;

        const where: any = {};
        if (status) {
            where.status = status;
        } else {
            where.status = { not: RawLeadStatus.NOT_INTERESTED };
        }

        if (user?.role === 'EMPLOYEE') {
            where.assigneeId = user.id;
        } else if (assigneeId) {
            if (assigneeId === 'unassigned') {
                where.assigneeId = null;
            } else {
                where.assigneeId = assigneeId;
            }
        }

        return this.rawLeadsService.findAll({
            skip,
            take: limitNumber,
            where,
            orderBy: { createdAt: 'desc' }
        });
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a raw lead by ID' })
    findOne(@Param('id') id: string) {
        return this.rawLeadsService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update raw lead status/notes' })
    update(@Param('id') id: string, @Body() updateRawLeadDto: UpdateRawLeadDto, @CurrentUser() user: User) {
        return this.rawLeadsService.update(id, updateRawLeadDto, user);
    }

    @Post(':id/convert')
    @ApiOperation({ summary: 'Mark a raw lead as converted' })
    convertToLead(@Param('id') id: string, @Body() body: { convertedLeadId: string }) {
        return this.rawLeadsService.update(id, {
            status: RawLeadStatus.INTERESTED,
            convertedLeadId: body.convertedLeadId
        } as any);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a raw lead' })
    remove(@Param('id') id: string, @CurrentUser() user: User) {
        if (user.role === 'EMPLOYEE') {
            throw new UnauthorizedException('Employees cannot delete raw leads.');
        }
        return this.rawLeadsService.remove(id);
    }

    @Delete()
    @ApiOperation({ summary: 'Bulk delete raw leads' })
    removeBulk(@Body() body: { ids: string[] }, @CurrentUser() user: User) {
        if (user.role === 'EMPLOYEE') {
            throw new UnauthorizedException('Employees cannot delete raw leads.');
        }
        const ids = body?.ids || [];
        if (!Array.isArray(ids) || ids.length === 0) {
            return { deletedCount: 0 };
        }
        return this.rawLeadsService.removeBulk(ids);
    }
}
