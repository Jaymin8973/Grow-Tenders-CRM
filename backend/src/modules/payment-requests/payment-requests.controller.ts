
import {
    Body,
    Controller,
    Get,
    Param,
    Patch,
    Post,
    Req,
    UploadedFile,
    UseGuards,
    UseInterceptors
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PaymentRequestsService } from './payment-requests.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Role, PaymentRequestStatus } from '@prisma/client';
// import { Roles } from ... (if you have Roles decorator)

@Controller('payment-requests')
@UseGuards(JwtAuthGuard)
export class PaymentRequestsController {
    constructor(private readonly service: PaymentRequestsService) { }

    @Post()
    @UseInterceptors(FileInterceptor('screenshot'))
    async create(@Req() req: any, @Body() body: any, @UploadedFile() file: Express.Multer.File) {
        return this.service.create(req.user.id, body, file);
    }

    @Get()
    async findAll(@Req() req: any) {
        // If Admin/Manager return all, else return my requests?
        // For now, let's have separate endpoints or check role
        if (req.user.role === Role.SUPER_ADMIN || req.user.role === Role.MANAGER) {
            return this.service.findAll();
        }
        return this.service.findMyRequests(req.user.id);
    }

    @Get('my')
    async findMy(@Req() req: any) {
        return this.service.findMyRequests(req.user.id);
    }

    @Patch(':id/status')
    async updateStatus(
        @Param('id') id: string,
        @Body() body: { status: PaymentRequestStatus, rejectionReason?: string },
        @Req() req: any
    ) {
        // Strict check for admin/manager could be added here
        return this.service.updateStatus(id, body.status as any, req.user.id, body.rejectionReason);
    }
}
