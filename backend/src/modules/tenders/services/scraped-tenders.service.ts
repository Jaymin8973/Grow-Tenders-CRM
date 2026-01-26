import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import * as PDFDocument from 'pdfkit';

@Injectable()
export class ScrapedTendersService {
    constructor(private prisma: PrismaService) { }

    async findAll(filters?: {
        status?: string;
        state?: string;
        search?: string;
        category?: string;
        page?: number;
        limit?: number;
    }) {
        const page = filters?.page || 1;
        const limit = filters?.limit || 20;
        const skip = (page - 1) * limit;

        const where: any = { source: 'GEM' };

        if (filters?.status) {
            // Map frontend status to backend status
            if (filters.status === 'ACTIVE') where.status = 'PUBLISHED';
            else if (filters.status === 'CLOSED') where.status = 'CLOSED';
            // EXPIRED logic handled by date usually, or CLOSED
        }
        if (filters?.state) {
            where.state = { contains: filters.state, mode: 'insensitive' };
        }
        if (filters?.category) {
            where.categoryName = { contains: filters.category, mode: 'insensitive' };
        }
        if (filters?.search) {
            where.OR = [
                { referenceId: { contains: filters.search, mode: 'insensitive' } },
                { title: { contains: filters.search, mode: 'insensitive' } },
                { description: { contains: filters.search, mode: 'insensitive' } },
            ];
        }

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
            department: t.description,
            state: t.state,
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
            department: tender.description,
            state: tender.state,
            quantity: '',
            startDate: tender.publishDate,
            endDate: tender.closingDate,
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

    async getCategories(): Promise<string[]> {
        const tenders = await this.prisma.tender.findMany({
            where: { source: 'GEM', categoryName: { not: null } },
            select: { categoryName: true },
            distinct: ['categoryName'],
        });

        return tenders.map(t => t.categoryName!).filter(Boolean).sort();
    }

    async generatePdf(id: string): Promise<Buffer> {
        const tender = await this.findOne(id);

        return new Promise((resolve, reject) => {
            const chunks: Buffer[] = [];
            const doc = new PDFDocument({ margin: 50 });

            doc.on('data', (chunk: Buffer) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            // Header
            doc.fontSize(20).font('Helvetica-Bold').text('Tender Details', { align: 'center' });
            doc.moveDown();

            // Divider
            doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
            doc.moveDown();

            // Tender Info
            doc.fontSize(12).font('Helvetica-Bold').text('Bid Number: ', { continued: true });
            doc.font('Helvetica').text(tender.bidNo || 'N/A');
            doc.moveDown(0.5);

            doc.font('Helvetica-Bold').text('Title: ', { continued: true });
            doc.font('Helvetica').text(tender.title || 'N/A');
            doc.moveDown(0.5);

            doc.font('Helvetica-Bold').text('Department: ', { continued: true });
            doc.font('Helvetica').text(tender.department || 'N/A');
            doc.moveDown(0.5);

            if (tender.state) {
                doc.font('Helvetica-Bold').text('State: ', { continued: true });
                doc.font('Helvetica').text(tender.state);
                doc.moveDown(0.5);
            }

            if (tender.quantity) {
                doc.font('Helvetica-Bold').text('Quantity: ', { continued: true });
                doc.font('Helvetica').text(tender.quantity);
                doc.moveDown(0.5);
            }

            doc.moveDown();

            // Dates
            doc.font('Helvetica-Bold').text('Important Dates');
            doc.moveTo(50, doc.y + 5).lineTo(200, doc.y + 5).stroke();
            doc.moveDown(0.5);

            if (tender.startDate) {
                doc.font('Helvetica-Bold').text('Start Date: ', { continued: true });
                doc.font('Helvetica').text(new Date(tender.startDate).toLocaleString('en-IN'));
                doc.moveDown(0.5);
            }

            if (tender.endDate) {
                doc.font('Helvetica-Bold').text('End Date: ', { continued: true });
                doc.font('Helvetica').text(new Date(tender.endDate).toLocaleString('en-IN'));
                doc.moveDown(0.5);
            }

            doc.moveDown();

            // Status
            doc.font('Helvetica-Bold').text('Status: ', { continued: true });
            doc.font('Helvetica').text(tender.status);
            doc.moveDown();

            // Source
            if (tender.sourceUrl) {
                doc.font('Helvetica-Bold').text('GeM Portal Link: ');
                doc.font('Helvetica').fillColor('blue').text(tender.sourceUrl, { link: tender.sourceUrl });
            }

            doc.moveDown(2);

            // Footer
            doc.fillColor('gray').fontSize(10).text(
                `Generated on ${new Date().toLocaleString('en-IN')}`,
                { align: 'center' }
            );

            doc.end();
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
