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
import { Role, ReferenceType, PaymentMethod } from '@prisma/client';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { Roles, CurrentUser } from '../../common/decorators';

@ApiTags('Payments')
@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService) { }

    @Post()
    @Roles(Role.SUPER_ADMIN)
    @ApiOperation({ summary: 'Record a new payment (Super Admin only)' })
    @ApiResponse({ status: 201, description: 'Payment recorded successfully' })
    create(@Body() createPaymentDto: CreatePaymentDto, @CurrentUser('id') userId: string) {
        return this.paymentsService.create(createPaymentDto, userId);
    }

    @Get()
    @Roles(Role.SUPER_ADMIN)
    @ApiOperation({ summary: 'Get all payments (Super Admin only)' })
    @ApiQuery({ name: 'customerId', required: false })
    @ApiQuery({ name: 'referenceType', required: false, enum: ReferenceType })
    @ApiQuery({ name: 'paymentMethod', required: false, enum: PaymentMethod })
    @ApiQuery({ name: 'startDate', required: false })
    @ApiQuery({ name: 'endDate', required: false })
    @ApiQuery({ name: 'search', required: false })
    findAll(
        @Query('customerId') customerId?: string,
        @Query('referenceType') referenceType?: ReferenceType,
        @Query('paymentMethod') paymentMethod?: PaymentMethod,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('search') search?: string,
    ) {
        return this.paymentsService.findAll({
            customerId,
            referenceType,
            paymentMethod,
            startDate,
            endDate,
            search,
        });
    }

    @Get('stats')
    @Roles(Role.SUPER_ADMIN)
    @ApiOperation({ summary: 'Get payment statistics (Super Admin only)' })
    getStats() {
        return this.paymentsService.getStats();
    }

    @Get(':id')
    @Roles(Role.SUPER_ADMIN)
    @ApiOperation({ summary: 'Get payment by ID (Super Admin only)' })
    findOne(@Param('id') id: string) {
        return this.paymentsService.findOne(id);
    }

    @Patch(':id')
    @Roles(Role.SUPER_ADMIN)
    @ApiOperation({ summary: 'Update payment (Super Admin only)' })
    update(@Param('id') id: string, @Body() updatePaymentDto: UpdatePaymentDto) {
        return this.paymentsService.update(id, updatePaymentDto);
    }

    @Delete(':id')
    @Roles(Role.SUPER_ADMIN)
    @ApiOperation({ summary: 'Delete payment (Super Admin only)' })
    delete(@Param('id') id: string) {
        return this.paymentsService.delete(id);
    }
}
