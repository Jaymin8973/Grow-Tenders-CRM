import {
    Controller,
    Get,
    Post,
    Param,
    Query,
    Res,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { Role, ScrapedTenderStatus } from '@prisma/client';
import { ScrapedTendersService } from './services/scraped-tenders.service';
import { TenderSchedulerService } from './services/tender-scheduler.service';
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
    ) { }

    @Get()
    @ApiOperation({ summary: 'Get all scraped tenders with pagination' })
    @ApiQuery({ name: 'status', required: false, enum: ScrapedTenderStatus })
    @ApiQuery({ name: 'state', required: false })
    @ApiQuery({ name: 'search', required: false })
    @ApiQuery({ name: 'category', required: false })
    @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)' })
    @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default: 20)' })
    findAll(
        @Query('status') status?: ScrapedTenderStatus,
        @Query('state') state?: string,
        @Query('search') search?: string,
        @Query('category') category?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.scrapedTendersService.findAll({
            status,
            state,
            search,
            category,
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

    @Get('categories')
    @ApiOperation({ summary: 'Get list of available categories' })
    getCategories() {
        return this.scrapedTendersService.getCategories();
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
            'Content-Disposition': `attachment; filename="tender-${tender.bidNo.replace(/\//g, '-')}.pdf"`,
            'Content-Length': pdfBuffer.length,
        });

        res.send(pdfBuffer);
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
        return this.schedulerService.runManually(pages || 3, todayOnlyBool);
    }
}
