import {
    Controller,
    Get,
    Patch,
    Body,
    UseGuards,
    Query,
    Param,
    Post,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AlertsService } from './alerts.service';
import { CustomerJwtAuthGuard } from '../../common/guards/customer-jwt.guard';
import { CurrentCustomer } from '../../common/decorators/current-customer.decorator';
import { UpdateAlertPreferencesDto } from './dto/alert-preferences.dto';

@ApiTags('Alerts')
@Controller('public/alerts')
export class AlertsController {
    constructor(private readonly alertsService: AlertsService) {}

    @Get('preferences')
    @UseGuards(CustomerJwtAuthGuard)
    @ApiBearerAuth('Customer-JWT')
    @ApiOperation({ summary: 'Get customer alert preferences' })
    async getPreferences(@CurrentCustomer('id') customerId: string) {
        return this.alertsService.getAlertPreferences(customerId);
    }

    @Patch('preferences')
    @UseGuards(CustomerJwtAuthGuard)
    @ApiBearerAuth('Customer-JWT')
    @ApiOperation({ summary: 'Update customer alert preferences' })
    async updatePreferences(
        @CurrentCustomer('id') customerId: string,
        @Body() dto: UpdateAlertPreferencesDto,
    ) {
        return this.alertsService.updateAlertPreferences(customerId, dto);
    }

    @Get('history')
    @UseGuards(CustomerJwtAuthGuard)
    @ApiBearerAuth('Customer-JWT')
    @ApiOperation({ summary: 'Get alert history for customer' })
    @ApiQuery({ name: 'limit', required: false })
    @ApiQuery({ name: 'offset', required: false })
    async getHistory(
        @CurrentCustomer('id') customerId: string,
        @Query('limit') limit?: string,
        @Query('offset') offset?: string,
    ) {
        return this.alertsService.getAlertHistory(
            customerId,
            limit ? parseInt(limit) : 20,
            offset ? parseInt(offset) : 0,
        );
    }

    @Post(':alertId/open')
    @UseGuards(CustomerJwtAuthGuard)
    @ApiBearerAuth('Customer-JWT')
    @ApiOperation({ summary: 'Mark alert as opened' })
    async markAsOpened(
        @CurrentCustomer('id') customerId: string,
        @Param('alertId') alertId: string,
    ) {
        return this.alertsService.markAlertAsOpened(customerId, alertId);
    }
}
