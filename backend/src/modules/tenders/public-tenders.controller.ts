import {
    Controller,
    Get,
    Post,
    Delete,
    Param,
    Query,
    UseGuards,
    Request,
    Headers,
    UnauthorizedException,
    Body,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { TendersService } from './tenders.service';
import { CustomerJwtAuthGuard } from '../../common/guards/customer-jwt.guard';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentCustomer } from '../../common/decorators/current-customer.decorator';

@ApiTags('Public Tenders')
@Controller('public/tenders')
export class PublicTendersController {
    constructor(private readonly tendersService: TendersService) { }

    @Get()
    @Public()
    @ApiOperation({ summary: 'Get all published tenders (public endpoint)' })
    @ApiQuery({ name: 'category', required: false })
    @ApiQuery({ name: 'search', required: false })
    @ApiQuery({ name: 'state', required: false })
    @ApiQuery({ name: 'ministry', required: false })
    @ApiQuery({ name: 'status', required: false })
    @ApiQuery({ name: 'limit', required: false })
    @ApiQuery({ name: 'offset', required: false })
    findAll(
        @Query('category') category?: string,
        @Query('search') search?: string,
        @Query('state') state?: string,
        @Query('ministry') ministry?: string,
        @Query('status') status?: string,
        @Query('limit') limit?: string,
        @Query('offset') offset?: string,
    ) {
        return this.tendersService.findPublicTenders({
            category,
            search,
            state,
            ministry,
            status,
            limit: limit ? parseInt(limit) : 20,
            offset: offset ? parseInt(offset) : 0,
        });
    }

    @Get('categories')
    @Public()
    @ApiOperation({ summary: 'Get all tender categories (public endpoint)' })
    @ApiQuery({ name: 'search', required: false })
    @ApiQuery({ name: 'limit', required: false })
    async findAllCategories(
        @Query('search') search?: string,
        @Query('limit') limit?: string,
    ) {
        // Return categories from tender.categoryName (same as CRM dropdown)
        const tenders = await this.tendersService.findDistinctCategories(
            search,
            limit ? parseInt(limit) : 100,
        );
        return tenders.map((name: string, index: number) => ({
            id: `cat-${index}`,
            name,
        }));
    }

    @Get('stats')
    @Public()
    @ApiOperation({ summary: 'Get tender statistics (public endpoint)' })
    getStats() {
        return this.tendersService.getPublicStats();
    }

    @Get('subscription/check')
    @UseGuards(CustomerJwtAuthGuard)
    @ApiBearerAuth('Customer-JWT')
    @ApiOperation({ summary: 'Check customer subscription status' })
    checkSubscription(@Request() req: any) {
        const customer = req.user;
        return {
            hasSubscription: customer?.subscriptionActive || false,
            planType: customer?.planType || null,
            customer: customer ? {
                id: customer.id,
                email: customer.email,
                firstName: customer.firstName,
                lastName: customer.lastName,
            } : null,
        };
    }

    // Saved Tenders Endpoints - MUST be before :id route
    @Get('saved')
    @UseGuards(CustomerJwtAuthGuard)
    @ApiBearerAuth('Customer-JWT')
    @ApiOperation({ summary: 'Get all saved tenders for current customer' })
    @ApiQuery({ name: 'limit', required: false })
    @ApiQuery({ name: 'offset', required: false })
    async getSavedTenders(
        @CurrentCustomer() customer: any,
        @Query('limit') limit?: string,
        @Query('offset') offset?: string,
    ) {
        return this.tendersService.getSavedTenders(
            customer.id,
            limit ? parseInt(limit) : 20,
            offset ? parseInt(offset) : 0,
        );
    }

    @Get('saved/:tenderId/check')
    @UseGuards(CustomerJwtAuthGuard)
    @ApiBearerAuth('Customer-JWT')
    @ApiOperation({ summary: 'Check if a tender is saved by current customer' })
    async checkIfSaved(
        @CurrentCustomer() customer: any,
        @Param('tenderId') tenderId: string,
    ) {
        return this.tendersService.checkIfTenderSaved(customer.id, tenderId);
    }

    @Post('saved/:tenderId')
    @UseGuards(CustomerJwtAuthGuard)
    @ApiBearerAuth('Customer-JWT')
    @ApiOperation({ summary: 'Save a tender to customer\'s saved list' })
    async saveTender(
        @CurrentCustomer() customer: any,
        @Param('tenderId') tenderId: string,
        @Body('notes') notes?: string,
    ) {
        return this.tendersService.saveTender(customer.id, tenderId, notes);
    }

    @Delete('saved/:tenderId')
    @UseGuards(CustomerJwtAuthGuard)
    @ApiBearerAuth('Customer-JWT')
    @ApiOperation({ summary: 'Remove a tender from saved list' })
    async unsaveTender(
        @CurrentCustomer() customer: any,
        @Param('tenderId') tenderId: string,
    ) {
        return this.tendersService.unsaveTender(customer.id, tenderId);
    }

    @Get(':id')
    @Public()
    @ApiOperation({ summary: 'Get tender by ID (limited for non-subscribers, full for subscribers)' })
    @ApiHeader({ name: 'Authorization', required: false, description: 'Bearer token for subscriber access' })
    async findOne(
        @Param('id') id: string,
        @Headers('authorization') authorization?: string,
    ) {
        // Get full tender data
        const tender = await this.tendersService.findOnePublicTender(id);
        
        // Check if user is a subscriber
        let isSubscriber = false;
        
        if (authorization?.startsWith('Bearer ')) {
            // Try to verify customer token
            try {
                const customer = await this.tendersService.verifyCustomerFromToken(authorization.split(' ')[1]);
                isSubscriber = customer?.subscriptionActive || false;
            } catch (e) {
                // Invalid token, treat as non-subscriber
            }
        }

        // If subscriber, return full data
        if (isSubscriber) {
            return {
                ...tender,
                accessLevel: 'full',
            };
        }

        // For non-subscribers, return limited data
        return {
            id: tender.id,
            title: tender.title,
            category: tender.category,
            state: tender.state,
            publishDate: tender.publishDate,
            closingDate: tender.closingDate,
            status: tender.status,
            referenceId: tender.referenceId,
            // Limited description (first 200 chars)
            description: tender.description?.substring(0, 200) + (tender.description?.length > 200 ? '...' : ''),
            // Hide sensitive details
            value: null,
            requirements: null,
            attachments: [], // No attachments for non-subscribers
            tenderUrl: null, // No direct URL for non-subscribers
            accessLevel: 'limited',
            subscriptionRequired: true,
        };
    }

    // Tender History Endpoints
    @Get('history/my')
    @UseGuards(CustomerJwtAuthGuard)
    @ApiBearerAuth('Customer-JWT')
    @ApiOperation({ summary: 'Get current customer tender history' })
    @ApiQuery({ name: 'limit', required: false })
    @ApiQuery({ name: 'offset', required: false })
    async getMyHistory(
        @CurrentCustomer('id') customerId: string,
        @Query('limit') limit?: string,
        @Query('offset') offset?: string,
    ) {
        return this.tendersService.getCustomerTenderHistory(
            customerId,
            limit ? parseInt(limit) : 20,
            offset ? parseInt(offset) : 0,
        );
    }

    @Get(':id/history')
    @UseGuards(CustomerJwtAuthGuard)
    @ApiBearerAuth('Customer-JWT')
    @ApiOperation({ summary: 'Get history for a specific tender' })
    @ApiQuery({ name: 'limit', required: false })
    @ApiQuery({ name: 'offset', required: false })
    async getTenderHistory(
        @CurrentCustomer('id') customerId: string,
        @Param('id') tenderId: string,
        @Query('limit') limit?: string,
        @Query('offset') offset?: string,
    ) {
        // Record view in history
        await this.tendersService.addTenderHistory(tenderId, 'viewed', customerId);
        
        return this.tendersService.getTenderHistory(
            tenderId,
            limit ? parseInt(limit) : 20,
            offset ? parseInt(offset) : 0,
        );
    }
}
