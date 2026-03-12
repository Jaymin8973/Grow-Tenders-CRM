import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { INDIAN_CITY_STATE_MAP, AMBIGUOUS_LOCATION_NAMES } from '../data/indian-locations';
import * as https from 'https';
import * as http from 'http';

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
    createdBy?: string; // Contains city info like "RFO-Jamnagar"
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
     * @param fromDate Optional - only fetch tenders published on/after this date. If not provided, fetches ALL active tenders.
     */
    async scrapeTenders(
        maxPages: number = 0,
        fromDate?: Date | null,
    ): Promise<{ added: number; skipped: number; skippedOld: number; pagesScraped: number; newTenders: any[] }> {
        // If fromDate is explicitly null or undefined, fetch ALL active tenders
        // Only use today's date if fromDate is explicitly passed as a valid Date

        const pagesInfo = maxPages === 0 ? 'all pages' : `max ${maxPages} pages`;
        const fromDateInfo = fromDate ? `fromDate: ${fromDate.toISOString()}` : 'ALL active tenders';
        this.logger.log(`Starting GeM tender scraping... (${pagesInfo}, ${fromDateInfo})`);

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
        let detailPage: any = null;
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

            detailPage = await browser.newPage();
            await this.setupPage(detailPage);

            // 1. Visit Home Page
            try {
                await page.goto('https://gem.gov.in/', { waitUntil: 'domcontentloaded', timeout: 30000 });
                await this.delay(2000);
            } catch { }

            // 2. Go to Bids Page
            let retries = 0;
            let pageLoaded = false;
            while (retries < maxRetries && !pageLoaded) {
                try {
                    await page.goto(this.baseUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
                    await page.waitForSelector('.card', { timeout: 30000 });
                    pageLoaded = true;
                } catch {
                    retries++;
                    await this.delay(3000 * retries);
                }
            }

            if (!pageLoaded) throw new Error('GeM bid list page not loaded.');

            page.url();

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

                    // Extract created_by field which often contains city info (e.g., "RFO-Jamnagar")
                    const createdBy = doc['b.b_created_by'] ? doc['b.b_created_by'][0] : '';

                    // RA bids (b_bid_type=2, R/ prefix) don't have their own PDF.
                    // Use b_id_parent for the document URL when available.
                    const docId = doc.b_id_parent ? doc.b_id_parent[0] : doc.b_id[0];

                    return {
                        bidNo,
                        title,
                        category,
                        department,
                        quantity,
                        startDate: doc.final_start_date_sort ? doc.final_start_date_sort[0] : '', // ISO String
                        endDate: doc.final_end_date_sort ? doc.final_end_date_sort[0] : '', // ISO String
                        sourceUrl: bidNo ? `https://bidplus.gem.gov.in/showbidDocument/${docId}` : '',
                        createdBy,
                    } as ScrapedTenderData;
                }).filter((t: any) => t.bidNo);

                // Gather Reference IDs for duplicate check
                const referenceIds = tenders.map((t) => t.bidNo).filter(Boolean);
                const existing = await this.prisma.tender.findMany({
                    where: { referenceId: { in: referenceIds } },
                    select: { referenceId: true },
                });
                const existingSet = new Set(existing.map((e: any) => e.referenceId));

                let pageFreshCount = 0;
                let pageOldCount = 0;
                let pageUnknownCount = 0;

                for (const tender of tenders) {
                    try {
                        const startDateObj = tender.startDate ? new Date(tender.startDate) : null;
                        const endDateObj = tender.endDate ? new Date(tender.endDate) : null;

                        // Skip tenders older than fromDate (if provided), but keep scanning the page.
                        // We only stop after seeing consecutive pages with no fresh tenders.
                        if (fromDate && startDateObj && startDateObj < fromDate) {
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

                        // Extract state from department text (fallback only)
                        let deptState: string | null = this.extractState(tender.department || '');
                        let state: string | null = null;
                        let city: string | null = null;

                        // Extract city from createdBy field (e.g., "RFO-Jamnagar" -> "Jamnagar")
                        if (tender.createdBy) {
                            const extractedCity = this.extractCityFromCreatedBy(tender.createdBy);
                            if (extractedCity) city = extractedCity;
                        }

                        // Extract city and state from PDF (most reliable)
                        let address: string | null = null;
                        try {
                            if (tender.sourceUrl) {
                                const pdfResult = await this.extractCityFromPdf(tender.sourceUrl);
                                if (pdfResult.city) city = pdfResult.city;
                                if (pdfResult.state) state = pdfResult.state;
                                if (pdfResult.address) address = pdfResult.address;
                            }
                        } catch (err: any) {
                            this.logger.warn(`PDF city extraction failed for ${tender.bidNo}: ${err.message}`);
                        }

                        // Fallback: derive state from city if PDF didn't provide state directly
                        if (city && !state) {
                            state = this.getStateFromCity(city);
                        }

                        // Last resort: use department-derived state only if nothing else worked
                        if (!state && deptState && deptState !== 'Pan India') {
                            state = deptState;
                        }

                        // Log extraction result
                        this.logger.log(`Tender ${tender.bidNo}: department="${tender.department}", createdBy="${tender.createdBy || ''}" => state=${state || 'null'}, city=${city || 'null'}`);

                        const newTender = await this.prisma.tender.create({
                            data: {
                                title: tender.title,
                                description: tender.department || '',
                                department: tender.department || null,
                                status: 'PUBLISHED',
                                source: 'GEM',
                                referenceId: tender.bidNo,
                                tenderUrl: tender.sourceUrl,
                                categoryName: tender.category,
                                state: state,
                                city: city,
                                address: address,
                                publishDate: startDateObj,
                                closingDate: endDateObj,
                            } as any,
                        });

                        newTenders.push(newTender);
                        added++;
                        existingSet.add(tender.bidNo);
                    } catch (err) {
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

                if (fromDate && consecutiveOldPages >= maxConsecutiveOldPages) {
                    this.logger.log(`No tenders on/after ${fromDate.toDateString()} for ${consecutiveOldPages} consecutive pages. Stopping.`);
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

        const text = department
            .toLowerCase()
            .replace(/\([^)]*\)/g, ' ')
            .replace(/[^a-z\s]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        // Check for central ministries - set to "Pan India"
        const centralMinistries = [
            'ministry of defence',
            'ministry of home affairs',
            'ministry of finance',
            'ministry of external affairs',
            'ministry of coal',
            'ministry of petroleum',
            'ministry of steel',
            'ministry of power',
            'ministry of railways',
            'ministry of shipping',
            'ministry of aviation',
            'department of military affairs',
            'central police organisation',
            'nlc india limited',
        ];

        for (const ministry of centralMinistries) {
            if (text.includes(ministry)) {
                return 'Pan India';
            }
        }

        const states = this.getStatesList();
        for (const state of states) {
            if (text.includes(state.toLowerCase())) return state;
        }

        const synonyms: Array<[RegExp, string]> = [
            [/\bnct\b|\bdelhi\b|\bnew delhi\b/, 'Delhi'],
            [/\bj\s*&\s*k\b|\bjammu\b.*\bkashmir\b|\bjammu and kashmir\b/, 'Jammu and Kashmir'],
            [/\bup\b|\butar pradesh\b|\buttar pradesh\b/, 'Uttar Pradesh'],
            [/\buk\b|\buttrakhand\b|\bttarakhand\b|\buttarakhand\b/, 'Uttarakhand'],
            [/\bmp\b|\bmadhya pradesh\b/, 'Madhya Pradesh'],
            [/\bap\b|\bandhra pradesh\b/, 'Andhra Pradesh'],
            [/\bts\b|\btelangana\b/, 'Telangana'],
            [/\btn\b|\btamil nadu\b/, 'Tamil Nadu'],
            [/\bwb\b|\bwest bengal\b/, 'West Bengal'],
            [/\bhp\b|\bhimachal pradesh\b/, 'Himachal Pradesh'],
            [/\bpb\b|\bpunjab\b/, 'Punjab'],
            [/\bhr\b|\bharyana\b/, 'Haryana'],
            [/\bbr\b|\bbihar\b/, 'Bihar'],
            [/\bga\b|\bgoa\b/, 'Goa'],
            [/\bgj\b|\bgujarat\b/, 'Gujarat'],
            [/\bmh\b|\bmaharashtra\b/, 'Maharashtra'],
            [/\brj\b|\brajasthan\b/, 'Rajasthan'],
            [/\bor\b|\bodisha\b|\borissa\b/, 'Odisha'],
            [/\bch\b|\bchandigarh\b/, 'Chandigarh'],
            [/\bpy\b|\bpuducherry\b|\bpondicherry\b/, 'Puducherry'],
            [/\bla\b|\bladakh\b/, 'Ladakh'],
        ];

        for (const [re, value] of synonyms) {
            if (re.test(text)) return value;
        }

        return null;
    }

    /**
     * Extract city from createdBy field (e.g., "RFO-Jamnagar" -> "Jamnagar")
     */
    private extractCityFromCreatedBy(createdBy: string): string | null {
        if (!createdBy) return null;

        // Common patterns: "RFO-Jamnagar", "DFO-Rajkot", "CF-Gandhinagar"
        // Pattern: prefix-CityName
        const match = createdBy.match(/[-–]\s*([A-Za-z]+)\s*$/);
        if (match?.[1]) {
            const city = match[1].trim();
            // Validate it's not a common non-city word
            const nonCityWords = /^(office|division|unit|branch|dept|department|ministry)$/i;
            if (!nonCityWords.test(city) && city.length >= 3) {
                return city;
            }
        }

        // Try to find any capitalized word after a separator
        const parts = createdBy.split(/[-–_]/);
        if (parts.length > 1) {
            const lastPart = parts[parts.length - 1].trim();
            if (lastPart.length >= 3 && /^[A-Z]/.test(lastPart)) {
                return lastPart;
            }
        }

        return null;
    }

    /**
     * Download a PDF from a URL and return the buffer
     */
    private downloadPdfBuffer(url: string): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const makeRequest = (targetUrl: string, redirectCount = 0) => {
                if (redirectCount > 5) return reject(new Error('Too many redirects'));

                const protocol = targetUrl.startsWith('https') ? https : http;
                protocol.get(targetUrl, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Accept': 'application/pdf,*/*',
                        'Referer': 'https://bidplus.gem.gov.in/',
                        'Accept-Language': 'en-US,en;q=0.9',
                        'Connection': 'keep-alive',
                    },
                    timeout: 30000,
                }, (res) => {
                    if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                        const loc = res.headers.location;
                        const nextUrl = loc.startsWith('http')
                            ? loc
                            : new URL(loc, targetUrl).toString();
                        makeRequest(nextUrl, redirectCount + 1);
                        return;
                    }
                    if (res.statusCode && res.statusCode !== 200) {
                        return reject(new Error(`HTTP ${res.statusCode}`));
                    }
                    const chunks: Buffer[] = [];
                    res.on('data', (chunk: Buffer) => chunks.push(chunk));
                    res.on('end', () => {
                        const buf = Buffer.concat(chunks);
                        const ct = String(res.headers['content-type'] || '').toLowerCase();
                        const looksLikePdf = buf.length >= 5 && buf.slice(0, 4).toString() === '%PDF';

                        // Sometimes GeM returns an HTML intermediate page or non-PDF response.
                        if (!looksLikePdf && ct.includes('text/html')) {
                            const html = buf.toString('utf8');

                            // Try to find a redirected PDF link in HTML
                            const m = html.match(/https?:\/\/[^\s"']+\.pdf[^\s"']*/i);
                            if (m?.[0]) {
                                makeRequest(m[0], redirectCount + 1);
                                return;
                            }

                            // If response says it's HTML and not a PDF, fail fast.
                            return reject(new Error(`Non-PDF response (content-type=${ct}, bytes=${buf.length})`));
                        }

                        resolve(buf);
                    });
                    res.on('error', reject);
                }).on('error', reject);
            };
            makeRequest(url);
        });
    }

    /**
     * Extract city and state from a GeM tender document PDF.
     * The PDF Consignee/Address section contains city names in ALL CAPS.
     */
    async extractCityStateFromDocument(documentUrl: string): Promise<{ city: string | null; state: string | null }> {
        let city: string | null = null;
        let state: string | null = null;

        try {
            const pdfBuffer = await this.downloadPdfBuffer(documentUrl);

            // Validate it's actually a PDF
            if (pdfBuffer.length < 5 || pdfBuffer.slice(0, 4).toString() !== '%PDF') {
                return { city, state };
            }

            // Use pdfjs-dist legacy build (Node.js compatible)
            const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
            const data = new Uint8Array(pdfBuffer);
            const doc = await pdfjsLib.getDocument({ data }).promise;

            // Only scan first 15 pages (consignee info is usually early)
            const pagesToScan = Math.min(doc.numPages, 15);

            for (let i = 1; i <= pagesToScan; i++) {
                const page = await doc.getPage(i);
                const content = await page.getTextContent();

                // Reconstruct text with line breaks based on Y-position
                let prevY: number | null = null;
                let text = '';
                for (const item of content.items as any[]) {
                    if (prevY !== null && Math.abs(item.transform[5] - prevY) > 5) {
                        text += '\n';
                    }
                    text += item.str;
                    prevY = item.transform[5];
                }

                // Look for Consignee/Address section
                if (!/consignee|address.*quantity|delivery/i.test(text)) continue;

                // Extract city from lines like: "1 *********** ***********KANPUR CITY 24 1200"
                // Pattern: asterisks followed by a city name in CAPS
                const cityMatch = text.match(/\*{3,}\s*([A-Z][A-Z\s]{2,40}?)\s+\d/m);
                if (cityMatch?.[1]) {
                    city = cityMatch[1].trim();
                    // Clean up: remove trailing common words
                    city = city.replace(/\s+(CITY|DISTRICT|TOWN|NAGAR|BLOCK)$/i, '');
                    if (city.length < 2) city = null;
                }

                // Try to find state from the page text
                if (!state) {
                    state = this.extractState(text);
                }

                if (city) break; // Found what we need
            }

            doc.destroy();
        } catch (err: any) {
            this.logger.debug(`PDF parse error for ${documentUrl}: ${err.message}`);
        }

        return { city, state };
    }

    /**
     * Extract city name from the PDF by searching for known Indian city names.
     * Falls back to searching for state names if no city is found.
     * Returns city, state, and address.
     */
    async extractCityFromPdf(documentUrl: string): Promise<{ city: string | null; state: string | null; address: string | null }> {
        let city: string | null = null;
        let state: string | null = null;

        try {
            const pdfBuffer = await this.downloadPdfBuffer(documentUrl);

            if (pdfBuffer.length < 5 || pdfBuffer.slice(0, 4).toString() !== '%PDF') {
                return { city, state, address: null };
            }

            const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
            const data = new Uint8Array(pdfBuffer);
            const doc = await pdfjsLib.getDocument({ data }).promise;

            // Get all city names sorted by length (longest first to match "New Delhi" before "Delhi")
            const cityMap = this.getCityStateMap();
            // Skip ambiguous city names that are common English/Hindi words
            const allCities = Object.keys(cityMap)
                .filter(c => !AMBIGUOUS_LOCATION_NAMES.has(c))
                .sort((a, b) => b.length - a.length);

            // All Indian states/UTs sorted by length (longest first)
            const allStates = this.getStatesList().sort((a, b) => b.length - a.length);

            const pagesToScan = Math.min(doc.numPages, 15);
            let consigneePageText: string | null = null;

            for (let i = 1; i <= pagesToScan; i++) {
                const page = await doc.getPage(i);
                const content = await page.getTextContent();

                // Build full page text
                let prevY: number | null = null;
                let text = '';
                for (const item of content.items as any[]) {
                    if (prevY !== null && Math.abs(item.transform[5] - prevY) > 5) {
                        text += ' ';
                    }
                    text += item.str;
                    prevY = item.transform[5];
                }

                const upperText = text.toUpperCase();

                // Only search on the consignee/address table page
                const hasAddress = /ADDRESS|पता/i.test(upperText);
                const hasConsignee = /CONSIGNEE|DELIVERY|QUANTITY|परेषित|डिलीवरी|मात्रा/i.test(upperText);
                if (!hasAddress || !hasConsignee) continue;

                consigneePageText = upperText;

                // Search for city names in the text
                for (const cityName of allCities) {
                    const pattern = new RegExp(`\\b${cityName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
                    if (pattern.test(upperText)) {
                        city = cityName.charAt(0).toUpperCase() + cityName.slice(1).toLowerCase();
                        city = city.replace(/\b\w/g, c => c.toUpperCase());
                        state = cityMap[cityName] || null;
                        break;
                    }
                }

                if (city) break;

                // Fallback: search for state names if no city found
                for (const stateName of allStates) {
                    const pattern = new RegExp(`\\b${stateName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
                    if (pattern.test(upperText)) {
                        state = stateName;
                        break;
                    }
                }

                if (state) break;
            }

            doc.destroy();
        } catch (err: any) {
            this.logger.debug(`PDF city extraction error for ${documentUrl}: ${err.message}`);
        }

        return { city, state, address: city || state };
    }

    private groupPdfItemsByLine(items: any[]): Array<{ y: number; items: Array<{ x: number; str: string }> }> {
        const lines: Array<{ y: number; items: Array<{ x: number; str: string }> }> = [];
        const threshold = 2.5;

        for (const it of items || []) {
            const str = String(it?.str ?? '').trim();
            if (!str) continue;
            const x = Number(it?.transform?.[4] ?? 0);
            const y = Number(it?.transform?.[5] ?? 0);

            let line = lines.find(l => Math.abs(l.y - y) <= threshold);
            if (!line) {
                line = { y, items: [] };
                lines.push(line);
            }
            line.items.push({ x, str });
        }

        lines.sort((a, b) => b.y - a.y);
        for (const l of lines) {
            l.items.sort((a, b) => a.x - b.x);
        }
        return lines;
    }

    private extractAddressFromConsigneeTable(
        lines: Array<{ y: number; items: Array<{ x: number; str: string }> }>,
    ): string | null {
        if (!lines?.length) return null;

        const containsHeader = (s: string) => /\b(consignee|reporting)\b|परेषित|रिपोर्टिंग/i.test(s);
        const containsAddressWord = (s: string) => /\baddress\b|पता/i.test(s);
        const containsDelivery = (s: string) => /delivery\s*schedule|delivery\s*to\s*start|डिलीवरी|मात्रा|quantity/i.test(s);

        // Find header line with Address column
        let headerLineIdx = -1;
        let addressX: number | null = null;

        for (let i = 0; i < Math.min(lines.length, 80); i++) {
            const lineText = lines[i].items.map(it => it.str).join(' ').replace(/\s+/g, ' ').trim();
            if (!containsAddressWord(lineText)) continue;

            // best effort: find x position of the word "Address" / "पता"
            const addrItem = lines[i].items.find(it => containsAddressWord(it.str));
            if (!addrItem) continue;

            // Prefer if same line also mentions consignee/reporting (table header)
            if (containsHeader(lineText) || containsDelivery(lineText) || lineText.length < 120) {
                headerLineIdx = i;
                addressX = addrItem.x;
                break;
            }
        }

        if (headerLineIdx === -1 || addressX === null) return null;

        // Collect items after header within an x-range around Address column
        const collected: string[] = [];
        const xMin = addressX - 40;
        const xMax = addressX + 180;

        for (let i = headerLineIdx + 1; i < Math.min(lines.length, headerLineIdx + 60); i++) {
            const lineText = lines[i].items.map(it => it.str).join(' ').replace(/\s+/g, ' ').trim();
            if (containsDelivery(lineText)) break;
            if (containsHeader(lineText) && collected.length > 0) break;

            const parts = lines[i].items
                .filter(it => it.x >= xMin && it.x <= xMax)
                .map(it => it.str)
                .join(' ')
                .replace(/\s+/g, ' ')
                .trim();

            if (!parts) continue;
            if (containsAddressWord(parts)) continue;

            // Skip mostly-numeric lines (likely quantity/days)
            const digits = (parts.match(/\d/g) || []).length;
            if (digits > Math.max(6, parts.length * 0.6)) continue;

            collected.push(parts);
            if (collected.join(' ').length > 60) {
                // address usually captured quickly; avoid over-collecting
                break;
            }
        }

        const candidate = collected.join(' ').replace(/\s+/g, ' ').trim();
        if (!candidate || candidate.length < 10) return null;
        return candidate;
    }

    /**
     * Comprehensive map of Indian cities/districts to their states.
     * Uses the imported data from indian-locations.ts (700+ entries).
     */
    private getCityStateMap(): Record<string, string> {
        return INDIAN_CITY_STATE_MAP;
    }

    /**
     * Map a city name to its state (best-effort)
     */
    private getStateFromCity(city: string): string | null {
        const cityStateMap = this.getCityStateMap();
        const normalized = city.toUpperCase().replace(/\s+CITY$/i, '').replace(/\s+CANTT$/i, ' CANTT').trim();
        return cityStateMap[normalized] || null;
    }

    private getStatesList(): string[] {
        return [
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
     * Delete expired/closed tenders from database
     * Tenders whose closing date has passed are no longer active on GeM
     */
    async deleteExpiredTenders(): Promise<number> {
        // Delete tenders where closing date has passed
        const result = await this.prisma.tender.deleteMany({
            where: {
                source: 'GEM',
                closingDate: { lt: new Date() },
            },
        });

        this.logger.log(`Deleted ${result.count} expired tenders from database`);
        return result.count;
    }
}
