import {
    Controller,
    Get,
    Post,
    Delete,
    Param,
    Query,
    Res,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { Role } from '@prisma/client';
import { ScrapedTendersService } from './services/scraped-tenders.service';
import { TenderSchedulerService } from './services/tender-scheduler.service';
import { GeMCategoriesService } from './services/gem-categories.service';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { Roles } from '../../common/decorators';

@ApiTags('Scraped Tenders')
@Controller('scraped-tenders')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class ScrapedTendersController {
    constructor(
        private readonly scrapedTendersService: ScrapedTendersService,
        private readonly schedulerService: TenderSchedulerService,
        private readonly gemCategoriesService: GeMCategoriesService,
    ) { }

    @Get()
    @ApiOperation({ summary: 'Get all scraped tenders with pagination' })
    @ApiQuery({ name: 'status', required: false })
    @ApiQuery({ name: 'state', required: false })
    @ApiQuery({ name: 'city', required: false })
    @ApiQuery({ name: 'search', required: false })
    @ApiQuery({ name: 'category', required: false })
    @ApiQuery({ name: 'startDateFrom', required: false })
    @ApiQuery({ name: 'startDateTo', required: false })
    @ApiQuery({ name: 'endDateFrom', required: false })
    @ApiQuery({ name: 'endDateTo', required: false })
    @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)' })
    @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default: 20)' })
    findAll(
        @Query('status') status?: string,
        @Query('state') state?: string,
        @Query('city') city?: string,
        @Query('search') search?: string,
        @Query('category') category?: string,
        @Query('startDateFrom') startDateFrom?: string,
        @Query('startDateTo') startDateTo?: string,
        @Query('endDateFrom') endDateFrom?: string,
        @Query('endDateTo') endDateTo?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.scrapedTendersService.findAll({
            status,
            state,
            city,
            search,
            category,
            startDateFrom,
            startDateTo,
            endDateFrom,
            endDateTo,
            page: page ? parseInt(page, 10) : 1,
            limit: limit ? parseInt(limit, 10) : 20,
        });
    }

    @Get('stats')
    @ApiOperation({ summary: 'Get tender statistics' })
    getStats() {
        return this.scrapedTendersService.getStats();
    }

    @Get('states')
    @ApiOperation({ summary: 'Get list of available states' })
    getStates() {
        return this.scrapedTendersService.getStates();
    }

    @Get('cities')
    @ApiOperation({ summary: 'Get list of available cities for given states' })
    @ApiQuery({ name: 'state', required: false, description: 'Filter cities by single state' })
    @ApiQuery({ name: 'states', required: false, description: 'Filter cities by multiple states (comma separated or repeated)' })
    async getCities(
        @Query('state') state: string,
        @Query('states') states: string | string[],
    ) {
        // Handle multiple states from query params
        let stateList: string[] = [];
        if (states) {
            // states can be a single string or array of strings
            stateList = Array.isArray(states) ? states : [states];
        }
        if (state && !stateList.includes(state)) {
            stateList.push(state);
        }
        if (stateList.length === 0) {
            return [];
        }
        return this.scrapedTendersService.getCities(stateList);
    }

    @Get('categories')
    @ApiOperation({ summary: 'Get list of available categories from GeM' })
    @ApiQuery({ name: 'page', required: false, description: 'Optional. If provided, returns paginated response' })
    @ApiQuery({ name: 'limit', required: false, description: 'Optional. Items per page when paginating' })
    @ApiQuery({ name: 'search', required: false, description: 'Optional. Search within category name when paginating' })
    getCategories(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('search') search?: string,
    ) {
        if (page || limit || search) {
            return this.gemCategoriesService.getCategoriesPaginated(
                page ? parseInt(page, 10) : 1,
                limit ? parseInt(limit, 10) : 20,
                search,
            );
        }
        return this.gemCategoriesService.getAllCategories();
    }

    @Post('categories/sync')
    @Roles(Role.SUPER_ADMIN)
    @ApiOperation({ summary: 'Manually sync categories from GeM portal' })
    async syncCategories() {
        return this.gemCategoriesService.syncCategories();
    }

    @Delete('categories')
    @Roles(Role.SUPER_ADMIN)
    @ApiOperation({ summary: 'Delete all categories from database' })
    async deleteCategories() {
        return this.gemCategoriesService.deleteAllCategories();
    }

    @Get('logs')
    @ApiOperation({ summary: 'Get scrape job logs' })
    @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)' })
    @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default: 20)' })
    getScrapeLogs(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.scrapedTendersService.getScrapeLogs(
            page ? parseInt(page, 10) : 1,
            limit ? parseInt(limit, 10) : 20,
        );
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get tender by ID' })
    findOne(@Param('id') id: string) {
        return this.scrapedTendersService.findOne(id);
    }

    @Get(':id/pdf')
    @ApiOperation({ summary: 'Download tender as PDF' })
    async downloadPdf(@Param('id') id: string, @Res() res: Response) {
        const pdfBuffer = await this.scrapedTendersService.generatePdf(id);
        const tender = await this.scrapedTendersService.findOne(id);

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="tender-${(tender.bidNo || 'unknown').replace(/\//g, '-')}.pdf"`,
            'Content-Length': pdfBuffer.length,
        });

        res.send(pdfBuffer);
    }

    @Get(':id/gem-document')
    @ApiOperation({ summary: 'Download original GeM bid document PDF (proxied)' })
    async downloadGemDocument(@Param('id') id: string, @Res() res: Response) {
        const { buffer, bidNo } = await this.scrapedTendersService.downloadGemDocument(id);
        const safeName = (bidNo || 'unknown').replace(/[/\\:*?"<>|]+/g, '-');

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="GeM-Bidding-${safeName}.pdf"`,
            'Content-Length': buffer.length,
        });

        res.send(buffer);
    }

    @Post('scrape')
    @Roles(Role.SUPER_ADMIN)
    @ApiOperation({ summary: 'Manually trigger tender scraping (fetches only today\'s tenders by default)' })
    @ApiQuery({ name: 'pages', required: false, description: 'Number of pages to scrape' })
    @ApiQuery({ name: 'todayOnly', required: false, description: 'If true, only fetch tenders published today (default: true)' })
    async triggerScrape(
        @Query('pages') pages?: number,
        @Query('todayOnly') todayOnly?: string,
    ) {
        const todayOnlyBool = todayOnly !== 'false'; // Default to true
        const pagesNumber = pages === undefined || pages === null
            ? 3
            : Number(pages);
        return this.schedulerService.runManually(Number.isFinite(pagesNumber) ? pagesNumber : 3, todayOnlyBool);
    }
}
