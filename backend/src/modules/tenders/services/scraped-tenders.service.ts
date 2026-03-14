import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import * as PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';
import { INDIAN_CITY_STATE_MAP } from '../data/indian-locations';

@Injectable()
export class ScrapedTendersService {
    constructor(private prisma: PrismaService) { }

    private normalizeCityKey(input: string): string {
        return String(input || '')
            .toUpperCase()
            .replace(/\s+CITY$/i, '')
            .replace(/\s+CANTT$/i, ' CANTT')
            .replace(/[^A-Z\s]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    private isKnownCity(city: string): boolean {
        const key = this.normalizeCityKey(city);
        if (!key) return false;
        return Boolean(INDIAN_CITY_STATE_MAP[key]);
    }

    private getHeaderLogoBuffer(): Buffer | null {
        const candidates = [
            path.join(process.cwd(), 'src/assets/logo.jpg'),
            path.join(__dirname, '../../../assets/logo.jpg'),
        ];

        for (const p of candidates) {
            try {
                if (fs.existsSync(p)) return fs.readFileSync(p);
            } catch {
                // ignore
            }
        }

        return null;
    }

    private getWatermarkLogoBuffer(): Buffer | null {
        const candidates = [
            path.join(process.cwd(), 'src/assets/Logo-invoice.png'),
            path.join(process.cwd(), 'src/assets/logo-invoice.png'),
            path.join(process.cwd(), 'src/assets/logo.jpg'),
            path.join(__dirname, '../../../assets/Logo-invoice.png'),
            path.join(__dirname, '../../../assets/logo-invoice.png'),
        ];

        for (const p of candidates) {
            try {
                if (fs.existsSync(p)) return fs.readFileSync(p);
            } catch {
                // ignore
            }
        }

        return null;
    }

    async findAll(filters?: {
        status?: string;
        state?: string;
        city?: string;
        search?: string;
        category?: string;
        startDateFrom?: string;
        startDateTo?: string;
        endDateFrom?: string;
        endDateTo?: string;
        page?: number;
        limit?: number;
    }) {
        const page = filters?.page || 1;
        const limit = filters?.limit || 20;
        const skip = (page - 1) * limit;

        const where: Record<string, any> = { source: 'GEM' };

        if (filters?.status) {
            // Map frontend status to backend status
            if (filters.status === 'ACTIVE') where.status = 'PUBLISHED';
            else if (filters.status === 'CLOSED') where.status = 'CLOSED';
            // EXPIRED logic handled by date usually, or CLOSED
        }
        if (filters?.state) {
            where.state = { contains: filters.state, mode: 'insensitive' };
        }
        if (filters?.city) {
            where.city = { contains: filters.city, mode: 'insensitive' };
        }
        if (filters?.category) {
            const escapeRegex = (input: string) => input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

            const category = filters.category.trim();
            if (category) {
                where.categoryName = { contains: escapeRegex(category), mode: 'insensitive' };
            }
        }
        if (filters?.search) {
            const escapeRegex = (input: string) => input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

            const rawSearch = filters.search.trim();
            const escapedSearch = escapeRegex(rawSearch);
            const relaxedSearch = rawSearch
                .replace(/[()\[\]{}.+*?^$|\\]/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
            const escapedRelaxedSearch = relaxedSearch ? escapeRegex(relaxedSearch) : '';

            where.OR = [
                { referenceId: { contains: escapedSearch, mode: 'insensitive' } },
                { title: { contains: escapedSearch, mode: 'insensitive' } },
                { description: { contains: escapedSearch, mode: 'insensitive' } },
            ];

            if (escapedRelaxedSearch && relaxedSearch !== rawSearch) {
                where.OR.push(
                    { referenceId: { contains: escapedRelaxedSearch, mode: 'insensitive' } },
                    { title: { contains: escapedRelaxedSearch, mode: 'insensitive' } },
                    { description: { contains: escapedRelaxedSearch, mode: 'insensitive' } },
                );
            }
        }

        const buildDateRange = (from?: string, to?: string) => {
            const range: Record<string, Date> = {};
            if (from) {
                const d = new Date(from);
                if (!Number.isNaN(d.getTime())) range.gte = d;
            }
            if (to) {
                const d = new Date(to);
                if (!Number.isNaN(d.getTime())) range.lte = d;
            }
            return Object.keys(range).length ? range : undefined;
        };

        const publishDateRange = buildDateRange(filters?.startDateFrom, filters?.startDateTo);
        if (publishDateRange) where.publishDate = publishDateRange;

        const closingDateRange = buildDateRange(filters?.endDateFrom, filters?.endDateTo);
        if (closingDateRange) where.closingDate = closingDateRange;

        const [data, total] = await Promise.all([
            this.prisma.tender.findMany({
                where,
                orderBy: { publishDate: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.tender.count({ where }),
        ]);

        // Map to frontend expected format
        const mappedData = data.map(t => ({
            id: t.id,
            bidNo: t.referenceId,
            title: t.title,
            category: t.categoryName,
            department: (t as any).department ?? t.description,
            state: t.state,
            city: t.city,
            quantity: '', // Not in new schema yet, optional
            startDate: t.publishDate,
            endDate: t.closingDate,
            status: t.status === 'PUBLISHED' ? 'ACTIVE' : t.status,
            source: 'GeM',
            sourceUrl: t.tenderUrl,
            createdAt: t.createdAt,
        }));

        return {
            data: mappedData,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async findOne(id: string) {
        const tender = await this.prisma.tender.findUnique({
            where: { id },
        });

        if (!tender) {
            throw new NotFoundException('Tender not found');
        }

        // Map
        return {
            id: tender.id,
            bidNo: tender.referenceId,
            title: tender.title,
            category: tender.categoryName,
            department: (tender as any).department ?? null,
            state: tender.state,
            city: tender.city,
            startDate: tender.publishDate,
            endDate: tender.closingDate,
            quantity: '',
            status: tender.status === 'PUBLISHED' ? 'ACTIVE' : tender.status,
            source: 'GeM',
            sourceUrl: tender.tenderUrl,
            createdAt: tender.createdAt,
        };
    }

    async getStats() {
        const [total, active, expiringSoon] = await Promise.all([
            this.prisma.tender.count({ where: { source: 'GEM' } }),
            this.prisma.tender.count({
                where: { source: 'GEM', status: 'PUBLISHED' },
            }),
            this.prisma.tender.count({
                where: {
                    source: 'GEM',
                    status: 'PUBLISHED',
                    closingDate: {
                        gte: new Date(),
                        lte: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
                    },
                },
            }),
        ]);

        return { total, active, expiringSoon };
    }

    async getStates(): Promise<string[]> {
        const tenders = await this.prisma.tender.findMany({
            where: { source: 'GEM', state: { not: null } },
            select: { state: true },
            distinct: ['state'],
        });

        return tenders.map(t => t.state!).filter(Boolean).sort();
    }

    async getCities(states: string[]): Promise<string[]> {
        const tenders = await this.prisma.tender.findMany({
            where: { 
                source: 'GEM', 
                state: { in: states }, 
                city: { not: null } 
            },
            select: { city: true },
            distinct: ['city'],
        });

        return tenders
            .map(t => t.city!)
            .filter(Boolean)
            .filter(c => this.isKnownCity(c))
            .sort();
    }

    async getCategories(): Promise<string[]> {
        const tenders = await this.prisma.tender.findMany({
            where: { source: 'GEM', categoryName: { not: null } },
            select: { categoryName: true },
            distinct: ['categoryName'],
        });

        return tenders.map(t => t.categoryName!).filter(Boolean).sort();
    }

    async getCategoriesPaginated(params?: {
        search?: string;
        page?: number;
        limit?: number;
    }) {
        const page = params?.page || 1;
        const limit = params?.limit || 20;
        const skip = (page - 1) * limit;

        const escapeRegex = (input: string) => input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        const match: Record<string, any> = {
            source: 'GEM',
            categoryName: { $type: 'string' },
        };

        const search = (params?.search || '').trim();
        if (search) {
            match.categoryName = {
                $type: 'string',
                $regex: escapeRegex(search),
                $options: 'i',
            };
        }

        const cmd = {
            aggregate: 'tenders',
            pipeline: [
                { $match: match },
                { $group: { _id: '$categoryName' } },
                { $sort: { _id: 1 } },
                {
                    $facet: {
                        data: [{ $skip: skip }, { $limit: limit }],
                        meta: [{ $count: 'total' }],
                    },
                },
            ],
            cursor: {},
        } as const;

        const result = (await this.prisma.$runCommandRaw(cmd)) as any;
        const firstBatch = result?.cursor?.firstBatch;
        const facet = Array.isArray(firstBatch) ? firstBatch[0] : undefined;
        const dataRows = facet?.data ?? [];
        const metaRows = facet?.meta ?? [];
        const total = metaRows?.[0]?.total ?? 0;

        const categories = (dataRows as Array<{ _id: string }>).map((r) => r._id).filter(Boolean);

        return {
            data: categories,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async generatePdf(id: string): Promise<Buffer> {
        const tender = await this.findOne(id);

        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ margin: 48, size: 'A4' });

            const stream = new PassThrough();
            const chunks: Buffer[] = [];

            stream.on('data', (chunk: Buffer) => chunks.push(chunk));
            stream.on('end', () => resolve(Buffer.concat(chunks)));
            stream.on('error', reject);
            doc.on('error', reject);

            doc.pipe(stream);

            const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
            const leftX = doc.page.margins.left;

            // Top center logo
            const headerLogo = this.getHeaderLogoBuffer();
            if (headerLogo) {
                try {
                    const logoMaxWidth = Math.min(pageWidth * 1, 400);
                    const logoMaxHeight = 90;
                    const logoX = doc.page.width / 2 - logoMaxWidth / 2;
                    const logoY = doc.page.margins.top - 10;
                    doc.image(headerLogo, logoX, Math.max(18, logoY), {
                        fit: [logoMaxWidth, logoMaxHeight],
                        align: 'center',
                        valign: 'center',
                    });
                    doc.moveDown(3);
                } catch {
                    // ignore header logo failures
                }
            }

            // Watermark
            const logo = this.getWatermarkLogoBuffer();
            if (logo) {
                try {
                    const markSize = Math.min(pageWidth * 0.6, 320);
                    const markX = doc.page.width / 2 - markSize / 2;
                    const markY = doc.page.height / 2 - markSize / 2;
                    doc.save();
                    doc.opacity(0.08);
                    doc.image(logo, markX, markY, { fit: [markSize, markSize], align: 'center', valign: 'center' });
                    doc.restore();
                } catch {
                    // ignore watermark failures
                }
            }

            const formatDateTime = (value?: Date | string | null) => {
                if (!value) return 'N/A';
                const d = value instanceof Date ? value : new Date(value);
                if (Number.isNaN(d.getTime())) return 'N/A';
                return d.toLocaleString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                });
            };

            const kvRow = (label: string, value: string, opts?: { width?: number }) => {
                const width = opts?.width ?? pageWidth;
                const labelWidth = 110;
                const valueWidth = Math.max(0, width - labelWidth);

                const y = doc.y;
                doc.font('Helvetica-Bold').fontSize(10).fillColor('#111827').text(label, leftX, y, {
                    width: labelWidth,
                    continued: false,
                });
                doc.font('Helvetica').fontSize(10).fillColor('#111827').text(value || 'N/A', leftX + labelWidth, y, {
                    width: valueWidth,
                });
                doc.moveDown(0.4);
            };

            // Header block
            doc.fillColor('#111827').font('Helvetica-Bold').fontSize(18).text('Tender Details', { align: 'left' });
            doc.moveDown(0.2);
            doc.font('Helvetica').fontSize(10).fillColor('#6B7280').text('Generated tender summary PDF', { align: 'left' });
            doc.moveDown(0.6);
            doc.moveTo(leftX, doc.y).lineTo(leftX + pageWidth, doc.y).strokeColor('#E5E7EB').stroke();
            doc.moveDown(0.8);

            // Tender summary (title)
            doc.font('Helvetica-Bold').fontSize(13).fillColor('#111827').text(tender.title || 'N/A', {
                width: pageWidth,
            });
            doc.moveDown(0.6);

            // Two-column block
            const colGap = 20;
            const colWidth = (pageWidth - colGap) / 2;
            const startY = doc.y;

            // Left column
            doc.y = startY;
            kvRow('Bid No', tender.bidNo || 'N/A', { width: colWidth });
            kvRow('Status', tender.status || 'N/A', { width: colWidth });
            if (tender.state) kvRow('State', tender.state, { width: colWidth });
            if (tender.category) kvRow('Category', tender.category, { width: colWidth });
            const leftEndY = doc.y;

            // Right column
            doc.y = startY;
            const rightX = leftX + colWidth + colGap;
            const yRight = doc.y;
            const kvRowAt = (x: number, label: string, value: string) => {
                const labelWidth = 110;
                const valueWidth = Math.max(0, colWidth - labelWidth);
                const y = doc.y;
                doc.font('Helvetica-Bold').fontSize(10).fillColor('#111827').text(label, x, y, { width: labelWidth });
                doc.font('Helvetica').fontSize(10).fillColor('#111827').text(value || 'N/A', x + labelWidth, y, { width: valueWidth });
                doc.moveDown(0.4);
            };
            doc.y = yRight;
            kvRowAt(rightX, 'Start', formatDateTime(tender.startDate));
            kvRowAt(rightX, 'End', formatDateTime(tender.endDate));
            if (tender.quantity) kvRowAt(rightX, 'Quantity', tender.quantity);
            kvRowAt(rightX, 'Source', tender.source || 'N/A');
            const rightEndY = doc.y;

            // Move below both columns
            doc.x = leftX;
            doc.y = Math.max(leftEndY, rightEndY) + 10;
            doc.moveDown(0.6);

            // Department / details
            doc.font('Helvetica-Bold').fontSize(11).fillColor('#111827').text('Department / Buyer', { width: pageWidth });
            doc.moveDown(0.3);
            doc.font('Helvetica').fontSize(10).fillColor('#111827').text(tender.department || 'N/A', {
                width: pageWidth,
            });
            doc.moveDown(0.8);

            if (tender.sourceUrl) {
                doc.font('Helvetica-Bold').fontSize(11).fillColor('#111827').text('GeM Portal Link', { width: pageWidth });
                doc.moveDown(0.3);
                doc.font('Helvetica').fontSize(10).fillColor('#2563EB').text(tender.sourceUrl, {
                    link: tender.sourceUrl,
                    underline: true,
                    width: pageWidth,
                });
                doc.fillColor('#111827');
            }

            doc.moveDown(2);

            // Footer
            doc.strokeColor('#E5E7EB').moveTo(leftX, doc.page.height - 70).lineTo(leftX + pageWidth, doc.page.height - 70).stroke();
            doc.fillColor('#6B7280').fontSize(9).text(
                `Generated on ${new Date().toLocaleString('en-IN')}`,
                leftX,
                doc.page.height - 55,
                { width: pageWidth, align: 'center' }
            );

            doc.end();
        });
    }

    /**
     * Download the original GeM bid document PDF by proxying through the backend.
     * Some GeM bids (expired/removed) return Content-Length: 0.
     */
    async downloadGemDocument(id: string): Promise<{ buffer: Buffer; bidNo: string }> {
        const tender = await this.findOne(id);

        if (!tender.sourceUrl) {
            throw new NotFoundException('No GeM document URL available for this tender');
        }

        const buffer = await this.fetchPdfFromGem(tender.sourceUrl);

        if (!buffer || buffer.length < 100) {
            throw new NotFoundException(
                'This tender document is no longer available on GeM portal. The bid may have expired or been removed.',
            );
        }

        // Validate it's actually a PDF
        if (buffer.slice(0, 5).toString() !== '%PDF-') {
            throw new NotFoundException(
                'GeM returned an invalid response. The document may no longer be available.',
            );
        }

        return { buffer, bidNo: tender.bidNo || 'unknown' };
    }

    /**
     * Fetch a PDF from a URL with proper headers, following redirects.
     */
    private fetchPdfFromGem(url: string): Promise<Buffer> {
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
                    timeout: 15000,
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
                        resolve(buf);
                    });
                    res.on('error', reject);
                }).on('error', reject);
            };
            makeRequest(url);
        });
    }

    async getScrapeLogs(page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            this.prisma.tenderScrapeJob.findMany({
                orderBy: { startTime: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.tenderScrapeJob.count(),
        ]);

        return {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
}
