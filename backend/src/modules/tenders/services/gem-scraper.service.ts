import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ScrapedTenderStatus } from '@prisma/client';

// puppeteer-extra for stealth
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
    private readonly baseUrl = 'https://bidplus.gem.gov.in/bidlists';

    constructor(private prisma: PrismaService) { }

    /**
     * Scrape tenders from GeM portal
     * @param pages Number of pages to scrape
     * @param todayOnly If true, only fetch tenders published today (best-effort based on start_date)
     */
    async scrapeTenders(
        pages: number = 3,
        todayOnly: boolean = false,
    ): Promise<{ added: number; skipped: number; skippedOld: number }> {
        this.logger.log(`Starting GeM tender scraping... (pages: ${pages}, todayOnly: ${todayOnly})`);

        let browser: any = null;
        let added = 0;
        let skipped = 0;
        let skippedOld = 0;

        const maxRetries = 3;

        // Today string: DD-MM-YYYY (local)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = `${today.getDate().toString().padStart(2, '0')}-${(today.getMonth() + 1)
            .toString()
            .padStart(2, '0')}-${today.getFullYear()}`;

        this.logger.log(`Today's date for filtering: ${todayStr}`);

        try {
            browser = await puppeteer.launch({
                headless: "new", // Use modern headless mode
                executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', // Use real Chrome
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

            const page = await browser.newPage();

            // Set Referer and other headers
            await page.setExtraHTTPHeaders({
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Upgrade-Insecure-Requests': '1',
                'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
                'Sec-Ch-Ua-Mobile': '?0',
                'Sec-Ch-Ua-Platform': '"Windows"',
                'Referer': 'https://gem.gov.in/' // Important!
            });

            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
            page.setDefaultNavigationTimeout(60000);

            // 1. Visit Home Page First (Warm-up)
            try {
                this.logger.log('Warming up: Visiting GeM Home Page...');
                await page.goto('https://gem.gov.in/', { waitUntil: 'domcontentloaded', timeout: 30000 });
                await this.delay(2000);
            } catch (e) {
                this.logger.warn('Home page load warning (ignoring): ' + e.message);
            }

            // 2. Go to Bids Page
            let retries = 0;
            let pageLoaded = false;

            while (retries < maxRetries && !pageLoaded) {
                try {
                    this.logger.log(`Loading GeM page... (attempt ${retries + 1}/${maxRetries})`);

                    await page.goto(this.baseUrl, {
                        waitUntil: 'domcontentloaded',
                        timeout: 60000,
                    });

                    await page.waitForSelector('.card', { timeout: 30000 });
                    pageLoaded = true;
                } catch (err: any) {
                    retries++;
                    this.logger.warn(`Page load failed: ${err.message}`);
                    await this.delay(3000 * retries);
                }
            }

            if (!pageLoaded) {
                throw new Error('GeM bid list page could not be loaded after retries.');
            }

            const now = new Date();

            for (let pageNum = 1; pageNum <= pages; pageNum++) {
                this.logger.log(`Scraping page ${pageNum}/${pages}...`);

                // ✅ Extract tenders from current page
                const tenders = await this.extractTendersFromPage(page);
                this.logger.log(`Found ${tenders.length} tenders on page ${pageNum}`);

                if (!tenders.length) {
                    this.logger.warn(`No tenders found on page ${pageNum}. Possible block/selector change.`);
                }

                // ✅ Bulk duplicate check (FAST)
                const bidNos = tenders.map((t) => t.bidNo).filter(Boolean);

                const existing = await this.prisma.scrapedTender.findMany({
                    where: { bidNo: { in: bidNos } },
                    select: { bidNo: true },
                });

                const existingSet = new Set(existing.map((e) => e.bidNo));

                let foundOldTenderOnThisPage = false;
                let addedThisPage = 0;

                for (const tender of tenders) {
                    try {
                        const startDateObj = this.parseGemdDate(tender.startDate);
                        const endDateObj = this.parseGemdDate(tender.endDate);

                        // ✅ Skip expired
                        if (endDateObj && endDateObj < now) {
                            continue;
                        }

                        // ✅ Today-only filter (best-effort)
                        if (todayOnly && startDateObj) {
                            const tDate = startDateObj.getDate().toString().padStart(2, '0');
                            const tMonth = (startDateObj.getMonth() + 1).toString().padStart(2, '0');
                            const tYear = startDateObj.getFullYear();
                            const tenderDateStr = `${tDate}-${tMonth}-${tYear}`;

                            if (tenderDateStr !== todayStr) {
                                skippedOld++;
                                foundOldTenderOnThisPage = true;
                                continue;
                            }
                        }

                        // ✅ Skip duplicates using bulk set
                        if (existingSet.has(tender.bidNo)) {
                            skipped++;
                            continue;
                        }

                        const state = this.extractState(tender.department);

                        await this.prisma.scrapedTender.create({
                            data: {
                                bidNo: tender.bidNo,
                                title: tender.title,
                                category: tender.category || null,
                                department: tender.department,
                                quantity: tender.quantity || '',
                                startDate: startDateObj,
                                endDate: endDateObj,
                                state,
                                status: ScrapedTenderStatus.ACTIVE,
                                source: 'GeM',
                                sourceUrl: tender.sourceUrl,
                            },
                        });

                        added++;
                        addedThisPage++;
                        existingSet.add(tender.bidNo); // ✅ prevent double insert in same run

                        this.logger.log(`✅ Added tender ${tender.bidNo}`);
                    } catch (err: any) {
                        this.logger.warn(`❌ Failed to save tender ${tender.bidNo}: ${err.message}`);
                    }
                }

                // ✅ FIXED Early stop logic (per-page)
                if (todayOnly && foundOldTenderOnThisPage && addedThisPage === 0) {
                    this.logger.log(`Stopping early: page ${pageNum} contains only old tenders (todayOnly enabled).`);
                    break;
                }

                // ✅ Go next page
                if (pageNum < pages) {
                    const hasNext = await this.goToNextPage(page);
                    if (!hasNext) {
                        this.logger.log(`No next page found, stopping.`);
                        break;
                    }

                    // Wait for cards on next page to load
                    await page.waitForSelector('.card', { timeout: 30000 });
                    await this.delay(1500);
                }
            }

            this.logger.log(
                `Scraping complete. Added: ${added}, Skipped duplicates: ${skipped}, Skipped old: ${skippedOld}`,
            );

            return { added, skipped, skippedOld };
        } catch (error: any) {
            this.logger.error(`Scraping failed: ${error.message}`);
            throw error;
        } finally {
            if (browser) {
                await browser.close();
            }
        }
    }

    /**
     * Extract tender cards from page
     */
    private async extractTendersFromPage(page: any): Promise<ScrapedTenderData[]> {
        return page.evaluate(() => {
            const cards = document.querySelectorAll('.card');
            const tenders: any[] = [];

            const cleanText = (t: string) => (t || '').replace(/\s+/g, ' ').trim();

            cards.forEach((card) => {
                try {
                    const bidNoEl = card.querySelector('a.bid_no_hover');
                    const bidNo = cleanText(bidNoEl?.textContent || '');

                    if (!bidNo) return;

                    // Title
                    const titleEl = card.querySelector('.card-body .col-md-4 a');
                    const title =
                        titleEl?.getAttribute('data-content') ||
                        cleanText(titleEl?.textContent || '');

                    let category = (title || '').split(/[,\-\n]/)[0]?.trim() || '';
                    if (category.length > 100) category = category.substring(0, 100);

                    // Quantity (robust)
                    let quantity = '';
                    const quantityText = cleanText(card.textContent || '');
                    const qMatch = quantityText.match(/Quantity[:\s]*([0-9,]+)/i);
                    if (qMatch?.[1]) {
                        quantity = qMatch[1].replace(/,/g, '');
                    }

                    // Department block (best-effort)
                    const deptEl = card.querySelector('.card-body .col-md-5');
                    const department = cleanText(deptEl?.textContent || '');

                    // Dates
                    const startEl = card.querySelector('.start_date');
                    const endEl = card.querySelector('.end_date');
                    const startDate = cleanText(startEl?.textContent || '');
                    const endDate = cleanText(endEl?.textContent || '');

                    const sourceUrl = bidNoEl ? (bidNoEl as HTMLAnchorElement).href : '';

                    tenders.push({
                        bidNo,
                        title,
                        category,
                        department,
                        quantity,
                        startDate,
                        endDate,
                        sourceUrl,
                    });
                } catch (e) {
                    // skip
                }
            });

            return tenders;
        });
    }

    /**
     * Go to next page safely
     */
    private async goToNextPage(page: any): Promise<boolean> {
        // GeM pagination sometimes uses next button with different selectors
        const nextSelectors = [
            'a.page-link.next',
            'ul.pagination a[rel="next"]',
            'ul.pagination li.page-item:last-child a.page-link',
        ];

        let nextButton: any = null;

        for (const sel of nextSelectors) {
            const btn = await page.$(sel);
            if (btn) {
                nextButton = btn;
                break;
            }
        }

        if (!nextButton) return false;

        // Check disabled state (best-effort)
        const isDisabled = await page.evaluate((el: any) => {
            const cls = el.getAttribute('class') || '';
            const parentCls = el.parentElement?.getAttribute('class') || '';
            return cls.includes('disabled') || parentCls.includes('disabled') || el.getAttribute('aria-disabled') === 'true';
        }, nextButton);

        if (isDisabled) return false;

        // ✅ Click and wait (works for navigation + ajax)
        const oldFirstBid = await page.evaluate(() => {
            const first = document.querySelector('a.bid_no_hover');
            return first?.textContent?.trim() || '';
        });

        await nextButton.click();
        await this.delay(800);

        // Wait until first bid changes OR cards re-render
        try {
            await page.waitForFunction(
                (oldBid: string) => {
                    const first = document.querySelector('a.bid_no_hover');
                    const newBid = first?.textContent?.trim() || '';
                    return newBid && newBid !== oldBid;
                },
                { timeout: 30000 },
                oldFirstBid,
            );
        } catch (e) {
            // fallback: still continue, sometimes first bid stays same but page changed
        }

        return true;
    }

    /**
     * Parse GeM date: "29-12-2025 12:15 PM"
     */
    private parseGemdDate(dateStr: string): Date | null {
        if (!dateStr) return null;

        const match = dateStr.match(/(\d{2})-(\d{2})-(\d{4})\s+(\d{1,2}):(\d{2})\s*(AM|PM)/i);
        if (!match) return null;

        let [, day, month, year, hours, minutes, period] = match;

        let hour = parseInt(hours, 10);
        const minute = parseInt(minutes, 10);

        if (period.toUpperCase() === 'PM' && hour !== 12) hour += 12;
        if (period.toUpperCase() === 'AM' && hour === 12) hour = 0;

        return new Date(
            parseInt(year, 10),
            parseInt(month, 10) - 1,
            parseInt(day, 10),
            hour,
            minute,
        );
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

    private delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    /**
     * Mark expired tenders
     */
    async updateExpiredTenders(): Promise<number> {
        const result = await this.prisma.scrapedTender.updateMany({
            where: {
                status: ScrapedTenderStatus.ACTIVE,
                endDate: { lt: new Date() },
            },
            data: {
                status: ScrapedTenderStatus.EXPIRED,
            },
        });

        return result.count;
    }
}
