import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { TendersService } from './tenders.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { Roles } from '../../common/decorators';

@ApiTags('Tender Subscriptions')
@Controller('tenders/subscriptions')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class SubscriptionsController {
    constructor(private readonly tendersService: TendersService) { }

    @Post()
    @Roles(Role.SUPER_ADMIN, Role.MANAGER)
    @ApiOperation({ summary: 'Create/update subscription' })
    create(@Body() createSubscriptionDto: CreateSubscriptionDto) {
        return this.tendersService.createSubscription(createSubscriptionDto);
    }

    @Get('customer/:customerId')
    @ApiOperation({ summary: 'Get customer subscription' })
    findByCustomer(@Param('customerId') customerId: string) {
        return this.tendersService.findCustomerSubscription(customerId);
    }

    @Get(':customerId')
    @ApiOperation({ summary: 'Get customer subscription (alias)' })
    getSubscription(@Param('customerId') customerId: string) {
        return this.tendersService.findCustomerSubscription(customerId);
    }

    @Get('category/:categoryId/customers')
    @ApiOperation({ summary: 'Get customers subscribed to category' })
    findSubscribedCustomers(@Param('categoryId') categoryId: string) {
        return this.tendersService.findSubscribedCustomers(categoryId);
    }

    @Patch(':customerId')
    @Roles(Role.SUPER_ADMIN, Role.MANAGER)
    @ApiOperation({ summary: 'Update subscription categories' })
    update(
        @Param('customerId') customerId: string,
        @Body('categories') categories: string[],
        @Body('states') states: string[],
        @Body('isActive') isActive?: boolean,
    ) {
        return this.tendersService.updateSubscription(customerId, categories, states || [], isActive);
    }

    @Delete(':customerId')
    @Roles(Role.SUPER_ADMIN)
    @ApiOperation({ summary: 'Deactivate subscription' })
    deactivate(@Param('customerId') customerId: string) {
        return this.tendersService.deactivateSubscription(customerId);
    }
}
