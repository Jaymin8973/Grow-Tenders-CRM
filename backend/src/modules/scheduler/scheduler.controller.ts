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
                tenderUrl: true,
            },
        });

        const tenderId = latestTender?.id || 'test-id';
        const baseUrl = (process.env.WEBSITE_BASE_URL || 'https://grow-tender.com').replace(/\/$/, '');
        const viewUrl = `${baseUrl}/tender/${tenderId}`;
        const downloadUrl = latestTender?.tenderUrl || `${baseUrl}/tenders/${tenderId}`;
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
                        .email-container { width: 100% !important; padding: 10px !important; }
                        .button-container { display: block !important; text-align: center !important; }
                        .button { display: block !important; width: 100% !important; margin: 10px 0 !important; box-sizing: border-box !important; }
                        .details-table td { display: block !important; width: 100% !important; padding: 8px 0 !important; border-bottom: 1px solid #e2e8f0 !important; }
                    }
                </style>
            </head>
            <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                <div class="email-container" style="max-width: 600px; margin: 0 auto; padding: 15px;">
                    <!-- Header -->
                    <div style="background: linear-gradient(135deg, #1a4f72 0%, #2563eb 100%); padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 600;"> New Tender Alert</h1>
                        <p style="color: #e0e7ff; margin: 8px 0 0 0; font-size: 13px;">Grow Tender - Your Gateway to Government Contracts</p>
                    </div>
                    
                    <!-- Main Content -->
                    <div style="background: #ffffff; padding: 20px; border: 1px solid #e2e8f0; border-top: none;">
                        <p style="margin: 0 0 15px 0; color: #64748b; font-size: 14px;">
                            Hi Test User,
                        </p>
                        <p style="margin: 0 0 20px 0; color: #334155; font-size: 15px;">
                            A new tender matching your preferences has been published:
                        </p>
                        
                        <!-- Tender Title -->
                        <div style="background: #f1f5f9; border-left: 4px solid #2563eb; padding: 12px 15px; margin-bottom: 20px; border-radius: 0 8px 8px 0;">
                            <h2 style="margin: 0; color: #1e293b; font-size: 16px; line-height: 1.4; font-weight: 600;">${safeTitle}</h2>
                        </div>
                        
                        <!-- Tender Details -->
                        <table class="details-table" style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
                            <tr>
                                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; width: 40%;"> Bid Number</td>
                                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #1e293b; font-weight: 500;">${safeBidNo}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;"> Category</td>
                                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #1e293b;">${safeCategory}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;"> Location</td>
                                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #1e293b;">${safeLocation}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;"> Published</td>
                                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #1e293b;">${safePublished}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;"> Deadline</td>
                                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #dc2626; font-weight: 600;">${safeDeadline}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px 0; color: #64748b;"> Department</td>
                                <td style="padding: 10px 0; color: #1e293b;">${safeDepartment}</td>
                            </tr>
                        </table>
                        
                        <!-- Description -->
                        <div style="margin-bottom: 20px;">
                            <h3 style="margin: 0 0 8px 0; color: #1e293b; font-size: 14px; font-weight: 600;"> Description</h3>
                            <p style="margin: 0; color: #64748b; font-size: 13px; line-height: 1.5; background: #f8fafc; padding: 12px; border-radius: 8px;">
                                ${safeDescription}${latestTender?.description && latestTender.description.length > 350 ? '...' : ''}
                            </p>
                        </div>
                        
                        <!-- Action Buttons -->
                        <div class="button-container" style="text-align: center; margin: 25px 0;">
                            <a href="${viewUrl}" class="button" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 14px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; margin: 5px; box-sizing: border-box;">
                                View Details
                            </a>
                            <a href="${downloadUrl}" class="button" style="display: inline-block; background-color: #059669; color: #ffffff; padding: 14px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; margin: 5px; box-sizing: border-box;">
                                Download PDF
                            </a>
                        </div>
                        
                        <!-- Quick Tip -->
                        <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 12px; margin-top: 20px;">
                            <p style="margin: 0; color: #1e40af; font-size: 12px;">
                                <strong>Tip:</strong> Download the PDF document to review complete tender requirements and submit your bid before the deadline.
                            </p>
                        </div>
                    </div>
                    
                    <!-- Footer -->
                    <div style="background: #f8fafc; padding: 15px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none; text-align: center;">
                        <p style="margin: 0 0 8px 0; color: #64748b; font-size: 11px;">
                            You're receiving this because you have an active subscription.
                        </p>
                        <p style="margin: 0; color: #94a3b8; font-size: 10px;">
                            2026 Grow Tender | <a href="https://grow-tender.com" style="color: #2563eb; text-decoration: none;">grow-tender.com</a>
                        </p>
                    </div>
                </div>
            </body>
            </html>
        `;

        await this.schedulerService.sendTestEmail(testEmail, html);
        return { message: `Test email sent to ${testEmail}` };
    }
}
