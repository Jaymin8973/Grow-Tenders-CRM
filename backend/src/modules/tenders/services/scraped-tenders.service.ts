import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ScrapedTenderStatus } from '@prisma/client';
import * as PDFDocument from 'pdfkit';

@Injectable()
export class ScrapedTendersService {
    constructor(private prisma: PrismaService) { }

    async findAll(filters?: {
        status?: ScrapedTenderStatus;
        state?: string;
        search?: string;
        category?: string;
        page?: number;
        limit?: number;
    }) {
        const page = filters?.page || 1;
        const limit = filters?.limit || 20;
        const skip = (page - 1) * limit;

        const where: any = {};

        if (filters?.status) {
            where.status = filters.status;
        }
        if (filters?.state) {
            where.state = { contains: filters.state, mode: 'insensitive' };
        }
        if (filters?.category) {
            where.category = { contains: filters.category, mode: 'insensitive' };
        }
        if (filters?.search) {
            where.OR = [
                { bidNo: { contains: filters.search, mode: 'insensitive' } },
                { title: { contains: filters.search, mode: 'insensitive' } },
                { department: { contains: filters.search, mode: 'insensitive' } },
            ];
        }

        const [data, total] = await Promise.all([
            this.prisma.scrapedTender.findMany({
                where,
                orderBy: { startDate: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.scrapedTender.count({ where }),
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

    async findOne(id: string) {
        const tender = await this.prisma.scrapedTender.findUnique({
            where: { id },
        });

        if (!tender) {
            throw new NotFoundException('Tender not found');
        }

        return tender;
    }

    async getStats() {
        const [total, active, expiringSoon] = await Promise.all([
            this.prisma.scrapedTender.count(),
            this.prisma.scrapedTender.count({
                where: { status: ScrapedTenderStatus.ACTIVE },
            }),
            this.prisma.scrapedTender.count({
                where: {
                    status: ScrapedTenderStatus.ACTIVE,
                    endDate: {
                        gte: new Date(),
                        lte: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
                    },
                },
            }),
        ]);

        return { total, active, expiringSoon };
    }

    async getStates(): Promise<string[]> {
        const tenders = await this.prisma.scrapedTender.findMany({
            where: { state: { not: null } },
            select: { state: true },
            distinct: ['state'],
        });

        return tenders.map(t => t.state!).filter(Boolean).sort();
    }

    async getCategories(): Promise<string[]> {
        const tenders = await this.prisma.scrapedTender.findMany({
            where: { category: { not: null } },
            select: { category: true },
            distinct: ['category'],
        });

        return tenders.map(t => t.category!).filter(Boolean).sort();
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
            doc.font('Helvetica').text(tender.bidNo);
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
}
