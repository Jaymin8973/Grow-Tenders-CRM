import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { StorageService } from './storage.service';
import { JwtAuthGuard } from '../../common/guards';

@ApiTags('Storage')
@Controller('storage')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class StorageController {
    constructor(private readonly storageService: StorageService) { }

    @Post('upload')
    @ApiOperation({ summary: 'Upload a file' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: { type: 'string', format: 'binary' },
            },
        },
    })
    @UseInterceptors(FileInterceptor('file'))
    async uploadFile(@UploadedFile() file: Express.Multer.File) {
        return this.storageService.uploadFile(file);
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
