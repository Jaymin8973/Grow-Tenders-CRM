import { Controller, Post, UseGuards, Body } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('Scheduler')
@ApiBearerAuth()
@Controller('scheduler')
export class SchedulerController {
    constructor(
        private readonly schedulerService: SchedulerService,
        private readonly prisma: PrismaService,
    ) { }

    @Post('trigger-daily-alerts')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.SUPER_ADMIN)
    @ApiOperation({ summary: 'Manually trigger daily tender alerts email (Super Admin only)' })
    async triggerDailyAlerts() {
        await this.schedulerService.handleDailyTenderAlerts();
        return { message: 'Daily tender alerts triggered successfully' };
    }

    @Post('trigger-hourly-alerts')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.SUPER_ADMIN)
    @ApiOperation({ summary: 'Manually trigger hourly tender alerts email (Super Admin only)' })
    async triggerHourlyAlerts() {
        await this.schedulerService.handleHourlyTenderAlerts();
        return { message: 'Hourly tender alerts triggered successfully' };
    }

    @Post('test-email')
    @ApiOperation({ summary: 'Send a test tender alert email (for testing)' })
    async testEmail(@Body() body: { email: string }) {
        const testEmail = body.email || 'test@example.com';
        const latestTender = await this.prisma.tender.findFirst({
            orderBy: [{ publishDate: 'desc' }, { createdAt: 'desc' }],
            select: {
                id: true,
                title: true,
                referenceId: true,
                categoryName: true,
                state: true,
                city: true,
                department: true,
                publishDate: true,
                closingDate: true,
                description: true,
            },
        });

        const tenderId = latestTender?.id || 'test-id';
        const baseUrl = (process.env.WEBSITE_BASE_URL || 'https://grow-tender.com').replace(/\/$/, '');
        const viewUrl = `${baseUrl}/tender/${tenderId}`;
        const downloadUrl = `${baseUrl}/tenders/${tenderId}/download-pdf`;
        const formatDate = (date?: Date | null) => {
            if (!date) return 'Not specified';
            return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
        };
        const safeTitle = latestTender?.title || 'Sample Tender Title';
        const safeBidNo = latestTender?.referenceId || 'GEM/2024/B12345';
        const safeCategory = latestTender?.categoryName || 'General';
        const safeLocation = `${latestTender?.state || 'India'}${latestTender?.city ? ', ' + latestTender.city : ''}`;
        const safePublished = formatDate(latestTender?.publishDate);
        const safeDeadline = formatDate(latestTender?.closingDate);
        const safeDepartment = latestTender?.department || 'Not specified';
        const safeDescription = (latestTender?.description || 'No description available.').substring(0, 350);
        
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <meta http-equiv="X-UA-Compatible" content="IE=edge">
                <style>
                    @media only screen and (max-width: 600px) {
                        .container { width: 100% !important; padding: 12px !important; }
                        .btn { display: block !important; width: 100% !important; box-sizing: border-box !important; }
                        .btn + .btn { margin-top: 10px !important; }
                        .row { padding: 10px 12px !important; }
                        .h1 { font-size: 18px !important; }
                        .title { font-size: 16px !important; }
                    }
                </style>
            </head>
            <body style="margin:0; padding:0; background:#f2f4f7; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                <div class="container" style="max-width:600px; margin:0 auto; padding:16px;">
                    <div style="background:#ffffff; border:1px solid #e5e7eb; border-radius:14px; overflow:hidden;">
                        <div style="padding:16px 16px 12px 16px; background:#ffffff; border-bottom:1px solid #eef2f7;">
                            <div class="h1" style="font-size:20px; font-weight:700; color:#0f172a; line-height:1.2;">New Tender Alert</div>
                            <div style="margin-top:6px; font-size:12px; color:#64748b;">Grow Tender — Government Tender Updates</div>
                        </div>

                        <div style="padding:16px;">
                            <div style="font-size:14px; color:#334155; line-height:1.5;">Hi <strong style=\"color:#0f172a;\">Test User</strong>,</div>
                            <div style="margin-top:6px; font-size:13px; color:#64748b; line-height:1.5;">A new tender matching your preferences has been published.</div>

                            <div style="margin-top:14px; padding:14px; background:#f8fafc; border:1px solid #e5e7eb; border-radius:12px;">
                                <div class="title" style="font-size:16px; font-weight:700; color:#0f172a; line-height:1.35;">${safeTitle}</div>
                                <div style="margin-top:8px; font-size:12px; color:#64748b;">Bid No: <strong style=\"color:#0f172a;\">${safeBidNo}</strong></div>
                            </div>

                            <div style="margin-top:14px; border:1px solid #e5e7eb; border-radius:12px; overflow:hidden;">
                                <div class="row" style="padding:12px 14px; background:#ffffff; border-bottom:1px solid #eef2f7;">
                                    <div style="font-size:12px; color:#64748b;">Category</div>
                                    <div style="margin-top:3px; font-size:14px; color:#0f172a; font-weight:600;">${safeCategory}</div>
                                </div>
                                <div class="row" style="padding:12px 14px; background:#ffffff; border-bottom:1px solid #eef2f7;">
                                    <div style="font-size:12px; color:#64748b;">Location</div>
                                    <div style="margin-top:3px; font-size:14px; color:#0f172a; font-weight:600;">${safeLocation}</div>
                                </div>
                                <div class="row" style="padding:12px 14px; background:#ffffff; border-bottom:1px solid #eef2f7;">
                                    <div style="font-size:12px; color:#64748b;">Published</div>
                                    <div style="margin-top:3px; font-size:14px; color:#0f172a; font-weight:600;">${safePublished}</div>
                                </div>
                                <div class="row" style="padding:12px 14px; background:#ffffff; border-bottom:1px solid #eef2f7;">
                                    <div style="font-size:12px; color:#64748b;">Deadline</div>
                                    <div style="margin-top:3px; font-size:14px; color:#b91c1c; font-weight:700;">${safeDeadline}</div>
                                </div>
                                <div class="row" style="padding:12px 14px; background:#ffffff;">
                                    <div style="font-size:12px; color:#64748b;">Department</div>
                                    <div style="margin-top:3px; font-size:14px; color:#0f172a; font-weight:600;">${safeDepartment}</div>
                                </div>
                            </div>

                            <div style="margin-top:14px; padding:14px; background:#ffffff; border:1px solid #e5e7eb; border-radius:12px;">
                                <div style="font-size:12px; color:#64748b;">Description</div>
                                <div style="margin-top:6px; font-size:13px; color:#0f172a; line-height:1.55;">
                                    ${safeDescription}${latestTender?.description && latestTender.description.length > 350 ? '...' : ''}
                                </div>
                            </div>

                            <div style="margin-top:16px;">
                                <div style="text-align:center;">
                                    <a class="btn" href="${viewUrl}" style="display:block; width:100%; max-width:520px; margin:0 auto; text-align:center; background:#2563eb; color:#ffffff; padding:13px 14px; text-decoration:none; border-radius:12px; font-size:14px; font-weight:700;">View Details</a>
                                    <a class="btn" href="${downloadUrl}" style="display:block; width:100%; max-width:520px; margin:10px auto 0 auto; text-align:center; background:#059669; color:#ffffff; padding:13px 14px; text-decoration:none; border-radius:12px; font-size:14px; font-weight:700;">Download PDF</a>
                                </div>
                            </div>

                            <div style="margin-top:14px; font-size:11px; color:#64748b; line-height:1.5;">
                                Tip: Download the PDF to review complete requirements and submit your bid before the deadline.
                            </div>
                        </div>

                        <div style="padding:12px 16px; background:#ffffff; border-top:1px solid #eef2f7; text-align:center;">
                            <div style="font-size:11px; color:#94a3b8;">© 2026 Grow Tender • <a href=\"https://grow-tender.com\" style=\"color:#2563eb; text-decoration:none;\">grow-tender.com</a></div>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;

        await this.schedulerService.sendTestEmail(testEmail, html);
        return { message: `Test email sent to ${testEmail}` };
    }
}
