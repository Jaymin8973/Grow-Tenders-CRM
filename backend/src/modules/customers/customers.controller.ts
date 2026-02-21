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
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
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
    @ApiQuery({ name: 'assigneeId', required: false })
    @ApiQuery({ name: 'search', required: false })
    @ApiQuery({ name: 'page', required: false, type: Number, description: '1-based page number (default: 1). Prefer cursor for large datasets.' })
    @ApiQuery({ name: 'pageSize', required: false, type: Number, description: 'Page size (default: 25, max: 100)' })
    @ApiQuery({ name: 'cursor', required: false, type: String, description: 'Cursor customer id for keyset pagination' })
    @ApiQuery({ name: 'sortBy', required: false, type: String, description: 'Field to sort by (default: createdAt)' })
    @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'], description: 'Sort order (default: desc)' })
    findAll(
        @CurrentUser() user: any,
        @Query('assigneeId') assigneeId?: string,
        @Query('search') search?: string,
        @Query('page') page?: string,
        @Query('pageSize') pageSize?: string,
        @Query('cursor') cursor?: string,
        @Query('sortBy') sortBy?: string,
        @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    ) {
        return this.customersService.findAll(user, {
            assigneeId,
            search,
            page: page ? Number(page) : undefined,
            pageSize: pageSize ? Number(pageSize) : undefined,
            cursor,
            sortBy,
            sortOrder,
        });
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

    @Delete(':id')
    @ApiOperation({ summary: 'Delete customer' })
    delete(@Param('id') id: string, @CurrentUser() user: any) {
        return this.customersService.delete(id, user);
    }
}
