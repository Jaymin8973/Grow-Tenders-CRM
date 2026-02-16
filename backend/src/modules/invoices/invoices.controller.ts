import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    Query,
    Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Role, InvoiceStatus } from '@prisma/client';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { UpdateInvoiceStatusDto } from './dto/update-status.dto';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { Roles, CurrentUser } from '../../common/decorators';

@ApiTags('Invoices')
@Controller('invoices')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class InvoicesController {
    constructor(private readonly invoicesService: InvoicesService) { }

    @Post()
    @Roles(Role.SUPER_ADMIN, Role.MANAGER)
    @ApiOperation({ summary: 'Create a new invoice (Super Admin & Manager)' })
    @ApiResponse({ status: 201, description: 'Invoice created successfully' })
    create(@Body() createInvoiceDto: CreateInvoiceDto, @CurrentUser('id') userId: string) {
        return this.invoicesService.create(createInvoiceDto, userId);
    }



    @Get()
    @Roles(Role.SUPER_ADMIN, Role.MANAGER)
    @ApiOperation({ summary: 'Get all invoices' })
    @ApiQuery({ name: 'status', required: false, enum: InvoiceStatus })
    @ApiQuery({ name: 'customerId', required: false })
    @ApiQuery({ name: 'search', required: false })
    findAll(
        @Query('status') status?: InvoiceStatus,
        @Query('customerId') customerId?: string,
        @Query('search') search?: string,
    ) {
        return this.invoicesService.findAll({ status, customerId, search });
    }

    @Get('stats')
    @Roles(Role.SUPER_ADMIN)
    @ApiOperation({ summary: 'Get invoice statistics' })
    getStats() {
        return this.invoicesService.getInvoiceStats();
    }

    @Get(':id')
    @Roles(Role.SUPER_ADMIN, Role.MANAGER)
    @ApiOperation({ summary: 'Get invoice by ID' })
    findOne(@Param('id') id: string) {
        return this.invoicesService.findOne(id);
    }

    @Get(':id/pdf')
    @Roles(Role.SUPER_ADMIN, Role.MANAGER)
    @ApiOperation({ summary: 'Generate PDF for invoice' })
    async generatePdf(@Param('id') id: string, @Res() res: Response) {
        const pdf = await this.invoicesService.generatePdf(id);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename="invoice.pdf"');
        res.send(pdf);
    }

    @Post(':id/email')
    @Roles(Role.SUPER_ADMIN, Role.MANAGER)
    @ApiOperation({ summary: 'Email invoice PDF to customer' })
    async emailInvoice(
        @Param('id') id: string,
        @Body() body: { to?: string },
    ) {
        return this.invoicesService.sendInvoiceEmail(id, body?.to);
    }

    @Patch(':id')
    @Roles(Role.SUPER_ADMIN)
    @ApiOperation({ summary: 'Update invoice (Admin only)' })
    update(@Param('id') id: string, @Body() updateInvoiceDto: UpdateInvoiceDto) {
        return this.invoicesService.update(id, updateInvoiceDto);
    }

    @Patch(':id/status')
    @Roles(Role.SUPER_ADMIN)
    @ApiOperation({ summary: 'Update invoice status (Admin only)' })
    updateStatus(@Param('id') id: string, @Body() dto: UpdateInvoiceStatusDto) {
        return this.invoicesService.updateStatus(id, dto.status);
    }

    @Delete(':id')
    @Roles(Role.SUPER_ADMIN)
    @ApiOperation({ summary: 'Delete invoice (Admin only)' })
    delete(@Param('id') id: string) {
        return this.invoicesService.delete(id);
    }
}
