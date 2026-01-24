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
import { DealStage } from '@prisma/client';
import { DealsService } from './deals.service';
import { CreateDealDto } from './dto/create-deal.dto';
import { UpdateDealDto } from './dto/update-deal.dto';
import { UpdateDealStageDto } from './dto/update-stage.dto';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { CurrentUser } from '../../common/decorators';

@ApiTags('Deals')
@Controller('deals')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class DealsController {
    constructor(private readonly dealsService: DealsService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new deal' })
    @ApiResponse({ status: 201, description: 'Deal created successfully' })
    create(@Body() createDealDto: CreateDealDto, @CurrentUser('id') userId: string) {
        return this.dealsService.create(createDealDto, userId);
    }

    @Post('from-lead/:leadId')
    @ApiOperation({ summary: 'Create deal from lead' })
    createFromLead(
        @Param('leadId') leadId: string,
        @Body() createDealDto: CreateDealDto,
        @CurrentUser('id') userId: string,
    ) {
        return this.dealsService.createFromLead(leadId, createDealDto, userId);
    }

    @Get()
    @ApiOperation({ summary: 'Get all deals (role-based)' })
    @ApiQuery({ name: 'stage', required: false, enum: DealStage })
    @ApiQuery({ name: 'ownerId', required: false })
    @ApiQuery({ name: 'customerId', required: false })
    @ApiQuery({ name: 'search', required: false })
    findAll(
        @CurrentUser() user: any,
        @Query('stage') stage?: DealStage,
        @Query('ownerId') ownerId?: string,
        @Query('customerId') customerId?: string,
        @Query('search') search?: string,
    ) {
        return this.dealsService.findAll(user, { stage, ownerId, customerId, search });
    }

    @Get('stats')
    @ApiOperation({ summary: 'Get deal statistics' })
    getStats(@CurrentUser() user: any) {
        return this.dealsService.getDealStats(user);
    }

    @Get('pipeline')
    @ApiOperation({ summary: 'Get pipeline view (deals grouped by stage)' })
    getPipeline(@CurrentUser() user: any) {
        return this.dealsService.getPipelineView(user);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get deal by ID' })
    findOne(@Param('id') id: string, @CurrentUser() user: any) {
        return this.dealsService.findOne(id, user);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update deal' })
    update(
        @Param('id') id: string,
        @Body() updateDealDto: UpdateDealDto,
        @CurrentUser() user: any,
    ) {
        return this.dealsService.update(id, updateDealDto, user);
    }

    @Patch(':id/stage')
    @ApiOperation({ summary: 'Update deal stage' })
    updateStage(
        @Param('id') id: string,
        @Body() dto: UpdateDealStageDto,
        @CurrentUser() user: any,
    ) {
        return this.dealsService.updateStage(id, dto.stage, user);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete deal' })
    delete(@Param('id') id: string, @CurrentUser() user: any) {
        return this.dealsService.delete(id, user);
    }
}
