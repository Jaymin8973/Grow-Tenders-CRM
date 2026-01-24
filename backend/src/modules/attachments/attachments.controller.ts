import {
    Controller,
    Get,
    Post,
    Delete,
    Param,
    Query,
    UseGuards,
    UseInterceptors,
    UploadedFile,
    Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { Response } from 'express';
import { AttachmentsService } from './attachments.service';
import { JwtAuthGuard } from '@/common/guards';
import * as fs from 'fs';

@ApiTags('Attachments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('attachments')
export class AttachmentsController {
    constructor(private attachmentsService: AttachmentsService) { }

    @Post('upload')
    @ApiOperation({ summary: 'Upload an attachment' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: { type: 'string', format: 'binary' },
                leadId: { type: 'string' },
                customerId: { type: 'string' },
                dealId: { type: 'string' },
                tenderId: { type: 'string' },
            },
        },
    })
    @UseInterceptors(FileInterceptor('file'))
    upload(
        @UploadedFile() file: Express.Multer.File,
        @Query('leadId') leadId?: string,
        @Query('customerId') customerId?: string,
        @Query('dealId') dealId?: string,
        @Query('tenderId') tenderId?: string,
    ) {
        return this.attachmentsService.upload(file, {
            leadId,
            customerId,
            dealId,
            tenderId,
        });
    }

    @Get('lead/:leadId')
    @ApiOperation({ summary: 'Get attachments by lead' })
    findByLead(@Param('leadId') leadId: string) {
        return this.attachmentsService.findByLead(leadId);
    }

    @Get('customer/:customerId')
    @ApiOperation({ summary: 'Get attachments by customer' })
    findByCustomer(@Param('customerId') customerId: string) {
        return this.attachmentsService.findByCustomer(customerId);
    }

    @Get('deal/:dealId')
    @ApiOperation({ summary: 'Get attachments by deal' })
    findByDeal(@Param('dealId') dealId: string) {
        return this.attachmentsService.findByDeal(dealId);
    }

    @Get('tender/:tenderId')
    @ApiOperation({ summary: 'Get attachments by tender' })
    findByTender(@Param('tenderId') tenderId: string) {
        return this.attachmentsService.findByTender(tenderId);
    }

    @Get(':id/download')
    @ApiOperation({ summary: 'Download an attachment' })
    async download(@Param('id') id: string, @Res() res: Response) {
        const filePath = await this.attachmentsService.getFilePath(id);
        const attachment = await this.attachmentsService['prisma'].attachment.findUnique({
            where: { id },
        });

        if (fs.existsSync(filePath)) {
            res.setHeader('Content-Disposition', `attachment; filename="${attachment?.originalName}"`);
            res.setHeader('Content-Type', attachment?.mimeType || 'application/octet-stream');
            fs.createReadStream(filePath).pipe(res);
        } else {
            res.status(404).json({ message: 'File not found' });
        }
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete an attachment' })
    remove(@Param('id') id: string) {
        return this.attachmentsService.remove(id);
    }
}
