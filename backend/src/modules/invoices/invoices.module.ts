import { Module } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { InvoicesController } from './invoices.controller';
import { PdfService } from './pdf.service';
import { EmailModule } from '../email/email.module';

@Module({
    imports: [EmailModule],
    controllers: [InvoicesController],
    providers: [InvoicesService, PdfService],
    exports: [InvoicesService],
})
export class InvoicesModule { }
