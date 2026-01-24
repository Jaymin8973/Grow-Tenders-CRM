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
import { CustomerLifecycle } from '@prisma/client';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { UpdateLifecycleDto } from './dto/update-lifecycle.dto';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { CurrentUser } from '../../common/decorators';

@ApiTags('Customers')
@Controller('customers')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class CustomersController {
    constructor(private readonly customersService: CustomersService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new customer' })
    @ApiResponse({ status: 201, description: 'Customer created successfully' })
    create(@Body() createCustomerDto: CreateCustomerDto, @CurrentUser('id') userId: string) {
        return this.customersService.create(createCustomerDto, userId);
    }

    @Post('from-lead/:leadId')
    @ApiOperation({ summary: 'Convert lead to customer' })
    createFromLead(@Param('leadId') leadId: string, @CurrentUser('id') userId: string) {
        return this.customersService.createFromLead(leadId, userId);
    }

    @Get()
    @ApiOperation({ summary: 'Get all customers (role-based)' })
    @ApiQuery({ name: 'lifecycle', required: false, enum: CustomerLifecycle })
    @ApiQuery({ name: 'assigneeId', required: false })
    @ApiQuery({ name: 'search', required: false })
    findAll(
        @CurrentUser() user: any,
        @Query('lifecycle') lifecycle?: CustomerLifecycle,
        @Query('assigneeId') assigneeId?: string,
        @Query('search') search?: string,
    ) {
        return this.customersService.findAll(user, { lifecycle, assigneeId, search });
    }

    @Get('stats')
    @ApiOperation({ summary: 'Get customer statistics' })
    getStats(@CurrentUser() user: any) {
        return this.customersService.getCustomerStats(user);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get customer by ID' })
    findOne(@Param('id') id: string, @CurrentUser() user: any) {
        return this.customersService.findOne(id, user);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update customer' })
    update(
        @Param('id') id: string,
        @Body() updateCustomerDto: UpdateCustomerDto,
        @CurrentUser() user: any,
    ) {
        return this.customersService.update(id, updateCustomerDto, user);
    }

    @Patch(':id/lifecycle')
    @ApiOperation({ summary: 'Update customer lifecycle' })
    updateLifecycle(
        @Param('id') id: string,
        @Body() dto: UpdateLifecycleDto,
        @CurrentUser() user: any,
    ) {
        return this.customersService.updateLifecycle(id, dto.lifecycle, user);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete customer' })
    delete(@Param('id') id: string, @CurrentUser() user: any) {
        return this.customersService.delete(id, user);
    }
}
