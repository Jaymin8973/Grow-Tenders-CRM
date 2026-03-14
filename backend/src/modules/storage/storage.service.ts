import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { randomUUID } from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';
import { createWriteStream, existsSync, mkdirSync } from 'fs';

@Injectable()
export class StorageService {
    private readonly logger = new Logger(StorageService.name);
    private uploadDir: string;

    constructor(
        private configService: ConfigService,
        private prisma: PrismaService,
    ) {
        this.uploadDir = this.configService.get<string>('UPLOAD_DIR') || '/app/uploads';
        
        // Ensure upload directory exists
        if (!existsSync(this.uploadDir)) {
            mkdirSync(this.uploadDir, { recursive: true });
        }
    }

    async uploadFile(file: Express.Multer.File): Promise<{ key: string; url: string }> {
        const ext = path.extname(file.originalname);
        const key = `${randomUUID()}${ext}`;
        const filePath = path.join(this.uploadDir, key);

        await fs.writeFile(filePath, file.buffer);

        const baseUrl = this.configService.get<string>('BASE_URL') || 'http://localhost:3001';
        const url = `${baseUrl}/uploads/${key}`;

        return { key, url };
    }

    async getFilePath(key: string): Promise<string> {
        const filePath = path.join(this.uploadDir, key);
        
        try {
            await fs.access(filePath);
            return filePath;
        } catch {
            throw new NotFoundException(`File not found: ${key}`);
        }
    }

    async deleteFile(key: string): Promise<void> {
        const filePath = path.join(this.uploadDir, key);
        
        try {
            await fs.unlink(filePath);
        } catch (error) {
            this.logger.warn(`Failed to delete file ${key}: ${error.message}`);
        }
    }

    async createAttachment(data: {
        filename: string;
        originalName: string;
        mimeType: string;
        size: number;
        url: string;
        s3Key: string;
        leadId?: string;
        customerId?: string;
        dealId?: string;
        tenderId?: string;
    }) {
        return this.prisma.attachment.create({ data });
    }

    async getAttachments(filter: {
        leadId?: string;
        customerId?: string;
        dealId?: string;
        tenderId?: string;
    }) {
        return this.prisma.attachment.findMany({
            where: filter,
            orderBy: { createdAt: 'desc' },
        });
    }

    async deleteAttachment(id: string) {
        const attachment = await this.prisma.attachment.findUnique({ where: { id } });

        if (attachment?.s3Key) {
            await this.deleteFile(attachment.s3Key);
        }

        await this.prisma.attachment.delete({ where: { id } });
        return { message: 'Attachment deleted successfully' };
    }
}
