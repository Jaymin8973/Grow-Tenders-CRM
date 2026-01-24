import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { StorageService } from './storage.service';
import { JwtAuthGuard } from '../../common/guards';

@ApiTags('Storage')
@Controller('storage')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class StorageController {
    constructor(private readonly storageService: StorageService) { }

    @Post('upload-url')
    @ApiOperation({ summary: 'Get signed upload URL' })
    getUploadUrl(@Body() body: { filename: string; contentType: string }) {
        return this.storageService.getUploadUrl(body.filename, body.contentType);
    }

    @Get('download-url')
    @ApiOperation({ summary: 'Get signed download URL' })
    getDownloadUrl(@Query('key') key: string) {
        return this.storageService.getDownloadUrl(key);
    }

    @Post('attachments')
    @ApiOperation({ summary: 'Create attachment record' })
    createAttachment(@Body() body: {
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
        return this.storageService.createAttachment(body);
    }

    @Get('attachments')
    @ApiOperation({ summary: 'Get attachments' })
    getAttachments(
        @Query('leadId') leadId?: string,
        @Query('customerId') customerId?: string,
        @Query('dealId') dealId?: string,
        @Query('tenderId') tenderId?: string,
    ) {
        return this.storageService.getAttachments({ leadId, customerId, dealId, tenderId });
    }

    @Delete('attachments/:id')
    @ApiOperation({ summary: 'Delete attachment' })
    deleteAttachment(@Param('id') id: string) {
        return this.storageService.deleteAttachment(id);
    }
}
