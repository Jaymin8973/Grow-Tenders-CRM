import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

// puppeteer-extra for stealth
/* eslint-disable @typescript-eslint/no-var-requires */
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());




interface ScrapedTenderData {
    bidNo: string;
    title: string;
    category: string;
    department: string;
    quantity: string;
    startDate: string;
    endDate: string;
    sourceUrl: string;
}

@Injectable()
export class GemScraperService {
    private readonly logger = new Logger(GemScraperService.name);
    // Base URL for all bids page (sort applied via UI dropdown click)
    private readonly baseUrl = 'https://bidplus.gem.gov.in/all-bids';

    constructor(private prisma: PrismaService) { }

    /**
     * Scrape tenders from GeM portal
     * @param maxPages Maximum pages to scrape (0 = unlimited, scrape all pages)
     * @param todayOnly If true, only fetch tenders published today (best-effort based on start_date)
     */
    async scrapeTenders(
        maxPages: number = 0,
        fromDate?: Date,
    ): Promise<{ added: number; skipped: number; skippedOld: number; pagesScraped: number; newTenders: any[] }> {
        // Default to today 00:00:00 if not provided
        if (!fromDate) {
            fromDate = new Date();
            fromDate.setHours(0, 0, 0, 0);
        }

        const pagesInfo = maxPages === 0 ? 'all pages' : `max ${maxPages} pages`;
        this.logger.log(`Starting GeM tender scraping... (${pagesInfo}, fromDate: ${fromDate.toISOString()})`);

        // Create Scrape Job
        const job = await this.prisma.tenderScrapeJob.create({
            data: {
                status: 'RUNNING',
                tendersFound: 0,
                tendersInserted: 0,
                errors: [],
            }
        });

        let browser: any = null;
        let page: any = null;
        let currentUrl = this.baseUrl;
        let added = 0;
        let skipped = 0;
        let skippedOld = 0;
        const newTenders: any[] = [];
        const errors: string[] = [];

        const maxRetries = 3;

        try {
            browser = await this.launchBrowser();

            page = await browser.newPage();
            await this.setupPage(page);

            // 1. Visit Home Page
            try {
                await page.goto('https://gem.gov.in/', { waitUntil: 'domcontentloaded', timeout: 30000 });
                await this.delay(2000);
            } catch (e) { }

            // 2. Go to Bids Page
            let retries = 0;
            let pageLoaded = false;
            while (retries < maxRetries && !pageLoaded) {
                try {
                    await page.goto(this.baseUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
                    await page.waitForSelector('.card', { timeout: 30000 });
                    pageLoaded = true;
                } catch (err: any) {
                    retries++;
                    await this.delay(3000 * retries);
                }
            }

            if (!pageLoaded) throw new Error('GeM bid list page not loaded.');

            currentUrl = page.url();

            // We extract the CSRF token injected in the page scripts
            const csrfToken = await page.evaluate(() => {
                let token = null;
                const scripts = document.querySelectorAll('script');
                for (const s of scripts) {
                    const match = s.innerHTML.match(/['"]?csrf_bd_gem_nk['"]?\s*:\s*['"]([a-f0-9]{32})['"]/);
                    if (match) {
                        token = match[1];
                        break;
                    }
                }
                return token;
            });

            if (!csrfToken) {
                throw new Error('Could not extract CSRF token from page scripts.');
            }
            this.logger.log('Extracted CSRF Token successfully.');

            const now = new Date();
            let pageNum = 0;
            let hasMorePages = true;
            const maxConsecutiveOldPages = 2;
            let consecutiveOldPages = 0;

            // Main Scraping Loop via API
            while (hasMorePages) {
                pageNum++;

                // Check max pages limit (0 = unlimited)
                if (maxPages > 0 && pageNum > maxPages) {
                    this.logger.log(`Reached max pages limit: ${maxPages}`);
                    break;
                }

                this.logger.log(`Scraping page ${pageNum} via API...`);

                let docs: any[] = [];
                try {
                    docs = await page.evaluate(async (pNum: number, token: string) => {
                        const payloadObj = {
                            param: { searchBid: '', searchType: 'fullText' },
                            filter: {
                                bidStatusType: 'ongoing_bids',
                                byType: 'all',
                                highBidValue: '',
                                byEndDate: { from: '', to: '' },
                                sort: 'Bid-Start-Date-Latest'
                            }
                        };
                        if (pNum > 1) {
                            (payloadObj as any).page = pNum;
                        }

                        const payloadStr = encodeURIComponent(JSON.stringify(payloadObj));
                        const formData = 'payload=' + payloadStr + '&csrf_bd_gem_nk=' + token;

                        const r = await fetch('https://bidplus.gem.gov.in/all-bids-data', {
                            method: 'POST',
                            headers: {
                                'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
                                'x-requested-with': 'XMLHttpRequest'
                            },
                            body: formData
                        });
                        const json = await r.json();
                        return json?.response?.response?.docs || [];
                    }, pageNum, csrfToken);
                } catch (err: any) {
                    this.logger.warn(`API fetch failed on page ${pageNum}: ${err.message}. Stopping.`);
                    break;
                }

                if (!docs || docs.length === 0) {
                    this.logger.log(`No active tenders found on page ${pageNum}. Stopping.`);
                    break;
                }

                // Map JSON response to ScrapedTenderData
                let tenders: ScrapedTenderData[] = docs.map((doc: any) => {
                    const bidNo = doc.b_bid_number ? doc.b_bid_number[0] : '';
                    let title = doc.bbt_title ? doc.bbt_title[0] : '';
                    let category = doc.b_category_name ? doc.b_category_name[0] : '';
                    if (!title) title = category;
                    if (category.length > 100) category = category.substring(0, 100);

                    let department = '';
                    if (doc.ba_official_details_minName) department += doc.ba_official_details_minName[0] + ' ';
                    if (doc.ba_official_details_deptName) department += doc.ba_official_details_deptName[0];
                    department = department.trim();

                    const quantity = doc.b_total_quantity ? String(doc.b_total_quantity[0]) : '';

                    return {
                        bidNo,
                        title,
                        category,
                        department,
                        quantity,
                        startDate: doc.final_start_date_sort ? doc.final_start_date_sort[0] : '', // ISO String
                        endDate: doc.final_end_date_sort ? doc.final_end_date_sort[0] : '', // ISO String
                        sourceUrl: bidNo ? `https://bidplus.gem.gov.in/showbidDocument/${doc.b_id[0]}` : ''
                    } as ScrapedTenderData;
                }).filter((t: any) => t.bidNo);

                // Gather Reference IDs for duplicate check
                const referenceIds = tenders.map((t) => t.bidNo).filter(Boolean);
                const existing = await this.prisma.tender.findMany({
                    where: { referenceId: { in: referenceIds } },
                    select: { referenceId: true },
                });
                const existingSet = new Set(existing.map((e: any) => e.referenceId));

                let addedThisPage = 0;
                let pageFreshCount = 0;
                let pageOldCount = 0;
                let pageUnknownCount = 0;

                for (const tender of tenders) {
                    try {
                        const startDateObj = tender.startDate ? new Date(tender.startDate) : null;
                        const endDateObj = tender.endDate ? new Date(tender.endDate) : null;

                        // Skip tenders older than fromDate, but keep scanning the page.
                        // We only stop after seeing consecutive pages with no fresh tenders.
                        if (startDateObj && startDateObj < fromDate!) {
                            skippedOld++;
                            pageOldCount++;
                            continue;
                        }

                        if (startDateObj) {
                            pageFreshCount++;
                        } else {
                            pageUnknownCount++;
                        }

                        // Skip closed/past tenders (redundant if using fromDate usually, but good for safety)
                        if (endDateObj && endDateObj < now) continue;

                        // Check duplicates
                        if (existingSet.has(tender.bidNo)) {
                            skipped++;
                            continue;
                        }

                        const state = this.extractState(tender.department);

                        const newTender = await this.prisma.tender.create({
                            data: {
                                title: tender.title,
                                description: tender.department || '',
                                status: 'PUBLISHED',
                                source: 'GEM',
                                referenceId: tender.bidNo,
                                tenderUrl: tender.sourceUrl,
                                categoryName: tender.category,
                                state: state,
                                publishDate: startDateObj,
                                closingDate: endDateObj,
                            }
                        });

                        newTenders.push(newTender);
                        added++;
                        addedThisPage++;
                        existingSet.add(tender.bidNo);
                    } catch (err: any) {
                        this.logger.warn(`Failed to save tender ${tender.bidNo}: ${err.message}`);
                        errors.push(`Failed to save ${tender.bidNo}: ${err.message}`);
                    }
                }

                // Update job progress
                await this.prisma.tenderScrapeJob.update({
                    where: { id: job.id },
                    data: {
                        tendersFound: job.tendersFound + tenders.length,
                        tendersInserted: added,
                    }
                });

                if (pageFreshCount > 0 || pageUnknownCount > 0) {
                    consecutiveOldPages = 0;
                } else if (pageOldCount > 0) {
                    consecutiveOldPages++;
                }

                if (consecutiveOldPages >= maxConsecutiveOldPages) {
                    this.logger.log(`No tenders on/after ${fromDate!.toDateString()} for ${consecutiveOldPages} consecutive pages. Stopping.`);
                    hasMorePages = false;
                    break;
                }
            }

            this.logger.log(`Scraping completed. Total pages scraped: ${pageNum}`);

            // Job Complete
            await this.prisma.tenderScrapeJob.update({
                where: { id: job.id },
                data: {
                    status: 'COMPLETED',
                    endTime: new Date(),
                    tendersInserted: added,
                    errors: errors,
                }
            });

            return { added, skipped, skippedOld, pagesScraped: pageNum, newTenders };

        } catch (error: any) {
            this.logger.error(`Scraping failed: ${error.message}`);

            // Job Failed
            await this.prisma.tenderScrapeJob.update({
                where: { id: job.id },
                data: {
                    status: 'FAILED',
                    endTime: new Date(),
                    errors: [...errors, error.message],
                }
            });
            throw error;
        } finally {
            if (browser) await browser.close();
        }
    }

    private formatDate(date: Date): string {
        return `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1)
            .toString()
            .padStart(2, '0')}-${date.getFullYear()}`;
    }



    /**
     * Extract state from department text (best-effort)
     */
    private extractState(department: string): string | null {
        if (!department) return null;

        const states = [
            'Andhra Pradesh',
            'Arunachal Pradesh',
            'Assam',
            'Bihar',
            'Chhattisgarh',
            'Goa',
            'Gujarat',
            'Haryana',
            'Himachal Pradesh',
            'Jharkhand',
            'Karnataka',
            'Kerala',
            'Madhya Pradesh',
            'Maharashtra',
            'Manipur',
            'Meghalaya',
            'Mizoram',
            'Nagaland',
            'Odisha',
            'Punjab',
            'Rajasthan',
            'Sikkim',
            'Tamil Nadu',
            'Telangana',
            'Tripura',
            'Uttar Pradesh',
            'Uttarakhand',
            'West Bengal',
            'Delhi',
            'Chandigarh',
            'Puducherry',
            'Jammu and Kashmir',
            'Ladakh',
        ];

        const deptLower = department.toLowerCase();

        for (const state of states) {
            if (deptLower.includes(state.toLowerCase())) {
                return state;
            }
        }
        return null;
    }

    private async launchBrowser() {
        const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH ||
            (process.platform === 'win32' ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' : undefined);

        return puppeteer.launch({
            headless: "new" as any,
            executablePath,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-blink-features=AutomationControlled',
                '--disable-web-security',
                '--window-size=1920,1080',
                '--start-maximized'
            ],
            defaultViewport: null,
        });
    }

    private async setupPage(page: any) {
        await page.setExtraHTTPHeaders({
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
            'Sec-Ch-Ua-Mobile': '?0',
            'Sec-Ch-Ua-Platform': '"Windows"',
            'Referer': 'https://gem.gov.in/'
        });
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        page.setDefaultNavigationTimeout(60000);
    }



    private delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    /**
     * Mark expired tenders
     */
    async updateExpiredTenders(): Promise<number> {
        const result = await this.prisma.tender.updateMany({
            where: {
                status: 'PUBLISHED',
                closingDate: { lt: new Date() },
            },
            data: {
                status: 'CLOSED',
            },
        });

        return result.count;
    }
}
