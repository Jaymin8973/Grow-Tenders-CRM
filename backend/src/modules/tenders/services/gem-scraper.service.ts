import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import puppeteer, { Browser, Page } from 'puppeteer';

/* ======================= TYPES ======================= */

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

/* ======================= SERVICE ======================= */

@Injectable()
export class GemScraperService {
    private readonly logger = new Logger(GemScraperService.name);

    private readonly baseUrl =
        'https://bidplus.gem.gov.in/bidlists?bidlists&sorting=bid_start_date%7Cdesc';

    constructor(private prisma: PrismaService) { }

    /* ======================= MAIN SCRAPER ======================= */

    async scrapeTenders(
        maxPages = 3, // 🔴 Render free plan ke liye low rakho
        fromDate?: Date,
    ): Promise<{
        added: number;
        skipped: number;
        skippedOld: number;
        pagesScraped: number;
    }> {
        if (!fromDate) {
            fromDate = new Date();
            fromDate.setHours(0, 0, 0, 0);
        }

        const job = await this.prisma.tenderScrapeJob.create({
            data: {
                status: 'RUNNING',
                tendersFound: 0,
                tendersInserted: 0,
                errors: [],
            },
        });

        let browser: Browser | null = null;
        let page: Page | null = null;

        let added = 0;
        let skipped = 0;
        let skippedOld = 0;
        let pagesScraped = 0;
        const errors: string[] = [];

        try {
            browser = await this.launchBrowser();
            page = await browser.newPage();
            await this.setupPage(page);

            await page.goto(this.baseUrl, {
                waitUntil: 'domcontentloaded',
                timeout: 60000,
            });

            await page.waitForSelector('.card', { timeout: 30000 });

            let hasMore = true;

            while (hasMore) {
                pagesScraped++;
                if (pagesScraped > maxPages) break;

                this.logger.log(`Scraping page ${pagesScraped}`);

                const tenders = await this.extractTendersFromPage(page);
                if (!tenders.length) break;

                const referenceIds = tenders.map((t) => t.bidNo);
                const existing = await this.prisma.tender.findMany({
                    where: { referenceId: { in: referenceIds } },
                    select: { referenceId: true },
                });

                const existingSet = new Set(existing.map((e) => e.referenceId));
                const now = new Date();

                for (const t of tenders) {
                    try {
                        const start = this.parseGemDate(t.startDate);
                        const end = this.parseGemDate(t.endDate);

                        if (start && start < fromDate) {
                            skippedOld++;
                            continue;
                        }

                        if (end && end < now) continue;

                        if (existingSet.has(t.bidNo)) {
                            skipped++;
                            continue;
                        }

                        const state = this.extractState(t.department);

                        await this.prisma.tender.create({
                            data: {
                                title: t.title,
                                description: t.department || '',
                                status: 'PUBLISHED',
                                source: 'GEM',
                                referenceId: t.bidNo,
                                tenderUrl: t.sourceUrl,
                                categoryName: t.category,
                                state,
                                publishDate: start,
                                closingDate: end,
                            },
                        });

                        added++;
                        existingSet.add(t.bidNo);
                    } catch (e: any) {
                        errors.push(e.message);
                    }
                }

                await this.prisma.tenderScrapeJob.update({
                    where: { id: job.id },
                    data: {
                        tendersFound: job.tendersFound + tenders.length,
                        tendersInserted: added,
                    },
                });

                hasMore = await this.goToNextPage(page);
                await this.delay(1200);
            }

            await this.prisma.tenderScrapeJob.update({
                where: { id: job.id },
                data: {
                    status: 'COMPLETED',
                    endTime: new Date(),
                    tendersInserted: added,
                    errors,
                },
            });

            return { added, skipped, skippedOld, pagesScraped };
        } catch (err: any) {
            await this.prisma.tenderScrapeJob.update({
                where: { id: job.id },
                data: {
                    status: 'FAILED',
                    endTime: new Date(),
                    errors: [...errors, err.message],
                },
            });
            throw err;
        } finally {
            try {
                if (browser) await browser.close();
            } catch { }
        }
    }

    /* ======================= BROWSER ======================= */

    private async launchBrowser(): Promise<Browser> {
        return puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--single-process',
                '--no-zygote',
            ],
        });
    }

    private async setupPage(page: Page): Promise<void> {
        await page.setUserAgent(
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
        );

        await page.setExtraHTTPHeaders({
            'Accept-Language': 'en-US,en;q=0.9',
            Referer: 'https://gem.gov.in/',
        });

        page.setDefaultNavigationTimeout(60000);
    }

    /* ======================= SCRAPING ======================= */

    private async extractTendersFromPage(
        page: Page,
    ): Promise<ScrapedTenderData[]> {
        return page.evaluate(() => {
            const clean = (t: string) => (t || '').replace(/\s+/g, ' ').trim();
            const cards = document.querySelectorAll('.card');
            const results: any[] = [];

            cards.forEach((card) => {
                const bidEl = card.querySelector('a.bid_no_hover');
                const bidNo = clean(bidEl?.textContent || '');
                if (!bidNo) return;

                const titleEl = card.querySelector('.card-body .col-md-4 a');
                const title =
                    titleEl?.getAttribute('data-content') ||
                    clean(titleEl?.textContent || '');

                const deptEl = card.querySelector('.card-body .col-md-5');
                const department = clean(deptEl?.textContent || '');

                const startDate = clean(
                    card.querySelector('.start_date')?.textContent || '',
                );
                const endDate = clean(
                    card.querySelector('.end_date')?.textContent || '',
                );

                results.push({
                    bidNo,
                    title,
                    category: title.split(/[,\-]/)[0] || '',
                    department,
                    quantity: '',
                    startDate,
                    endDate,
                    sourceUrl: (bidEl as HTMLAnchorElement)?.href || '',
                });
            });

            return results;
        });
    }

    private async goToNextPage(page: Page): Promise<boolean> {
        const next = await page.$('ul.pagination a[rel="next"]');
        if (!next) return false;

        await next.click();
        await page.waitForSelector('.card', { timeout: 30000 });
        return true;
    }

    /* ======================= HELPERS ======================= */

    private parseGemDate(str: string): Date | null {
        const m = str.match(
            /(\d{2})-(\d{2})-(\d{4})\s+(\d+):(\d+)\s*(AM|PM)/i,
        );
        if (!m) return null;

        let [, d, mo, y, h, mi, ap] = m;
        let hour = parseInt(h, 10);
        if (ap === 'PM' && hour !== 12) hour += 12;
        if (ap === 'AM' && hour === 12) hour = 0;

        return new Date(+y, +mo - 1, +d, hour, +mi);
    }

    private extractState(dept: string): string | null {
        if (!dept) return null;
        const states = [
            'Gujarat',
            'Maharashtra',
            'Delhi',
            'Rajasthan',
            'Karnataka',
            'Tamil Nadu',
            'Uttar Pradesh',
        ];
        const lower = dept.toLowerCase();
        return states.find((s) => lower.includes(s.toLowerCase())) || null;
    }

    private delay(ms: number): Promise<void> {
        return new Promise((r) => setTimeout(r, ms));
    }
}
