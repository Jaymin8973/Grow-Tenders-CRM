import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { TendersService } from './tenders.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { Roles } from '../../common/decorators';

@ApiTags('Tender Categories')
@Controller('tenders/categories')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class CategoriesController {
    constructor(private readonly tendersService: TendersService) { }

    @Post()
    @Roles(Role.SUPER_ADMIN)
    @ApiOperation({ summary: 'Create tender category (Admin only)' })
    create(@Body() createCategoryDto: CreateCategoryDto) {
        return this.tendersService.createCategory(createCategoryDto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all tender categories' })
    findAll() {
        return this.tendersService.findAllCategories();
    }

    @Patch(':id')
    @Roles(Role.SUPER_ADMIN)
    @ApiOperation({ summary: 'Update tender category (Admin only)' })
    update(@Param('id') id: string, @Body() data: { name?: string; description?: string }) {
        return this.tendersService.updateCategory(id, data);
    }

    @Delete(':id')
    @Roles(Role.SUPER_ADMIN)
    @ApiOperation({ summary: 'Delete tender category (Admin only)' })
    delete(@Param('id') id: string) {
        return this.tendersService.deleteCategory(id);
    }
}
