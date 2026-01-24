import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { BranchesService } from './branches.service';
import { CreateBranchDto, UpdateBranchDto } from './dto/branch.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Branches')
@ApiBearerAuth()
@Controller('branches')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BranchesController {
    constructor(private readonly branchesService: BranchesService) { }

    @Post()
    @Roles(Role.SUPER_ADMIN)
    @ApiOperation({ summary: 'Create a new branch (Super Admin only)' })
    create(@Body() dto: CreateBranchDto) {
        return this.branchesService.create(dto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all branches' })
    @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
    findAll(@Query('includeInactive') includeInactive?: string) {
        return this.branchesService.findAll(includeInactive === 'true');
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get branch by ID' })
    findOne(@Param('id') id: string) {
        return this.branchesService.findOne(id);
    }

    @Get(':id/stats')
    @ApiOperation({ summary: 'Get branch statistics' })
    getStats(@Param('id') id: string) {
        return this.branchesService.getBranchStats(id);
    }

    @Put(':id')
    @Roles(Role.SUPER_ADMIN)
    @ApiOperation({ summary: 'Update a branch (Super Admin only)' })
    update(@Param('id') id: string, @Body() dto: UpdateBranchDto) {
        return this.branchesService.update(id, dto);
    }

    @Delete(':id')
    @Roles(Role.SUPER_ADMIN)
    @ApiOperation({ summary: 'Delete a branch (Super Admin only)' })
    remove(@Param('id') id: string) {
        return this.branchesService.remove(id);
    }
}
