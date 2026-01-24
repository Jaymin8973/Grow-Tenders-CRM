import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EmailService } from './email.service';
import { JwtAuthGuard, RolesGuard } from '@/common/guards';
import { Roles } from '@/common/decorators';
import { SendEmailDto, CreateEmailTemplateDto, UpdateEmailTemplateDto } from './dto/email.dto';

@ApiTags('Email')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('email')
export class EmailController {
    constructor(private emailService: EmailService) { }

    @Post('send')
    @ApiOperation({ summary: 'Send an email' })
    async sendEmail(@Body() dto: SendEmailDto) {
        const result = await this.emailService.sendEmail({
            to: dto.to,
            cc: dto.cc?.join(', '),
            bcc: dto.bcc?.join(', '),
            subject: dto.subject,
            html: dto.body,
            leadId: dto.leadId,
            customerId: dto.customerId,
            invoiceId: dto.invoiceId,
            tenderId: dto.tenderId,
        });
        return { success: result };
    }

    @Post('send-with-template')
    @ApiOperation({ summary: 'Send email using template' })
    async sendWithTemplate(
        @Body() body: {
            templateName: string;
            to: string;
            variables: Record<string, string>;
            leadId?: string;
            customerId?: string;
            invoiceId?: string;
            tenderId?: string;
        },
    ) {
        return this.emailService.sendEmailWithTemplate(
            body.templateName,
            body.to,
            body.variables,
            {
                leadId: body.leadId,
                customerId: body.customerId,
                invoiceId: body.invoiceId,
                tenderId: body.tenderId,
            },
        );
    }

    // Templates (Super Admin only)
    @Post('templates')
    @Roles('SUPER_ADMIN')
    @UseGuards(RolesGuard)
    @ApiOperation({ summary: 'Create email template' })
    createTemplate(@Body() dto: CreateEmailTemplateDto) {
        return this.emailService.createTemplate(dto);
    }

    @Get('templates')
    @ApiOperation({ summary: 'Get all email templates' })
    getTemplates(@Query('type') type?: string) {
        return this.emailService.getTemplates(type);
    }

    @Get('templates/:id')
    @ApiOperation({ summary: 'Get email template by ID' })
    getTemplate(@Param('id') id: string) {
        return this.emailService.getTemplate(id);
    }

    @Put('templates/:id')
    @Roles('SUPER_ADMIN')
    @UseGuards(RolesGuard)
    @ApiOperation({ summary: 'Update email template' })
    updateTemplate(@Param('id') id: string, @Body() dto: UpdateEmailTemplateDto) {
        return this.emailService.updateTemplate(id, dto);
    }

    @Delete('templates/:id')
    @Roles('SUPER_ADMIN')
    @UseGuards(RolesGuard)
    @ApiOperation({ summary: 'Delete email template' })
    deleteTemplate(@Param('id') id: string) {
        return this.emailService.deleteTemplate(id);
    }

    // Email Logs
    @Get('logs')
    @ApiOperation({ summary: 'Get email logs' })
    getEmailLogs(
        @Query('customerId') customerId?: string,
        @Query('leadId') leadId?: string,
        @Query('invoiceId') invoiceId?: string,
        @Query('tenderId') tenderId?: string,
        @Query('limit') limit?: string,
    ) {
        return this.emailService.getEmailLogs({
            customerId,
            leadId,
            invoiceId,
            tenderId,
            limit: limit ? parseInt(limit) : undefined,
        });
    }

    // Tender bulk email
    @Post('tender/send-to-subscribers')
    @Roles('SUPER_ADMIN', 'MANAGER')
    @UseGuards(RolesGuard)
    @ApiOperation({ summary: 'Send tender email to all subscribers' })
    sendTenderToSubscribers(
        @Body() body: { tenderId: string; categoryId: string },
    ) {
        return this.emailService.sendTenderEmailsToSubscribers(body.tenderId, body.categoryId);
    }
}
