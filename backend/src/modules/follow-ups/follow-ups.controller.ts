import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    UseGuards,
    Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { FollowUpsService } from './follow-ups.service';
import { CreateFollowUpDto } from './dto/create-follow-up.dto';
import { UpdateFollowUpDto } from './dto/update-follow-up.dto';

@ApiTags('Follow-ups')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('follow-ups')
export class FollowUpsController {
    constructor(private readonly followUpsService: FollowUpsService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new follow-up' })
    create(@Body() dto: CreateFollowUpDto, @Request() req: any) {
        return this.followUpsService.create(dto, req.user.id);
    }

    @Get('lead/:leadId')
    @ApiOperation({ summary: 'Get all follow-ups for a lead' })
    findByLead(@Param('leadId') leadId: string, @Request() req: any) {
        return this.followUpsService.findByLead(leadId, req.user.id, req.user.role);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a follow-up by ID' })
    findOne(@Param('id') id: string) {
        return this.followUpsService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a follow-up' })
    update(
        @Param('id') id: string,
        @Body() dto: UpdateFollowUpDto,
        @Request() req: any,
    ) {
        return this.followUpsService.update(id, dto, req.user.id, req.user.role);
    }

    @Patch(':id/complete')
    @ApiOperation({ summary: 'Mark a follow-up as complete' })
    markComplete(@Param('id') id: string, @Request() req: any) {
        return this.followUpsService.markComplete(id, req.user.id, req.user.role);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a follow-up' })
    delete(@Param('id') id: string, @Request() req: any) {
        return this.followUpsService.delete(id, req.user.id, req.user.role);
    }
}
