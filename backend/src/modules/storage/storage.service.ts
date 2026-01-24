import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PrismaService } from '../../prisma/prisma.service';
import { randomUUID } from 'crypto';

@Injectable()
export class StorageService {
    private readonly logger = new Logger(StorageService.name);
    private s3Client: S3Client;
    private bucket: string;

    constructor(
        private configService: ConfigService,
        private prisma: PrismaService,
    ) {
        this.bucket = this.configService.get<string>('AWS_S3_BUCKET') || 'sales-crm-uploads';

        this.s3Client = new S3Client({
            region: this.configService.get<string>('AWS_REGION') || 'us-east-1',
            credentials: {
                accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID') || '',
                secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY') || '',
            },
        });
    }

    async getUploadUrl(filename: string, contentType: string): Promise<{ uploadUrl: string; key: string }> {
        const key = `uploads/${randomUUID()}/${filename}`;

        const command = new PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            ContentType: contentType,
        });

        const uploadUrl = await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });

        return { uploadUrl, key };
    }

    async getDownloadUrl(key: string): Promise<string> {
        const command = new GetObjectCommand({
            Bucket: this.bucket,
            Key: key,
        });

        return getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
    }

    async deleteFile(key: string): Promise<void> {
        const command = new DeleteObjectCommand({
            Bucket: this.bucket,
            Key: key,
        });

        await this.s3Client.send(command);
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
