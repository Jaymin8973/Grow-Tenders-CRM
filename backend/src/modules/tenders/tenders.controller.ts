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
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Role, TenderStatus } from '@prisma/client';
import { TendersService } from './tenders.service';
import { CreateTenderDto } from './dto/create-tender.dto';
import { UpdateTenderDto } from './dto/update-tender.dto';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { Roles, CurrentUser } from '../../common/decorators';

@ApiTags('Tenders')
@Controller('tenders')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class TendersController {
    constructor(private readonly tendersService: TendersService) { }

    @Post()
    @Roles(Role.SUPER_ADMIN, Role.MANAGER)
    @ApiOperation({ summary: 'Create a new tender' })
    create(@Body() createTenderDto: CreateTenderDto, @CurrentUser('id') userId: string) {
        return this.tendersService.createTender(createTenderDto, userId);
    }

    @Get()
    @ApiOperation({ summary: 'Get all tenders' })
    @ApiQuery({ name: 'status', required: false, enum: TenderStatus })
    @ApiQuery({ name: 'categoryId', required: false })
    @ApiQuery({ name: 'search', required: false })
    findAll(
        @Query('status') status?: TenderStatus,
        @Query('categoryId') categoryId?: string,
        @Query('search') search?: string,
    ) {
        return this.tendersService.findAllTenders({ status, categoryId, search });
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get tender by ID' })
    findOne(@Param('id') id: string) {
        return this.tendersService.findOneTender(id);
    }

    @Patch(':id')
    @Roles(Role.SUPER_ADMIN, Role.MANAGER)
    @ApiOperation({ summary: 'Update tender' })
    update(@Param('id') id: string, @Body() updateTenderDto: UpdateTenderDto) {
        return this.tendersService.updateTender(id, updateTenderDto);
    }

    @Patch(':id/status')
    @Roles(Role.SUPER_ADMIN)
    @ApiOperation({ summary: 'Update tender status' })
    updateStatus(@Param('id') id: string, @Body('status') status: TenderStatus) {
        return this.tendersService.updateTenderStatus(id, status);
    }

    @Delete(':id')
    @Roles(Role.SUPER_ADMIN)
    @ApiOperation({ summary: 'Delete tender' })
    delete(@Param('id') id: string) {
        return this.tendersService.deleteTender(id);
    }
}
