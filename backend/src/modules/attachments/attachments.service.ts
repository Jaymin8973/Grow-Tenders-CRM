import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';

@Injectable()
export class AttachmentsService {
    private uploadDir = path.join(process.cwd(), 'uploads');

    constructor(private prisma: PrismaService) {
        // Ensure upload directory exists
        if (!fs.existsSync(this.uploadDir)) {
            fs.mkdirSync(this.uploadDir, { recursive: true });
        }
    }

    async upload(
        file: Express.Multer.File,
        options?: {
            leadId?: string;
            customerId?: string;
            dealId?: string;
            tenderId?: string;
        },
    ) {
        const fileExtension = path.extname(file.originalname);
        const filename = `${randomUUID()}${fileExtension}`;
        const filePath = path.join(this.uploadDir, filename);

        // Save file to local storage
        fs.writeFileSync(filePath, file.buffer);

        // Create database record
        return this.prisma.attachment.create({
            data: {
                filename,
                originalName: file.originalname,
                mimeType: file.mimetype,
                size: file.size,
                url: `/uploads/${filename}`,
                leadId: options?.leadId,
                customerId: options?.customerId,

                tenderId: options?.tenderId,
            },
        });
    }

    async findByLead(leadId: string) {
        return this.prisma.attachment.findMany({
            where: { leadId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findByCustomer(customerId: string) {
        return this.prisma.attachment.findMany({
            where: { customerId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findByDeal(leadId: string) {
        return this.prisma.attachment.findMany({
            where: { leadId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findByTender(tenderId: string) {
        return this.prisma.attachment.findMany({
            where: { tenderId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async remove(id: string) {
        const attachment = await this.prisma.attachment.findUnique({
            where: { id },
        });

        if (!attachment) {
            throw new NotFoundException('Attachment not found');
        }

        // Delete file from storage
        const filePath = path.join(this.uploadDir, attachment.filename);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // Delete from database
        return this.prisma.attachment.delete({
            where: { id },
        });
    }

    async getFilePath(id: string) {
        const attachment = await this.prisma.attachment.findUnique({
            where: { id },
        });

        if (!attachment) {
            throw new NotFoundException('Attachment not found');
        }

        return path.join(this.uploadDir, attachment.filename);
    }
}
